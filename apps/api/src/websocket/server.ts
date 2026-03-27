/**
 * WebSocket Server
 *
 * Handles real-time communication for the agent pipeline. Each WebSocket
 * connection maps to one user session. The pipeline flows through these phases:
 *
 *   1. understanding  - Analyze the user's request
 *   2. qa             - (Optional) Clarifying questions
 *   3. planning       - Orchestrator generates task file
 *   4. building       - Frontend + Backend agents generate code in parallel
 *   5. testing        - Review + Test agents evaluate quality
 *   6. feedback       - (Conditional) Fix agent patches issues
 *   7. done           - Snapshot saved, message completed
 *
 * Message types received from client:
 *   - message                - Start a new pipeline
 *   - understanding_response - User confirms/cancels after understanding
 *   - qa_complete            - User answers clarifying questions
 *   - proceed                - User confirms/cancels after seeing the plan
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server, IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import cookie from "cookie";

import { JWT_SECRET } from "../config/env.js";
import { Message, Project, ProjectSnapshot } from "../models/index.js";
import { getUserSettings, type UserSettings } from "../services/user-settings.js";
import { getPluginContext } from "../services/plugin-context.js";

import { UnderstandingAgent, type UnderstandingResponse } from "../agents/understanding.agent.js";
import { OrchestratorAgent } from "../agents/orchestrator.agent.js";
import { FrontendCodeAgent } from "../agents/frontend.agent.js";
import { BackendCodeAgent } from "../agents/backend.agent.js";
import { ReviewAgent } from "../agents/review.agent.js";
import { TestAgent } from "../agents/test.agent.js";
import { FeedbackFixAgent } from "../agents/feedback.agent.js";
import { computeQualityScore } from "../agents/quality-scorer.js";
import type { TaskFile, CodeMap, ProjectSnapshotData, ReviewResult, TestResult } from "../agents/types.js";

// ─── Pipeline State ─────────────────────────────────────────────

/** Tracks the current state of a user's pipeline session */
interface PipelineState {
    projectId: string;
    userId: string;
    provider: string;
    model: string;
    taskFile: TaskFile | null;
    messageDoc: InstanceType<typeof Message>;
    snapshot: ProjectSnapshotData | null;
    understanding: UnderstandingResponse | null;
    qaAnswers: Array<{ questionId: string; answer: string }> | null;
    pluginContext: string;
    userSettings: UserSettings;
    phase: 'understanding' | 'qa' | 'planning' | 'building' | 'testing' | 'feedback' | 'done';
    feedbackIteration: number;
    frontendResult: CodeMap | null;
    backendResult: CodeMap | null;
}

// ─── WebSocket Setup ────────────────────────────────────────────

/**
 * Attach a WebSocket server to an existing HTTP server.
 * Authenticates connections via JWT cookie and manages pipeline state.
 */
