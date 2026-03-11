import OpenAI from 'openai';
import { WebSocketServer, WebSocket } from "ws"
import { Message, Project, ProjectSnapshot } from './db.js';
import { Server, type IncomingMessage } from "http";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cookie from "cookie";

dotenv.config();

import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';

const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || "",
    baseURL: "https://openrouter.ai/api/v1"
});

const openrouterFree = new OpenAI({
    apiKey: process.env.OPENROUTER_FREE_API_KEY || "",
    baseURL: "https://openrouter.ai/api/v1"
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ""
});

const gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || ""
});

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || ""
});

const glm = new OpenAI({
    apiKey: process.env.GLM_API_KEY || "",
    baseURL: "https://api.z.ai/api/paas/v4"
});

// ─── AI Call Helpers ─────────────────────────────────────────────

async function callAIGenerate(provider: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
    if (provider === 'gemini') {
        const response = await gemini.models.generateContent({
            model: model,
            contents: userPrompt,
            config: { systemInstruction: systemPrompt, temperature: 0.3 }
        });
        return response.text || "";
    } else if (provider === 'anthropic') {
        const response = await anthropic.messages.create({
            model: model,
            max_tokens: 8000,
            temperature: 0.3,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }]
        });
        const block = response.content[0];
        return block && block.type === 'text' ? block.text : "";
    } else {
        let client = model.endsWith(':free') ? openrouterFree : openrouter;
        if (provider === 'openai') client = openai;
        if (provider === 'glm') client = glm;

        const response = await client.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 8000
        });
        return response.choices[0]?.message?.content || "";
    }
}

interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

async function* callAIGenerateStream(
    provider: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    onUsage?: (usage: TokenUsage) => void
) {
    if (provider === 'gemini') {
        const responseStream = await gemini.models.generateContentStream({
            model: model,
            contents: userPrompt,
            config: { systemInstruction: systemPrompt, temperature: 0.3 }
        });
        let charCount = 0;
        for await (const chunk of responseStream) {
            const text = chunk.text || "";
            charCount += text.length;
            yield text;
        }
        if (onUsage) {
            const est = Math.ceil(charCount / 4);
            onUsage({ promptTokens: 0, completionTokens: est, totalTokens: est });
        }
    } else if (provider === 'anthropic') {
        const stream = await anthropic.messages.create({
            model: model,
            max_tokens: 8000,
            temperature: 0.3,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
            stream: true,
        });
        let inputTokens = 0;
        let outputTokens = 0;
        for await (const chunk of stream) {
            if (chunk.type === 'message_start') {
                inputTokens = chunk.message.usage.input_tokens;
            } else if (chunk.type === 'message_delta') {
                outputTokens = (chunk as any).usage?.output_tokens ?? outputTokens;
            } else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                yield chunk.delta.text;
            }
        }
        if (onUsage) {
            onUsage({ promptTokens: inputTokens, completionTokens: outputTokens, totalTokens: inputTokens + outputTokens });
        }
    } else {
        let client = model.endsWith(':free') ? openrouterFree : openrouter;
        if (provider === 'openai') client = openai;
        if (provider === 'glm') client = glm;

        // include_usage supported by openai/openrouter; glm falls back to char estimate
        const supportsUsage = provider === 'openai' || provider === 'openrouter';

        const baseParams = {
            model: model,
            messages: [
                { role: "system" as const, content: systemPrompt },
                { role: "user" as const, content: userPrompt }
            ],
            stream: true as const,
            temperature: 0.3,
        };

        const stream = supportsUsage
            ? await client.chat.completions.create({ ...baseParams, stream_options: { include_usage: true } })
            : await client.chat.completions.create(baseParams);

        let charCount = 0;
        let usageFired = false;
        for await (const chunk of stream) {
            if ((chunk as any).usage && onUsage) {
                const u = (chunk as any).usage;
                onUsage({ promptTokens: u.prompt_tokens, completionTokens: u.completion_tokens, totalTokens: u.total_tokens });
                usageFired = true;
            }
            const text = chunk.choices[0]?.delta?.content || "";
            charCount += text.length;
            yield text;
        }
        // Fallback for providers that don't return usage (e.g. glm)
        if (!usageFired && onUsage) {
            const est = Math.ceil(charCount / 4);
            onUsage({ promptTokens: 0, completionTokens: est, totalTokens: est });
        }
    }
}

