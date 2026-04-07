/**
 * Message Handler
 *
 * Handles the initial "message" event from the client — starts a new
 * pipeline or handles retry/regenerate requests.
 */

import type { ConnectionContext, PipelineState } from "../types.js";
import { emitEvent } from "../event-emitter.js";
import { Message, Project, ProjectSnapshot, PipelineRun } from "../../models/index.js";
import { getUserSettings, getMissingProviders } from "../../services/user-settings.js";
import { getPluginContext } from "../../services/plugin-context.js";
import { UnderstandingAgent } from "../../agents/understanding.agent.js";
import { handleProceed } from "./proceed.handler.js";
import { enqueuePipeline } from "../../services/pipeline-queue.js";
import type { CodeMap, ProjectSnapshotData } from "../../agents/types.js";

// ─── Retry Detection ────────────────────────────────────────────

const RETRY_PATTERNS = /^(retry|redo|regenerate|re-run|rerun|fix|rebuild)\s*(the\s+)?(frontend|backend|both|all|code|it)?\s*$/i;

function parseRetryIntent(msg: string): 'frontend' | 'backend' | 'both' | null {
    const match = msg.trim().match(RETRY_PATTERNS);
    if (!match) return null;
    const target = match[3]?.toLowerCase();
    if (target === 'backend') return 'backend';
    if (target === 'frontend') return 'frontend';
    if (target === 'both' || target === 'all' || target === 'code') return 'both';
    if (!target || target === 'it') return 'both';
    return null;
}

// ─── Handler ────────────────────────────────────────────────────

export async function handleNewMessage(
    parsed: any,
    ctx: ConnectionContext,
): Promise<void> {
    const { message: userMessage, projectId, provider = 'openrouter', model = 'openai/gpt-oss-120b:free' } = parsed;

    /* Verify the authenticated user owns this project */
    const project = await Project.findOne({ _id: projectId, userId: ctx.userId });
    if (!project) {
        emitEvent(ctx, { type: 'error', message: 'Not authorized for this project' });
        return;
    }

    /* Check if the user has API keys configured for required providers */
    const preCheckSettings = await getUserSettings(ctx.userId);
    const missingProviders = getMissingProviders(preCheckSettings);
    if (missingProviders.length > 0) {
        emitEvent(ctx, {
            type: 'error',
            message: `API keys not configured. Please go to Settings and add your API key for: ${missingProviders.join(', ')}. Without API keys, I can't generate code for you.`,
        });
        return;
    }

    /* Queue if a pipeline is already running for this project */
    if (ctx.pipeline) {
        const queued = await enqueuePipeline(projectId, ctx.userId, parsed);
        emitEvent(ctx, {
            type: 'status',
            agent: 'System',
            message: `Message queued (position ${queued.position}). Current pipeline will finish first.`,
        });
        return;
    }

    const snapshot = await ProjectSnapshot.findOne({ projectId }).lean() as ProjectSnapshotData | null;

    /* Check if this is a retry request with an existing task file */
    const retryTarget = parseRetryIntent(userMessage);
    if (retryTarget && snapshot?.taskFile) {
        const messageDoc = new Message({ projectId, userMessage, status: 'processing', intent: 'iterate' });
        await messageDoc.save();

        const [pluginContext, userSettings] = await Promise.all([
            getPluginContext(ctx.userId, projectId, userMessage),
            Promise.resolve(preCheckSettings),
        ]);

        const pipelineState: PipelineState = {
            projectId, userId: ctx.userId, provider, model,
            taskFile: snapshot.taskFile,
            messageDoc, snapshot,
            understanding: null, qaAnswers: null,
            pluginContext, userSettings,
            phase: 'building',
            feedbackIteration: 0,
            frontendResult: retryTarget === 'backend' ? (snapshot.frontendCode as CodeMap | null) : null,
            backendResult: retryTarget === 'frontend' ? (snapshot.backendCode as CodeMap | null) : null,
        };

        ctx.pipeline = pipelineState;

        try {
            const run = await PipelineRun.create({
                messageId: messageDoc._id, projectId, userId: ctx.userId,
                phase: 'building',
                state: { projectId, userId: ctx.userId, provider, model, phase: 'building', feedbackIteration: 0 },
                lastSeq: ctx.lastSeq,
            });
            ctx.pipelineRunId = run._id.toString();
        } catch { /* non-critical */ }

        emitEvent(ctx, {
            type: 'status', agent: 'Orchestrator Agent',
            message: `Retrying ${retryTarget} with existing plan...`,
        });
        emitEvent(ctx, { type: 'final_plan', content: snapshot.taskFile });

        await handleProceed({ proceed: true }, ctx);
        return;
    }

    const messageDoc = new Message({ projectId, userMessage, status: 'processing' });
    await messageDoc.save();

    const userSettings = preCheckSettings;
    const [understanding, pluginContext] = await Promise.all([
        UnderstandingAgent(userMessage, userSettings),
        getPluginContext(ctx.userId, projectId, userMessage),
    ]);

    emitEvent(ctx, {
        type: 'status', agent: 'Orchestrator Agent',
        message: 'Understanding your project...',
        provider: userSettings.agentModels.orchestrator.provider,
        model: userSettings.agentModels.orchestrator.model,
    });

    messageDoc.understandingResponse = { content: understanding, timestamp: new Date() };
    await messageDoc.save();

    ctx.pipeline = {
        projectId, userId: ctx.userId, provider, model,
        taskFile: null, messageDoc, snapshot,
        understanding, qaAnswers: null,
        pluginContext, userSettings,
        phase: 'understanding',
        feedbackIteration: 0,
        frontendResult: null,
        backendResult: null,
    };

    /* Create PipelineRun so state survives WebSocket disconnections */
    try {
        const run = await PipelineRun.create({
            messageId: messageDoc._id,
            projectId,
            userId: ctx.userId,
            phase: 'understanding',
            state: {
                projectId, userId: ctx.userId, provider, model,
                understanding, qaAnswers: null,
                phase: 'understanding',
                feedbackIteration: 0,
            },
            lastSeq: ctx.lastSeq,
        });
        ctx.pipelineRunId = run._id.toString();
    } catch (err: any) {
        console.error("[message] Failed to create PipelineRun:", err.message);
    }

    emitEvent(ctx, {
        type: 'understanding',
        summary: understanding.summary,
        projectName: understanding.projectName,
        questions: understanding.questions,
    });
}
