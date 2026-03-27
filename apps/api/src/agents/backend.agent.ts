/**
 * Backend Code Agent
 *
 * Generates complete backend code based on the orchestrator's task file.
 * Streams output chunks over WebSocket for real-time progress display.
 *
 * Key behaviors:
 *   - Implements every endpoint from the API contract
 *   - MVC architecture with proper middleware
 *   - Self-verification step before outputting
 *   - Trajectory reduction: only includes relevant snapshot files
 */

import type { WebSocket } from "ws";

import { callAIGenerate, callAIGenerateStream, type TokenUsage } from "../services/ai-generate.js";
import { extractJSON } from "../services/json-parser.js";
import { resolveApiKey, type UserSettings } from "../services/user-settings.js";
import { compressSnapshotForAgent } from "./helpers.js";

/**
 * Generate backend code for the given task file.
 * Returns a { "filepath": "code" } JSON map.
 */
export async function BackendCodeAgent(
    taskFile: any,
    previousCode: any | null,
    provider: string,
    model: string,
    ws: WebSocket,
    pluginContext: string = '',
    userSettings?: UserSettings
): Promise<unknown> {
    if (!taskFile.backendTasks || taskFile.backendTasks.length === 0) return "";

    /* Trajectory reduction: only include relevant snapshot files */
    const previousContext = compressSnapshotForAgent(
        previousCode ? { backendCode: previousCode } : null, 'backend', taskFile
    );

    /* Full API contract for code agents (they need exact field names) */
    const apiContract = taskFile.apiContract
        ? `\n\nAPI CONTRACT (implement EXACT endpoints with EXACT field names):\n${JSON.stringify({ endpoints: taskFile.apiContract.endpoints, models: taskFile.apiContract.models, auth: taskFile.apiContract.auth }, null, 2)}`
        : '';

    const techStack = taskFile.techStack?.backend || {};
    const runtime = techStack.runtime || 'Node.js';
    const framework = techStack.framework || 'Express';
    const database = techStack.database || 'MongoDB';

    const systemPrompt = `Expert ${runtime} backend engineer. Output ONLY valid JSON: { "filepath": "code" }.

STANDARDS:
- MVC architecture, input validation on every endpoint (Zod/Joi), proper HTTP status codes
- Centralized error middleware, async/await + try-catch, env vars for secrets (.env.example)
- cors({ origin: "*", credentials: true }), port from env || 3000, log listening port

SECURITY:
- bcrypt (10+ rounds), JWT with expiry, auth middleware, no stack traces in responses, input sanitization

DATABASE:
- Schema validation, indexes on queried fields, lean() reads, connection retry logic

API CONTRACT:
- Implement EVERY endpoint with EXACT field names and response shapes from the contract

FILES: server.js/index.js, routes/, models/, middleware/, .env.example

SELF-VERIFICATION (do this before outputting):
1. List every route you implement (method + path)
2. Compare each against the API CONTRACT — path, method, body fields, response shape must match exactly
3. Check: does every contract endpoint have a corresponding route? Fix any missing ones NOW
4. Verify: auth middleware on protected routes, .env.example includes all required vars`;

    const userPrompt = `Project: ${taskFile.projectMeta?.name || 'Project'}
Description: ${taskFile.projectMeta?.description || ''}
Runtime: ${runtime} | Framework: ${framework} | Database: ${database} | Libraries: ${(techStack.libraries || []).join(', ')}
Architecture: ${taskFile.architecture || ''}

TASKS:
${taskFile.backendTasks.map((t: any, i: number) => `${i + 1}. ${t.task}\n   Details: ${t.details}`).join('\n')}
${apiContract}${previousContext}${pluginContext}

Generate complete, production-ready backend code as JSON. Every file must be complete and runnable.`;

    let fullContent = '';
    const onUsage = (usage: TokenUsage) => {
        ws.send(JSON.stringify({ type: 'token_usage', agent: 'Backend Agent', usage }));
    };

    const beProvider = userSettings?.agentModels.backend.provider || provider;
    const beModel = userSettings?.agentModels.backend.model || model;
    const beKey = userSettings ? resolveApiKey(beProvider, userSettings.apiKeys) : '';

    for await (const chunk of callAIGenerateStream(beProvider, beModel, systemPrompt, userPrompt, onUsage, 16000, beKey || undefined)) {
        if (chunk) {
            fullContent += chunk;
            ws.send(JSON.stringify({
                type: 'backend_stream', content: chunk,
                accumulated: fullContent,
                tokenEstimate: Math.ceil(fullContent.length / 4),
            }));
        }
    }

    try {
        const parsed = extractJSON(fullContent.trim());
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch { /* JSON extraction failed — try recovery */ }

    /* Retry: ask the model to fix its JSON output */
    try {
        ws.send(JSON.stringify({ type: 'status', agent: 'Backend Agent', message: 'Fixing output format...' }));
        const fixPrompt = `Your previous response was not valid JSON. Here is what you generated:\n\n${fullContent.slice(0, 12000)}\n\nConvert this into a VALID JSON object where keys are file paths and values are complete file contents. Output ONLY the JSON, no markdown fences, no explanation.`;
        const fixedResponse = await callAIGenerate(beProvider, beModel, 'Return ONLY valid JSON: { "filepath": "code" }. No markdown, no explanation.', fixPrompt, 16000, beKey || undefined);
        const fixedParsed = extractJSON(fixedResponse.trim());
        if (fixedParsed && typeof fixedParsed === 'object' && !Array.isArray(fixedParsed)) return fixedParsed;
    } catch { /* recovery also failed */ }

    /* Last resort: return empty map so the frontend doesn't break */
    console.error('[backend-agent] Failed to extract valid JSON from response');
    return {};
}