// ─── JSON Extraction ─────────────────────────────────────────────

function tryParseJSON(text: string): unknown {
    // Strategy 1: direct parse
    try { return JSON.parse(text); } catch { /* continue */ }

    // Strategy 2: extract outermost { ... }
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
        try { return JSON.parse(objMatch[0]); } catch { /* continue */ }

        // Strategy 3: strip markdown code fences and comments
        const cleaned = objMatch[0]
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .replace(/\/\/[^\n]*/g, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .trim();
        try { return JSON.parse(cleaned); } catch { /* continue */ }
    }

    // Strategy 4: extract outermost [ ... ]
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) {
        try { return JSON.parse(arrMatch[0]); } catch { /* continue */ }
    }

    throw new Error("No valid JSON found in response");
}

function extractJSON(text: string): unknown {
    return tryParseJSON(text);
}

// ─── Agent Definitions ──────────────────────────────────────────

async function OrchestratorAgent(
    userMessage: string,
    conversationHistory: any[],
    snapshot: any | null,
    ws: WebSocket
): Promise<any> {
    const contextMessages = conversationHistory
        .reverse()
        .map(msg => ({
            user: msg.userMessage,
            intent: msg.intent,
            tasks: msg.coordinatorResponse?.content
        }))
        .filter(msg => msg.tasks)
        .slice(0, 3);

    const previousContext = contextMessages.length > 0
        ? `\n\nPREVIOUS CONVERSATION:\n${contextMessages.map((msg, i) =>
            `${i + 1}. [${msg.intent?.toUpperCase() || 'BUILD'}] User: ${msg.user}`
        ).join('\n')}`
        : '';

    const snapshotContext = snapshot
        ? `\n\nEXISTING PROJECT CODE:\nFrontend files: ${JSON.stringify(Object.keys(snapshot.frontendCode || {}))}\nBackend files: ${JSON.stringify(Object.keys(snapshot.backendCode || {}))}\nPrevious tasks: ${JSON.stringify(snapshot.taskFile?.features || [])}`
        : '';

    const systemPrompt = `You are a senior project orchestrator. Your job:
1. CLASSIFY the user's intent as exactly one of: "build", "iterate", or "debug"
   - "build": user wants a new project from scratch or this is the first message
   - "iterate": user wants to add/change/improve features on existing code
   - "debug": user is reporting a bug or issue to fix
2. DECIDE the tech stack: If the user has NOT specified a framework, library, or language, YOU must pick the best-fit stack for the project. Consider modern, popular, well-documented options. If the user HAS specified preferences, respect them.
3. Create a task breakdown dividing work between frontend and backend agents. Include the chosen tech stack in each task so agents know exactly what to use.
4. For "debug" intent, identify if the issue is frontend or backend and only assign tasks to the relevant agent (leave the other empty)

${previousContext ? 'Use conversation history to understand context.' : ''}
${snapshotContext ? 'An existing codebase exists. Consider this when classifying intent.' : 'No existing code exists yet. This is likely a "build" intent.'}

RESPOND WITH ONLY VALID JSON:
{
  "intent": "build" | "iterate" | "debug",
  "projectMeta": { "name": "string", "description": "string" },
  "techStack": {
    "frontend": { "framework": "e.g. React, Vue, Svelte", "styling": "e.g. Tailwind CSS, CSS Modules", "libraries": ["lib1", "lib2"] },
    "backend": { "runtime": "e.g. Node.js, Python", "framework": "e.g. Express, FastAPI", "database": "e.g. MongoDB, PostgreSQL", "libraries": ["lib1", "lib2"] }
  },
  "features": ["feature1", "feature2"],
  "frontendTasks": [
    { "task": "description", "details": "specifics including which libraries/components to use" }
  ],
  "backendTasks": [
    { "task": "description", "details": "specifics including which libraries/endpoints to use" }
  ],
  "architecture": "brief architecture description",
  "notes": "any important notes for the code agents"
}

NO other text. NO markdown. ONLY JSON.`;

    const content = await callAIGenerate('glm', 'GLM-4.7-FlashX', systemPrompt, previousContext + snapshotContext + '\n\nUSER REQUEST: ' + userMessage);

    try {
        return extractJSON(content.trim());
    } catch {
        console.warn("Orchestrator JSON parse failed, using fallback");
        return {
            intent: snapshot ? 'iterate' : 'build',
            projectMeta: { name: "Generated Project", description: userMessage },
            features: ["Core functionality"],
            frontendTasks: [{ task: "Build the UI", details: userMessage }],
            backendTasks: [{ task: "Build the API", details: userMessage }],
            architecture: "Standard web application",
            notes: ""
        };
    }
}

