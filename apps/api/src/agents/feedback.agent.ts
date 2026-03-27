/**
 * Feedback Fix Agent
 *
 * When quality is low, this agent receives specific issues and makes
 * targeted fixes to the generated code. It does NOT rewrite from scratch —
 * only the affected files are modified and merged back.
 */

import type { WebSocket } from "ws";

import { callAIGenerateStream } from "../services/ai-generate.js";
import { extractJSON } from "../services/json-parser.js";
import { resolveApiKey, DEFAULT_AGENT_MODELS, type UserSettings } from "../services/user-settings.js";

/**
 * Fix specific issues in generated code.
 * Returns the original code with fixes merged in.
 *
 * @param issues       - List of specific issues to fix
 * @param originalCode - The { "filepath": "code" } map to fix
 * @param side         - Which side to fix ('frontend' or 'backend')
 * @param taskFile     - The orchestrator task file (for API contract reference)
 */
export async function FeedbackFixAgent(
    issues: string[],
    originalCode: any,
    side: 'frontend' | 'backend',
    taskFile: any,
    ws: WebSocket,
    userSettings?: UserSettings
): Promise<unknown> {
    const systemPrompt = `You are a senior code debugger. You will receive code that has specific issues that need fixing.

FIX THESE ISSUES — do NOT rewrite from scratch. Make TARGETED fixes only.

OUTPUT FORMAT: A JSON object where keys are file paths and values are the COMPLETE fixed file contents.
Only include files that actually changed. Do not include unchanged files.
ONLY output valid JSON. No markdown, no explanations.

RULES:
- Fix ONLY the listed issues — don't refactor or improve unrelated code
- Maintain all existing functionality
- Keep the same file structure and naming
- If an API endpoint is missing, add it; don't restructure existing routes`;

    const issueList = issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n');

    /* Cap code to most relevant files to prevent token overflow */
    let codeForPrompt: any = originalCode;
    if (originalCode && typeof originalCode === 'object') {
        const entries = Object.entries(originalCode);
        if (entries.length > 8) {
            /* Keep entry points + files mentioned in issues */
            const issueText = issues.join(' ').toLowerCase();
            const relevant = entries.filter(([name]) => {
                const lower = name.toLowerCase();
                if (lower.includes('server.') || lower.includes('index.') || lower.includes('app.') || lower.includes('main.')) return true;
                const baseName = name.split('/').pop()?.replace(/\.[^.]+$/, '').toLowerCase() || '';
                return issueText.includes(baseName);
            }).slice(0, 8);
            codeForPrompt = Object.fromEntries(relevant.length > 0 ? relevant : entries.slice(0, 6));
        }
    }

    const userPrompt = `ISSUES TO FIX:
${issueList}

CURRENT CODE:
${JSON.stringify(codeForPrompt, null, 2)}

API CONTRACT:
${JSON.stringify(taskFile.apiContract || {}, null, 2)}

Fix the listed issues and return the corrected files as JSON.`;

    let fullContent = '';
    const streamType = side === 'frontend' ? 'frontend_stream' : 'backend_stream';
    const agentConfig = side === 'frontend'
        ? userSettings?.agentModels.frontend || DEFAULT_AGENT_MODELS.frontend
        : userSettings?.agentModels.backend || DEFAULT_AGENT_MODELS.backend;
    const key = userSettings ? resolveApiKey(agentConfig.provider, userSettings.apiKeys) : '';

    for await (const chunk of callAIGenerateStream(agentConfig.provider, agentConfig.model, systemPrompt, userPrompt, undefined, 16000, key || undefined)) {
        if (chunk) {
            fullContent += chunk;
            ws.send(JSON.stringify({
                type: streamType, content: chunk,
                accumulated: fullContent,
                tokenEstimate: Math.ceil(fullContent.length / 4),
            }));
        }
    }

    try {
        const fixes = extractJSON(fullContent.trim()) as Record<string, string>;
        /* Merge fixes into original code */
        if (originalCode && typeof originalCode === 'object' && typeof fixes === 'object') {
            return { ...originalCode, ...fixes };
        }
        return fixes;
    } catch {
        return originalCode;
    }
}
