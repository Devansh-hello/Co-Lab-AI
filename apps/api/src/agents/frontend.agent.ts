/**
 * Frontend Code Agent
 *
 * Generates complete frontend code based on the orchestrator's task file.
 * Streams output chunks over WebSocket for real-time progress display.
 *
 * Key behaviors:
 *   - Uses API contract for exact endpoint/field matching
 *   - Includes Vite proxy config for dev server
 *   - Self-verification step before outputting (Chain-of-Verification)
 *   - Trajectory reduction: only includes relevant snapshot files
 */

import type { WebSocket } from "ws";

import { callAIGenerate, callAIGenerateStream, type TokenUsage } from "../services/ai-generate.js";
import { extractJSON } from "../services/json-parser.js";
import { resolveApiKey, type UserSettings } from "../services/user-settings.js";
import { compressSnapshotForAgent } from "./helpers.js";

/**
 * Generate frontend code for the given task file.
 * Returns a { "filepath": "code" } JSON map.
 */
export async function FrontendCodeAgent(
    taskFile: any,
    previousCode: any | null,
    ws: WebSocket,
    pluginContext: string = '',
    userSettings?: UserSettings
): Promise<unknown> {
    if (!taskFile.frontendTasks || taskFile.frontendTasks.length === 0) return "";

    /* Trajectory reduction: only include relevant snapshot files */
    const previousContext = compressSnapshotForAgent(
        previousCode ? { frontendCode: previousCode } : null, 'frontend', taskFile
    );

    /* Full API contract for code agents (they need exact field names) */
    const apiContract = taskFile.apiContract
        ? `\n\nAPI CONTRACT (use EXACT endpoints and field names):\n${JSON.stringify({ endpoints: taskFile.apiContract.endpoints, models: taskFile.apiContract.models, auth: taskFile.apiContract.auth }, null, 2)}`
        : '';

    const techStack = taskFile.techStack?.frontend || {};
    const framework = techStack.framework || 'React';
    const styling = techStack.styling || 'Tailwind CSS';

    const systemPrompt = `Expert ${framework} frontend engineer. Output ONLY valid JSON: { "filepath": "code" }.

STANDARDS:
- Functional components + hooks, strict TypeScript (no \`any\`), custom hooks for shared logic
- Loading/error states on all async ops, form validation, responsive ${styling}
- Semantic HTML, aria-labels, React Router with route protection, Context/Zustand for global state

STYLING — CRITICAL:
- NEVER use CSS Modules (*.module.css) — they cause runtime errors in the preview environment
- Use ONE of: Tailwind CSS utility classes (preferred), a single global src/index.css, or inline styles
- If using Tailwind: include it in vite dependencies and configure postcss/tailwind properly
- All styles must work without any build-time CSS transforms beyond standard Vite

API RULES:
- Centralized API utility (src/lib/api.ts) with relative URLs only ("/api/...", never localhost)
- Auth token interceptor, typed requests, 401 → redirect to login
- Use API contract endpoints EXACTLY as specified

CRITICAL — VITE CONFIG:
- Always include: server: { proxy: { "/api": { target: "http://localhost:3000", changeOrigin: true } } }

CRITICAL — EVERY FILE MUST BE COMPLETE:
- Every import must resolve to a file you generate. Never import a file you did not include in the output.
- index.html MUST be included at the root with a <div id="root"></div> and <script type="module" src="/src/main.tsx"></script>
- package.json MUST list all dependencies used in the code (react, react-dom, react-router-dom, etc.)
- vite.config.ts MUST import and use @vitejs/plugin-react

FILES: index.html, package.json, vite.config.ts, src/App.tsx, src/main.tsx, src/index.css, src/lib/api.ts, src/context/, src/components/, src/pages/, src/hooks/

SELF-VERIFICATION (do this before outputting):
1. For every import statement, verify the imported file exists in your output
2. List every API call you make (fetch/axios URL)
3. Compare each against the API CONTRACT — path, method, and field names must match exactly
4. Fix any mismatches NOW before outputting
5. Verify vite.config.ts has the proxy config and @vitejs/plugin-react
6. Verify package.json lists ALL dependencies used in code`;

    const userPrompt = `Project: ${taskFile.projectMeta?.name || 'Project'}
Description: ${taskFile.projectMeta?.description || ''}
Framework: ${framework} | Styling: ${styling} | Libraries: ${(techStack.libraries || []).join(', ')}
Architecture: ${taskFile.architecture || ''}

TASKS:
${taskFile.frontendTasks.map((t: any, i: number) => `${i + 1}. ${t.task}\n   Details: ${t.details}`).join('\n')}
${apiContract}${previousContext}${pluginContext}

Generate complete, production-ready frontend code as JSON. Every file must be complete and runnable.`;

    let fullContent = '';
    const onUsage = (usage: TokenUsage) => {
        ws.send(JSON.stringify({ type: 'token_usage', agent: 'Frontend Agent', usage }));
    };

    const feProvider = userSettings?.agentModels.frontend.provider || 'openai';
    const feModel = userSettings?.agentModels.frontend.model || 'gpt-5-mini';
    const feKey = userSettings ? resolveApiKey(feProvider, userSettings.apiKeys) : '';

    for await (const chunk of callAIGenerateStream(feProvider, feModel, systemPrompt, userPrompt, onUsage, 16000, feKey || undefined)) {
        if (chunk) {
            fullContent += chunk;
            ws.send(JSON.stringify({
                type: 'frontend_stream', content: chunk,
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
        ws.send(JSON.stringify({ type: 'status', agent: 'Frontend Agent', message: 'Fixing output format...' }));
        const fixPrompt = `Your previous response was not valid JSON. Here is what you generated:\n\n${fullContent.slice(0, 12000)}\n\nConvert this into a VALID JSON object where keys are file paths and values are complete file contents. Output ONLY the JSON, no markdown fences, no explanation.`;
        const fixedResponse = await callAIGenerate(feProvider, feModel, 'Return ONLY valid JSON: { "filepath": "code" }. No markdown, no explanation.', fixPrompt, 16000, feKey || undefined);
        const fixedParsed = extractJSON(fixedResponse.trim());
        if (fixedParsed && typeof fixedParsed === 'object' && !Array.isArray(fixedParsed)) return fixedParsed;
    } catch { /* recovery also failed */ }

    /* Last resort: return empty map so the frontend doesn't break */
    console.error('[frontend-agent] Failed to extract valid JSON from response');
    return {};
}