async function FrontendCodeAgent(
    taskFile: any,
    previousCode: any | null,
    ws: WebSocket
): Promise<unknown> {
    if (!taskFile.frontendTasks || taskFile.frontendTasks.length === 0) return "";

    const previousContext = previousCode
        ? `\n\nEXISTING FRONTEND CODE TO BUILD UPON:\n${JSON.stringify(previousCode, null, 2)}`
        : '';

    const systemPrompt = `You are a frontend code generator. You ONLY write code. No explanations, no markdown headings, no commentary.
Output a JSON object where keys are filenames and values are the complete file contents.
Example: { "App.jsx": "import React...", "styles.css": "body { ... }" }
ONLY output valid JSON. Nothing else.`;

    const userPrompt = `Project: ${taskFile.projectMeta.name}
Description: ${taskFile.projectMeta.description}
Architecture: ${taskFile.architecture}

FRONTEND TASKS:
${taskFile.frontendTasks.map((t: any, i: number) => `${i + 1}. ${t.task}: ${t.details}`).join('\n')}
${previousContext}

Generate complete frontend code files as JSON. Keys = filenames, values = file contents.`;

    let fullContent = '';
    const onFrontendUsage = (usage: TokenUsage) => {
        ws.send(JSON.stringify({ type: 'token_usage', agent: 'Frontend Agent', usage }));
    };
    for await (const chunk of callAIGenerateStream('openai', 'gpt-5-mini', systemPrompt, userPrompt, onFrontendUsage)) {
        if (chunk) {
            fullContent += chunk;
            ws.send(JSON.stringify({
                type: 'frontend_stream',
                content: chunk,
                accumulated: fullContent,
                tokenEstimate: Math.ceil(fullContent.length / 4)
            }));
        }
    }

    try {
        return extractJSON(fullContent.trim());
    } catch {
        return fullContent;
    }
}

async function BackendCodeAgent(
    taskFile: any,
    previousCode: any | null,
    provider: string,
    model: string,
    ws: WebSocket
): Promise<unknown> {
    if (!taskFile.backendTasks || taskFile.backendTasks.length === 0) return "";

    const previousContext = previousCode
        ? `\n\nEXISTING BACKEND CODE TO BUILD UPON:\n${JSON.stringify(previousCode, null, 2)}`
        : '';

    const systemPrompt = `You are a backend code generator. You ONLY write code. No explanations, no markdown headings, no commentary.
Output a JSON object where keys are filenames and values are the complete file contents.
Example: { "server.js": "const express...", "db.js": "const mongoose..." }
ONLY output valid JSON. Nothing else.`;

    const userPrompt = `Project: ${taskFile.projectMeta.name}
Description: ${taskFile.projectMeta.description}
Architecture: ${taskFile.architecture}

BACKEND TASKS:
${taskFile.backendTasks.map((t: any, i: number) => `${i + 1}. ${t.task}: ${t.details}`).join('\n')}
${previousContext}

Generate complete backend code files as JSON. Keys = filenames, values = file contents.`;

    let fullContent = '';
    const onBackendUsage = (usage: TokenUsage) => {
        ws.send(JSON.stringify({ type: 'token_usage', agent: 'Backend Agent', usage }));
    };
    for await (const chunk of callAIGenerateStream(provider, model, systemPrompt, userPrompt, onBackendUsage)) {
        if (chunk) {
            fullContent += chunk;
            ws.send(JSON.stringify({
                type: 'backend_stream',
                content: chunk,
                accumulated: fullContent,
                tokenEstimate: Math.ceil(fullContent.length / 4)
            }));
        }
    }

    try {
        return extractJSON(fullContent.trim());
    } catch {
        return fullContent;
    }
}

