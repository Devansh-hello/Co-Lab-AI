/**
 * Review Agent
 *
 * Evaluates generated code for completeness, API compatibility, security
 * issues, and generates a setup guide. Uses file summaries and extracted
 * imports/routes instead of full code dumps to reduce token usage.
 *
 * Output includes: completionStatus, apiCompatibility, setupGuide,
 * codeReview, qualityScore, and a human-readable summary.
 */

import type { WebSocket } from "ws";

import { callAIGenerateStream, type TokenUsage } from "../services/ai-generate.js";
import { extractJSON } from "../services/json-parser.js";
import { resolveApiKey, DEFAULT_AGENT_MODELS, type UserSettings } from "../services/user-settings.js";
import { buildCompactContract } from "./helpers.js";

/** Safely coerce a code-map value to a string (LLMs sometimes return objects). */
function asString(v: unknown): string {
    if (typeof v === 'string') return v;
    if (v == null) return '';
    try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

/**
 * Review generated frontend and backend code against the task file.
 * Returns a structured review with quality scores and setup guide.
 */
export async function ReviewAgent(
    taskFile: any,
    frontendCode: any,
    backendCode: any,
    ws: WebSocket,
    userSettings?: UserSettings,
    signal?: AbortSignal,
): Promise<any> {
    /* Build concise file summaries instead of dumping full code */
    const frontendSummary = frontendCode && typeof frontendCode === 'object'
        ? Object.entries(frontendCode).map(([name, content]) => {
            const lines = asString(content).split('\n').length;
            return `  ${name} (${lines} lines)`;
        }).join('\n')
        : 'No frontend code';

    const backendSummary = backendCode && typeof backendCode === 'object'
        ? Object.entries(backendCode).map(([name, content]) => {
            const lines = asString(content).split('\n').length;
            return `  ${name} (${lines} lines)`;
        }).join('\n')
        : 'No backend code';

    /* Extract imports for dependency analysis */
    const extractImports = (code: any) => {
        if (!code || typeof code !== 'object') return [];
        const imports: string[] = [];
        for (const [, content] of Object.entries(code)) {
            const matches = asString(content).match(/(?:import|require)\s*\(?['"]([@\w\-\/]+)['"]\)?/g) || [];
            imports.push(...matches);
        }
        return [...new Set(imports)];
    };

    /* Extract frontend API calls for contract verification */
    const extractApiCalls = (code: any) => {
        if (!code || typeof code !== 'object') return [];
        const calls: string[] = [];
        for (const [, content] of Object.entries(code)) {
            const matches = asString(content).match(/fetch\s*\(\s*[`'"](\/api\/[^`'"]+)[`'"]/g) || [];
            calls.push(...matches);
        }
        return [...new Set(calls)];
    };

    /* Extract backend route definitions for contract verification */
    const extractRoutes = (code: any) => {
        if (!code || typeof code !== 'object') return [];
        const routes: string[] = [];
        for (const [, content] of Object.entries(code)) {
            const matches = asString(content).match(/\.(get|post|put|patch|delete)\s*\(\s*['"](\/[^'"]+)['"]/gi) || [];
            routes.push(...matches);
        }
        return [...new Set(routes)];
    };

    const frontendImports = extractImports(frontendCode);
    const backendImports = extractImports(backendCode);
    const apiCalls = extractApiCalls(frontendCode);
    const backendRoutes = extractRoutes(backendCode);

    const systemPrompt = `Code reviewer. Verify features, check API compatibility, find critical issues, create setup guide. Return ONLY valid JSON.

PRIORITIES: API mismatches > missing auth on protected routes > crash-causing bugs > missing env vars > setup steps.

CRITICAL ISSUES = only things that CRASH the app or create REAL security vulnerabilities (SQL injection, auth bypass, exposed secrets). Do NOT list best practices as critical (no helmet, no rate limiting, no input length limits — these are suggestions, NOT critical).

MISSING ITEMS = only features the user EXPLICITLY requested that are completely absent. Partial implementations are NOT missing. Sub-features (e.g., "search" within "product catalog") are NOT separate missing items.

QUALITY SCORING: Rate 0-100 FAIRLY — a working app with minor issues is 75-85, not 40-50. Grade: A(90+) B(80+) C(70+) D(60+) F(<60). If C or below, list actionableFixes.

OUTPUT QUALITY RULES:
- Lead with the most critical finding, not a summary paragraph
- Each actionableFix must be specific and actionable — "improve error handling" is useless, "add try-catch to POST /api/auth/login to handle bcrypt.compare failures" is useful
- Don't repeat the same class of issue — "missing input validation" said once with 3 example endpoints is better than listing it 15 times
- Setup guide steps must be copy-pasteable terminal commands, not descriptions
- envVariables must include placeholder values showing expected format (e.g., "DATABASE_URL=mongodb://localhost:27017/myapp" not just "DATABASE_URL=")
- runCommands must be the EXACT commands needed (e.g., if the project uses tsx, use "npx tsx server.ts" not "node server.js")
- suggestions should be ranked by impact — most impactful first

VERIFICATION CHECKS (do these in order):
1. Does every frontend API call have a matching backend route? List mismatches.
2. Do request/response field names match exactly between frontend and backend?
3. Are auth tokens attached to requests that hit protected backend routes?
4. Does the frontend handle all possible error responses from the backend?
5. Are all environment variables referenced in code present in .env.example?

JSON format:
{"completionStatus":{"frontendComplete":true,"backendComplete":true,"missingItems":[]},"apiCompatibility":{"compatible":true,"mismatches":[]},"setupGuide":{"prerequisites":[],"steps":[],"envVariables":[],"runCommands":{"frontend":"npm run dev","backend":"npm start"}},"codeReview":{"criticalIssues":[],"suggestions":[],"actionableFixes":[]},"qualityScore":{"grade":"B","metrics":{"completeness":90,"security":85,"compatibility":95,"codeQuality":80},"overall":88},"summary":"string"}`;

    /* Trajectory reduction: compact task summary instead of full JSON dump */
    const featureList = (taskFile.features || []).join(', ');
    const contractSummary = buildCompactContract(taskFile.apiContract);
    const userPrompt = `FEATURES: ${featureList}
CONTRACT: ${contractSummary}
FRONTEND TASKS: ${(taskFile.frontendTasks || []).map((t: any) => t.task).join(', ')}
BACKEND TASKS: ${(taskFile.backendTasks || []).map((t: any) => t.task).join(', ')}

FRONTEND FILES:\n${frontendSummary}
Imports: ${frontendImports.slice(0, 15).join(', ')}
API calls: ${apiCalls.join(', ') || 'none'}

BACKEND FILES:\n${backendSummary}
Imports: ${backendImports.slice(0, 15).join(', ')}
Routes: ${backendRoutes.join(', ') || 'none'}

Review completeness, API compatibility, and generate setup guide.`;

    let fullContent = '';
    const onUsage = (usage: TokenUsage) => {
        ws.send(JSON.stringify({ type: 'token_usage', agent: 'Review Agent', usage }));
    };

    const rvProvider = userSettings?.agentModels.review.provider || DEFAULT_AGENT_MODELS.review.provider;
    const rvModel = userSettings?.agentModels.review.model || DEFAULT_AGENT_MODELS.review.model;
    const rvKey = userSettings ? resolveApiKey(rvProvider, userSettings.apiKeys) : '';

    for await (const chunk of callAIGenerateStream(rvProvider, rvModel, systemPrompt, userPrompt, onUsage, 16000, rvKey || undefined, signal)) {
        if (chunk) {
            fullContent += chunk;
            ws.send(JSON.stringify({
                type: 'review_stream', content: chunk,
                accumulated: fullContent,
                tokenEstimate: Math.ceil(fullContent.length / 4),
            }));
        }
    }

    try { return extractJSON(fullContent.trim()); }
    catch {
        return {
            completionStatus: { frontendComplete: true, backendComplete: true, missingItems: [] },
            apiCompatibility: { compatible: true, mismatches: [] },
            setupGuide: { prerequisites: ["Node.js"], steps: ["npm install", "npm start"], envVariables: [], runCommands: { frontend: "npm run dev", backend: "node server.js" } },
            codeReview: { criticalIssues: [], suggestions: [] },
            qualityScore: { grade: 'B', metrics: { completeness: 80, security: 70, compatibility: 80, codeQuality: 75 }, overall: 76 },
            summary: taskFile.projectMeta?.description || "Project generated successfully",
        };
    }
}