export function setupWebSocket(server: Server) {
    const wss = new WebSocketServer({ server, path: "/ws" });

    // ── Heartbeat: detect dead connections ──────────────────
    const HEARTBEAT_INTERVAL = 30_000;
    const heartbeat = setInterval(() => {
        for (const client of wss.clients) {
            const ws = client as WebSocket & { isAlive?: boolean };
            if (ws.isAlive === false) {
                ws.terminate();
                continue;
            }
            ws.isAlive = false;
            ws.ping();
        }
    }, HEARTBEAT_INTERVAL);

    wss.on("close", () => clearInterval(heartbeat));

    wss.on("connection", function connection(ws: WebSocket & { isAlive?: boolean }, req: IncomingMessage) {
        ws.isAlive = true;
        ws.on("pong", () => { ws.isAlive = true; });

        /* Authenticate via cookie */
        const rawCookies = req.headers.cookie || "";
        const cookies = cookie.parse(rawCookies);
        const token = cookies.token;

        if (!token) {
            ws.send(JSON.stringify({ type: "error", message: "Unauthorized - token missing" }));
            ws.close(4401, "Unauthorized");
            return;
        }

        let wsUserId: string;
        try {
            const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
            wsUserId = payload.id as string;
        } catch {
            ws.send(JSON.stringify({ type: "error", message: "Forbidden - invalid or expired token" }));
            ws.close(4403, "Forbidden");
            return;
        }

        let pipeline: PipelineState | null = null;
        let pipelineAbort: AbortController | null = null;

        /* Rate limiting: max 5 new pipeline messages per minute */
        const messageTimestamps: number[] = [];
        const WS_RATE_LIMIT = 5;
        const WS_RATE_WINDOW_MS = 60_000;

        /* Abort in-flight pipeline on disconnect */
        ws.on("close", () => {
            if (pipelineAbort) {
                pipelineAbort.abort();
                pipelineAbort = null;
            }
            pipeline = null;
        });

        ws.on("message", async function message(data) {
            try {
                const parsed = JSON.parse(data.toString());
                const msgType = parsed.type || 'message';

                /* Throttle new pipeline messages (not control messages) */
                if (msgType === 'message') {
                    const now = Date.now();
                    while (messageTimestamps.length > 0 && now - messageTimestamps[0]! > WS_RATE_WINDOW_MS) {
                        messageTimestamps.shift();
                    }
                    if (messageTimestamps.length >= WS_RATE_LIMIT) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded. Please wait before sending another message.' }));
                        return;
                    }
                    messageTimestamps.push(now);
                }

                // ── Handle: New message (start pipeline) ────────
                if (msgType === 'message') {
                    /* Abort any existing pipeline before starting a new one */
                    if (pipelineAbort) pipelineAbort.abort();
                    pipelineAbort = new AbortController();
                    await handleNewMessage(parsed, wsUserId, ws, pipeline, (p) => { pipeline = p; });
                    return;
                }

                // ── Handle: Understanding response ──────────────
                if (msgType === 'understanding_response') {
                    await handleUnderstandingResponse(parsed, ws, pipeline);
                    return;
                }

                // ── Handle: Q&A answers complete ────────────────
                if (msgType === 'qa_complete') {
                    await handleQAComplete(parsed, ws, pipeline);
                    return;
                }

                // ── Handle: Proceed with building ───────────────
                if (msgType === 'proceed') {
                    await handleProceed(parsed, ws, pipeline, () => {
                        pipeline = null;
                        pipelineAbort = null;
                    });
                    return;
                }

            } catch (error: any) {
                console.error("[ws] Error:", error);

                if (pipeline?.messageDoc) {
                    pipeline.messageDoc.status = 'error';
                    await pipeline.messageDoc.save();
                }

                ws.send(JSON.stringify({
                    type: 'error',
                    message: error.message,
                }));
            }
        });
    });
}

// ─── Message Handlers ───────────────────────────────────────────

/** Detect if a message is a short retry/regeneration request */
const RETRY_PATTERNS = /^(retry|redo|regenerate|re-run|rerun|fix|rebuild)\s*(the\s+)?(frontend|backend|both|all|code|it)?\s*$/i;

function parseRetryIntent(msg: string): 'frontend' | 'backend' | 'both' | null {
    const match = msg.trim().match(RETRY_PATTERNS);
    if (!match) return null;
    const target = match[3]?.toLowerCase();
    if (target === 'backend') return 'backend';
    if (target === 'frontend') return 'frontend';
    if (target === 'both' || target === 'all' || target === 'code') return 'both';
    // "retry" with no target — defaults to 'both'
    if (!target || target === 'it') return 'both';
    return null;
}