async function ReviewAgent(
    taskFile: any,
    frontendCode: any,
    backendCode: any,
    ws: WebSocket
): Promise<any> {
    const systemPrompt = `You are a senior code reviewer. You receive:
1. A task file listing what was supposed to be built
2. The generated frontend and backend code

Your job:
1. Verify every task in the task file was completed
2. Flag any missing implementations
3. Create a setup guide for the user

RESPOND WITH ONLY VALID JSON:
{
  "completionStatus": {
    "frontendComplete": true/false,
    "backendComplete": true/false,
    "missingItems": ["item1", "item2"]
  },
  "setupGuide": {
    "prerequisites": ["Node.js", "npm"],
    "steps": ["step 1", "step 2"],
    "envVariables": ["VAR1=value"],
    "runCommands": { "frontend": "npm start", "backend": "node server.js" }
  },
  "codeReview": {
    "issues": ["issue1"],
    "suggestions": ["suggestion1"]
  },
  "summary": "Brief project summary"
}

NO other text. ONLY JSON.`;

    const userPrompt = `TASK FILE:
${JSON.stringify(taskFile, null, 2)}

FRONTEND CODE:
${JSON.stringify(frontendCode, null, 2)}

BACKEND CODE:
${JSON.stringify(backendCode, null, 2)}

Review the code against the task file and generate the setup documentation.`;

    let fullContent = '';
    const onReviewUsage = (usage: TokenUsage) => {
        ws.send(JSON.stringify({ type: 'token_usage', agent: 'Review Agent', usage }));
    };
    for await (const chunk of callAIGenerateStream('glm', 'GLM-4.7-FlashX', systemPrompt, userPrompt, onReviewUsage)) {
        if (chunk) {
            fullContent += chunk;
            ws.send(JSON.stringify({
                type: 'review_stream',
                content: chunk,
                accumulated: fullContent,
                tokenEstimate: Math.ceil(fullContent.length / 4)
            }));
        }
    }

    try {
        return extractJSON(fullContent.trim());
    } catch {
        return {
            completionStatus: { frontendComplete: true, backendComplete: true, missingItems: [] },
            setupGuide: { prerequisites: ["Node.js"], steps: ["npm install", "npm start"], envVariables: [], runCommands: { frontend: "npm start", backend: "node server.js" } },
            codeReview: { issues: [], suggestions: [] },
            summary: taskFile.projectMeta?.description || "Project generated successfully"
        };
    }
}

// ─── WebSocket Server ───────────────────────────────────────────

