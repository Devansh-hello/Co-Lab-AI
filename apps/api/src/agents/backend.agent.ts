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
import { resolveApiKey, DEFAULT_AGENT_MODELS, type UserSettings } from "../services/user-settings.js";
import { compressSnapshotForAgent } from "./helpers.js";

/**
 * Generate backend code for the given task file.
 * Returns a { "filepath": "code" } JSON map.
 */
export async function BackendCodeAgent(
    taskFile: any,
    previousCode: any | null,
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

BEFORE GENERATING, think through (do not output):
- What are the 3 most likely failure points in this backend?
- Which endpoints have the most complex validation rules?
- What happens if the database is empty? What happens on first run?
- Which endpoints need auth and which are public?

STANDARDS:
- MVC architecture, input validation on every endpoint (Zod/Joi), proper HTTP status codes
- Centralized error middleware, async/await + try-catch, env vars for secrets (.env.example)
- cors({ origin: "*", credentials: true }), port from env || 3000, log listening port

SECURITY — BLOCKING (fail the generation if any are violated):
- Never interpolate user input into queries — always use parameterized queries or Mongoose methods
- Never return full error stacks to clients — map all errors to safe messages
- Never store JWT secrets in code — always reference process.env
- bcrypt (10+ rounds), JWT with expiry, auth middleware on all protected routes
- Auth middleware must verify token expiry, not just signature
- Never log sensitive data (passwords, tokens, API keys)
- Input sanitization on all user-supplied strings

DATABASE:
- Schema validation, indexes on queried fields, lean() reads, connection retry logic

API CONTRACT:
- Implement EVERY endpoint with EXACT field names and response shapes from the contract

ANTI-PATTERNS — NEVER DO THESE:
- Don't add validation for impossible inputs (e.g., checking if a required field exists when the schema enforces it)
- Don't create a utils/ folder with one function in it
- Don't add pagination to endpoints that will never return more than 50 items
- Don't add rate limiting middleware unless the user asked for it
- Don't create abstract base classes for a single implementation
- Don't add logging to every function — only log at boundaries (request in, response out, errors)
- Don't add a /health endpoint unless the user asked for monitoring
- Don't create separate controller files if each controller has only one function

OUTPUT BUDGET:
- Complexity 1-2: 4-8 files. server.js + routes + models + middleware is enough.
- Complexity 3: 8-12 files. Standard MVC structure.
- Complexity 4-5: 12-20 files. Full project with proper separation.

GENERATION ORDER (generate files in this sequence):
1. package.json (establishes all dependencies)
2. .env.example (all required vars with placeholder values showing expected format)
3. Database connection + models (schemas with validation)
4. Middleware (auth, error handler, validation)
5. Routes (in API contract order)
6. server.js/index.js (LAST — all imports already defined)

FILES: server.js/index.js, routes/, models/, middleware/, .env.example

SELF-VERIFICATION (do this before outputting):
1. List every route you implement (method + path)
2. Compare each against the API CONTRACT — path, method, body fields, response shape must match exactly
3. Check: does every contract endpoint have a corresponding route? Fix any missing ones NOW
4. Verify: auth middleware on protected routes, .env.example includes all required vars
5. Verify: every model field referenced in routes exists in the schema
6. Verify: error middleware catches all async errors (no unhandled promise rejections)`;

    const intent = taskFile.intent || 'build';
    const intentInstruction = intent === 'build'
        ? 'Generate complete, production-ready backend code as JSON. Every file must be complete and runnable.'
        : intent === 'debug'
        ? 'Fix the specified bug. Output ONLY the files that need changes — do NOT regenerate unchanged files. Each file you output must be COMPLETE (not a diff). Unchanged files will be preserved automatically.'
        : 'Extend the existing code to add the requested features. Output ONLY new or modified files — do NOT regenerate unchanged files. Each file you output must be COMPLETE (not a diff). Unchanged files will be preserved automatically.';

    const userPrompt = `Project: ${taskFile.projectMeta?.name || 'Project'}
Description: ${taskFile.projectMeta?.description || ''}
Runtime: ${runtime} | Framework: ${framework} | Database: ${database} | Libraries: ${(techStack.libraries || []).join(', ')}
Architecture: ${taskFile.architecture || ''}
Intent: ${intent.toUpperCase()}

TASKS:
${taskFile.backendTasks.map((t: any, i: number) => `${i + 1}. ${t.task}\n   Details: ${t.details}`).join('\n')}
${apiContract}${previousContext}${pluginContext}

${intentInstruction}`;

    let fullContent = '';
    const onUsage = (usage: TokenUsage) => {
        ws.send(JSON.stringify({ type: 'token_usage', agent: 'Backend Agent', usage }));
    };

    const beProvider = userSettings?.agentModels.backend.provider || DEFAULT_AGENT_MODELS.backend.provider;
    const beModel = userSettings?.agentModels.backend.model || DEFAULT_AGENT_MODELS.backend.model;
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