/** Start a new pipeline from a user message */
async function handleNewMessage(
    parsed: any,
    wsUserId: string,
    ws: WebSocket,
    _pipeline: PipelineState | null,
    setPipeline: (p: PipelineState) => void
) {
    const { message: userMessage, projectId, provider = 'openrouter', model = 'openai/gpt-oss-120b:free' } = parsed;

    /* Verify the authenticated user owns this project */
    const project = await Project.findOne({ _id: projectId, userId: wsUserId });
    if (!project) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not authorized for this project' }));
        return;
    }

    const snapshot = await ProjectSnapshot.findOne({ projectId }).lean() as ProjectSnapshotData | null;

    /* Check if this is a retry request with an existing task file */
    const retryTarget = parseRetryIntent(userMessage);
    if (retryTarget && snapshot?.taskFile) {
        const messageDoc = new Message({ projectId, userMessage, status: 'processing', intent: 'iterate' });
        await messageDoc.save();

        const [pluginContext, userSettings] = await Promise.all([
            getPluginContext(wsUserId),
            getUserSettings(wsUserId),
        ]);

        const pipelineState: PipelineState = {
            projectId, userId: wsUserId, provider, model,
            taskFile: snapshot.taskFile,
            messageDoc, snapshot,
            understanding: null, qaAnswers: null,
            pluginContext, userSettings,
            phase: 'building',
            feedbackIteration: 0,
            frontendResult: retryTarget === 'backend' ? (snapshot.frontendCode as CodeMap | null) : null,
            backendResult: retryTarget === 'frontend' ? (snapshot.backendCode as CodeMap | null) : null,
        };

        setPipeline(pipelineState);

        /* Skip understanding/Q&A/planning — jump straight to build */
        ws.send(JSON.stringify({
            type: 'status', agent: 'Orchestrator Agent',
            message: `Retrying ${retryTarget} with existing plan...`,
        }));

        /* Send the existing plan so the frontend shows it */
        ws.send(JSON.stringify({ type: 'final_plan', content: snapshot.taskFile }));

        /* Auto-proceed */
        await handleProceed(
            { proceed: true },
            ws,
            pipelineState,
            () => { setPipeline(null as any); }
        );
        return;
    }

    const messageDoc = new Message({ projectId, userMessage, status: 'processing' });
    await messageDoc.save();

    ws.send(JSON.stringify({
        type: 'status', agent: 'Orchestrator Agent',
        message: 'Understanding your project...',
        provider: 'glm', model: 'GLM-4.7-FlashX',
    }));

    /* Run understanding, plugin context, and user settings in parallel */
    const [understanding, pluginContext, userSettings] = await Promise.all([
        UnderstandingAgent(userMessage),
        getPluginContext(wsUserId),
        getUserSettings(wsUserId),
    ]);

    messageDoc.understandingResponse = { content: understanding, timestamp: new Date() };
    await messageDoc.save();

    setPipeline({
        projectId, userId: wsUserId, provider, model,
        taskFile: null, messageDoc, snapshot,
        understanding, qaAnswers: null,
        pluginContext, userSettings,
        phase: 'understanding',
        feedbackIteration: 0,
        frontendResult: null,
        backendResult: null,
    });

    ws.send(JSON.stringify({
        type: 'understanding',
        summary: understanding.summary,
        projectName: understanding.projectName,
        questions: understanding.questions,
    }));
}

/** Handle user confirming/cancelling after understanding phase */
async function handleUnderstandingResponse(
    parsed: any,
    ws: WebSocket,
    pipeline: PipelineState | null
) {
    if (!pipeline) {
        ws.send(JSON.stringify({ type: 'error', message: 'No pending project' }));
        return;
    }

    const { confirmed } = parsed;
    if (!confirmed) {
        pipeline.messageDoc.status = 'cancelled';
        await pipeline.messageDoc.save();
        ws.send(JSON.stringify({ type: 'cancelled', message: 'Project cancelled by user.' }));
        return;
    }

    /* If no questions to ask, go straight to planning */
    if (!pipeline.understanding || pipeline.understanding.questions.length === 0) {
        pipeline.phase = 'planning';
        await runOrchestratorAndSendPlan(pipeline, ws);
        return;
    }

    pipeline.phase = 'qa';
}