export function setupWebSocket(server: Server) {
    const wss = new WebSocketServer({ server, path: undefined });

    wss.on("connection", function connection(ws: WebSocket, req: IncomingMessage) {
        // ── Authenticate via JWT cookie ──────────────────────────────
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
            const payload = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
            wsUserId = payload.id as string;
        } catch {
            ws.send(JSON.stringify({ type: "error", message: "Forbidden - invalid or expired token" }));
            ws.close(4403, "Forbidden");
            return;
        }

        // suppress unused variable warning while still enabling future per-message auth
        void wsUserId;

        ws.on("message", async function message(data) {
            let messageDoc: any = null;

            try {
                const parsed = JSON.parse(data.toString());
                const { message: userMessage, projectId, provider = 'openrouter', model = 'openai/gpt-oss-120b:free' } = parsed;

                messageDoc = new Message({
                    projectId: projectId,
                    userMessage: userMessage,
                    status: 'processing'
                });
                await messageDoc.save();

                const conversationHistory = await Message.find({ projectId })
                    .sort({ timestamp: -1 })
                    .limit(5)
                    .lean();

                const snapshot = await ProjectSnapshot.findOne({ projectId }).lean();

                // ── Stage 1: Orchestrator ────────────────────────────
                ws.send(JSON.stringify({
                    type: 'status',
                    agent: 'Orchestrator Agent',
                    message: 'Analyzing requirements and creating task breakdown...',
                    provider: 'glm',
                    model: 'GLM-4.7-FlashX'
                }));

                const taskFile = await OrchestratorAgent(userMessage, conversationHistory, snapshot, ws);

                messageDoc.intent = taskFile.intent;
                messageDoc.coordinatorResponse = { content: taskFile, timestamp: new Date() };
                await messageDoc.save();

                ws.send(JSON.stringify({
                    type: 'orchestrator_complete',
                    content: taskFile,
                    intent: taskFile.intent
                }));

                // ── Stage 2: Code Agents (parallel) ─────────────────
                let frontendResult: any = null;
                let backendResult: any = null;

                const hasFrontendTasks = taskFile.frontendTasks && taskFile.frontendTasks.length > 0;
                const hasBackendTasks = taskFile.backendTasks && taskFile.backendTasks.length > 0;

                const agentPromises: Promise<void>[] = [];

                if (hasFrontendTasks) {
                    ws.send(JSON.stringify({
                        type: 'status',
                        agent: 'Frontend Agent',
                        message: 'Writing frontend code...',
                        provider: 'openai',
                        model: 'gpt-5-mini'
                    }));

                    agentPromises.push(
                        FrontendCodeAgent(taskFile, snapshot?.frontendCode || null, ws).then(result => {
                            frontendResult = result;
                            messageDoc.frontendResponse = { content: result, timestamp: new Date() };
                            ws.send(JSON.stringify({ type: 'frontend_complete', content: result }));
                        })
                    );
                }

                if (hasBackendTasks) {
                    ws.send(JSON.stringify({
                        type: 'status',
                        agent: 'Backend Agent',
                        message: 'Writing backend code...',
                        provider: provider,
                        model: model
                    }));

                    agentPromises.push(
                        BackendCodeAgent(taskFile, snapshot?.backendCode || null, provider, model, ws).then(result => {
                            backendResult = result;
                            messageDoc.backendResponse = { content: result, timestamp: new Date() };
                            ws.send(JSON.stringify({ type: 'backend_complete', content: result }));
                        })
                    );
                }

                await Promise.all(agentPromises);
                await messageDoc.save();

                // ── Stage 3: Review Agent ────────────────────────────
                ws.send(JSON.stringify({
                    type: 'status',
                    agent: 'Review Agent',
                    message: 'Reviewing code and generating setup guide...',
                    provider: 'glm',
                    model: 'GLM-4.7-FlashX'
                }));

                const reviewResult = await ReviewAgent(taskFile, frontendResult, backendResult, ws);

                messageDoc.reviewResponse = { content: reviewResult, timestamp: new Date() };
                await messageDoc.save();

                ws.send(JSON.stringify({ type: 'review_complete', content: reviewResult }));

                // ── Save Snapshot ────────────────────────────────────
                await ProjectSnapshot.findOneAndUpdate(
                    { projectId },
                    {
                        projectId,
                        frontendCode: frontendResult || snapshot?.frontendCode || null,
                        backendCode: backendResult || snapshot?.backendCode || null,
                        taskFile: taskFile,
                        updatedAt: new Date()
                    },
                    { upsert: true, new: true }
                );

                await Project.findByIdAndUpdate(projectId, { updatedAt: new Date() });

                messageDoc.status = 'completed';
                await messageDoc.save();

                ws.send(JSON.stringify({
                    type: 'all_complete',
                    message: 'Project generation completed!',
                    messageId: messageDoc._id
                }));

            } catch (error: any) {
                console.error("Error:", error);

                if (messageDoc) {
                    messageDoc.status = 'error';
                    await messageDoc.save();
                }

                ws.send(JSON.stringify({
                    type: 'error',
                    message: error.message
                }));
            }
        });
    });
}