/** Handle Q&A answers and proceed to orchestrator */
async function handleQAComplete(
    parsed: any,
    ws: WebSocket,
    pipeline: PipelineState | null
) {
    if (!pipeline) {
        ws.send(JSON.stringify({ type: 'error', message: 'No pending project' }));
        return;
    }

    const { answers } = parsed;
    pipeline.qaAnswers = answers;
    pipeline.phase = 'planning';
    pipeline.messageDoc.qaAnswers = answers;
    await pipeline.messageDoc.save();

    /* Build enriched message for the orchestrator (includes Q&A context)
     * but keep the original user message clean for display */
    const originalMessage = pipeline.messageDoc.userMessage;
    const qaContext = Array.isArray(answers) && answers.length > 0
        ? '\n\nCLARIFICATIONS FROM USER:\n' + answers.map(
            (a: { questionId: string; answer: string }) => {
                const q = pipeline!.understanding?.questions.find(q => q.id === a.questionId);
                return `Q: ${q?.question || a.questionId}\nA: ${a.answer}`;
            }
        ).join('\n')
        : '';

    /* Store enriched version for orchestrator but don't overwrite the displayed message */
    (pipeline.messageDoc as any)._enrichedMessage = `${originalMessage}${qaContext}`;
    await runOrchestratorAndSendPlan(pipeline, ws);
}

/** Run the orchestrator agent and send the plan to the client */
async function runOrchestratorAndSendPlan(pipeline: PipelineState, ws: WebSocket) {
    ws.send(JSON.stringify({
        type: 'status', agent: 'Orchestrator Agent',
        message: 'Architecting your project...',
        provider: 'glm', model: 'GLM-4.7-FlashX',
    }));

    const conversationHistory = await Message.find({ projectId: pipeline.projectId })
        .sort({ timestamp: -1 }).limit(5).lean();

    /* Use enriched message (with Q&A context) if available, otherwise original */
    const orchestratorMessage = (pipeline.messageDoc as any)._enrichedMessage || pipeline.messageDoc.userMessage;

    const taskFile = await OrchestratorAgent(
        orchestratorMessage,
        conversationHistory,
        pipeline.snapshot, ws,
        pipeline.pluginContext,
        pipeline.userSettings
    );

    pipeline.taskFile = taskFile;
    pipeline.messageDoc.intent = taskFile.intent;
    pipeline.messageDoc.coordinatorResponse = { content: taskFile, timestamp: new Date() };
    await pipeline.messageDoc.save();

    ws.send(JSON.stringify({ type: 'final_plan', content: taskFile }));
}

/** Handle user proceeding or stopping after seeing the plan */
async function handleProceed(
    parsed: any,
    ws: WebSocket,
    pipeline: PipelineState | null,
    clearPipeline: () => void
) {
    if (!pipeline) {
        ws.send(JSON.stringify({ type: 'error', message: 'No pending pipeline to proceed' }));
        return;
    }

    const { proceed } = parsed;
    if (!proceed) {
        pipeline.messageDoc.status = 'cancelled';
        await pipeline.messageDoc.save();
        ws.send(JSON.stringify({ type: 'cancelled', message: 'Generation stopped by user.' }));
        clearPipeline();
        return;
    }

    pipeline.phase = 'building';
    const { messageDoc, snapshot, provider, model, projectId } = pipeline;
    const taskFile = pipeline.taskFile;

    if (!taskFile) {
        ws.send(JSON.stringify({ type: 'error', message: 'No task plan available' }));
        return;
    }

    // ── Send complexity score ───────────────────────────────
    const complexity = taskFile.complexity || { overall: 3 };
    messageDoc.complexityScore = complexity.overall;
    ws.send(JSON.stringify({
        type: 'complexity_score',
        score: complexity.overall,
        reasoning: complexity.reasoning || '',
    }));

    const isDirect = taskFile.intent === 'debug' && complexity.overall <= 2;

    // ── Code Agents (parallel) ──────────────────────────────
    // If pipeline already has results (e.g. from retry), reuse them
    let frontendResult: CodeMap | null = pipeline.frontendResult || null;
    let backendResult: CodeMap | null = pipeline.backendResult || null;

    const hasFrontendTasks = taskFile.frontendTasks && taskFile.frontendTasks.length > 0;
    const hasBackendTasks = taskFile.backendTasks && taskFile.backendTasks.length > 0;
    const agentPromises: Promise<void>[] = [];

    if (hasFrontendTasks && !frontendResult) {
        ws.send(JSON.stringify({
            type: 'status', agent: 'Frontend Agent',
            message: 'Building frontend...',
            provider: 'openai', model: 'gpt-5-mini',
        }));

        agentPromises.push(
            FrontendCodeAgent(taskFile, snapshot?.frontendCode || null, ws, pipeline.pluginContext, pipeline.userSettings)
                .then(result => {
                    frontendResult = result as CodeMap;
                    messageDoc.frontendResponse = { content: result, timestamp: new Date() };
                    ws.send(JSON.stringify({ type: 'frontend_complete', content: result }));
                })
        );
    } else if (frontendResult) {
        /* Reusing existing frontend — send as complete */
        messageDoc.frontendResponse = { content: frontendResult, timestamp: new Date() };
        ws.send(JSON.stringify({ type: 'frontend_complete', content: frontendResult }));
    }

    if (hasBackendTasks && !backendResult) {
        ws.send(JSON.stringify({
            type: 'status', agent: 'Backend Agent',
            message: 'Building backend...',
            provider, model,
        }));

        agentPromises.push(
            BackendCodeAgent(taskFile, snapshot?.backendCode || null, provider, model, ws, pipeline.pluginContext, pipeline.userSettings)
                .then(result => {
                    backendResult = result as CodeMap;
                    messageDoc.backendResponse = { content: result, timestamp: new Date() };
                    ws.send(JSON.stringify({ type: 'backend_complete', content: result }));
                })
        );
    } else if (backendResult) {
        /* Reusing existing backend — send as complete */
        messageDoc.backendResponse = { content: backendResult, timestamp: new Date() };
        ws.send(JSON.stringify({ type: 'backend_complete', content: backendResult }));
    }

    await Promise.all(agentPromises);
    pipeline.frontendResult = frontendResult;
    pipeline.backendResult = backendResult;
    await messageDoc.save();

    // ── Review Agent ────────────────────────────────────────
    ws.send(JSON.stringify({
        type: 'status', agent: 'Review Agent',
        message: 'Reviewing code and checking API compatibility...',
        provider: 'glm', model: 'GLM-4.7-FlashX',
    }));

    const reviewResult = await ReviewAgent(taskFile, frontendResult, backendResult, ws, pipeline.userSettings);
    messageDoc.reviewResponse = { content: reviewResult, timestamp: new Date() };
    await messageDoc.save();
    ws.send(JSON.stringify({ type: 'review_complete', content: reviewResult }));

    // ── Test Agent ──────────────────────────────────────────
    pipeline.phase = 'testing';
    ws.send(JSON.stringify({
        type: 'status', agent: 'Test Agent',
        message: 'Generating test cases...',
        provider: pipeline.userSettings.agentModels.test.provider || 'glm',
        model: pipeline.userSettings.agentModels.test.model || 'GLM-4.7-FlashX',
    }));

    const testResult = await TestAgent(taskFile, frontendResult, backendResult, ws, pipeline.userSettings);
    messageDoc.testResponse = { content: testResult, timestamp: new Date() };
    await messageDoc.save();
    ws.send(JSON.stringify({ type: 'test_complete', content: testResult }));

    // ── Quality Scoring ─────────────────────────────────────
    const quality = computeQualityScore(reviewResult, testResult, taskFile);
    messageDoc.qualityScore = { grade: quality.grade, metrics: quality.metrics, timestamp: new Date() };
    await messageDoc.save();

    ws.send(JSON.stringify({
        type: 'quality_score',
        grade: quality.grade,
        metrics: quality.metrics,
        overall: quality.overall,
        needsFeedback: quality.needsFeedback,
    }));

    // ── Feedback Loop (max 1 iteration) ─────────────────────
    // AgentDropout-inspired: only re-run agents that have issues.
    if (quality.needsFeedback && pipeline.feedbackIteration < 1 && !isDirect) {
        pipeline.phase = 'feedback';
        pipeline.feedbackIteration++;
        messageDoc.feedbackIterations = pipeline.feedbackIteration;

        const actionableFixes = reviewResult?.codeReview?.actionableFixes || [];
        const apiMismatches = reviewResult?.apiCompatibility?.mismatches || [];
        const allIssues = [...actionableFixes, ...apiMismatches];

        /* Classify issues by side for selective re-run */
        const frontendIssues = allIssues.filter((i: string) =>
            /frontend|component|react|ui|page|css|style|jsx|tsx/i.test(i));
        const backendIssues = allIssues.filter((i: string) =>
            /backend|endpoint|route|api|server|database|model|auth|middleware|schema/i.test(i));

        /* Unclassified issues default to backend */
        const unclassified = allIssues.filter((i: string) =>
            !frontendIssues.includes(i) && !backendIssues.includes(i));
        if (unclassified.length > 0) backendIssues.push(...unclassified);

        const skippedFrontend = frontendIssues.length === 0;
        const skippedBackend = backendIssues.length === 0;

        ws.send(JSON.stringify({
            type: 'feedback_iteration',
            iteration: pipeline.feedbackIteration,
            issues: allIssues.slice(0, 5),
            message: `Quality grade ${quality.grade} — fixing ${allIssues.length} issues${skippedFrontend ? ' (frontend OK, skipping)' : ''}${skippedBackend ? ' (backend OK, skipping)' : ''}...`,
        }));

        const fixPromises: Promise<void>[] = [];

        if (frontendIssues.length > 0 && frontendResult) {
            ws.send(JSON.stringify({
                type: 'status', agent: 'Frontend Agent',
                message: `Fixing ${frontendIssues.length} issues...`,
                provider: pipeline.userSettings.agentModels.frontend.provider,
                model: pipeline.userSettings.agentModels.frontend.model,
            }));
            fixPromises.push(
                FeedbackFixAgent(frontendIssues, frontendResult, 'frontend', taskFile, ws, pipeline.userSettings)
                    .then(fixed => {
                        frontendResult = fixed as CodeMap;
                        pipeline!.frontendResult = fixed as CodeMap;
                        messageDoc.frontendResponse = { content: fixed, timestamp: new Date() };
                        ws.send(JSON.stringify({ type: 'frontend_complete', content: fixed }));
                    })
            );
        }

        if (backendIssues.length > 0 && backendResult) {
            ws.send(JSON.stringify({
                type: 'status', agent: 'Backend Agent',
                message: `Fixing ${backendIssues.length} issues...`,
                provider: pipeline.userSettings.agentModels.backend.provider,
                model: pipeline.userSettings.agentModels.backend.model,
            }));
            fixPromises.push(
                FeedbackFixAgent(backendIssues, backendResult, 'backend', taskFile, ws, pipeline.userSettings)
                    .then(fixed => {
                        backendResult = fixed as CodeMap;
                        pipeline!.backendResult = fixed as CodeMap;
                        messageDoc.backendResponse = { content: fixed, timestamp: new Date() };
                        ws.send(JSON.stringify({ type: 'backend_complete', content: fixed }));
                    })
            );
        }

        if (fixPromises.length > 0) {
            await Promise.all(fixPromises);
            await messageDoc.save();

            /* Re-score after fixes */
            const postFixQuality = computeQualityScore(reviewResult, testResult, taskFile);
            ws.send(JSON.stringify({
                type: 'quality_score',
                grade: postFixQuality.grade,
                metrics: postFixQuality.metrics,
                overall: postFixQuality.overall,
                needsFeedback: false,
                iteration: pipeline.feedbackIteration,
            }));
        }
    }

    // ── Save Snapshot ───────────────────────────────────────
    await ProjectSnapshot.findOneAndUpdate(
        { projectId },
        {
            projectId,
            frontendCode: frontendResult || snapshot?.frontendCode || null,
            backendCode: backendResult || snapshot?.backendCode || null,
            taskFile,
            updatedAt: new Date(),
        },
        { upsert: true, new: true }
    );

    await Project.findByIdAndUpdate(projectId, { updatedAt: new Date() });

    messageDoc.status = 'completed';
    await messageDoc.save();

    ws.send(JSON.stringify({
        type: 'all_complete',
        message: 'Project generation completed!',
        messageId: messageDoc._id,
        qualityGrade: quality.grade,
        feedbackIterations: pipeline.feedbackIteration,
    }));

    clearPipeline();
}
