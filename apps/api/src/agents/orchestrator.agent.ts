/**
 * Orchestrator Agent
 *
 * Senior architect that plans the project: classifies intent (build/iterate/debug),
 * defines the API contract, rates complexity, and breaks work into frontend
 * and backend tasks. Output drives all downstream agents.
 *
 * Includes:
 *   - Schema validation with retry (if output doesn't match expected shape)
 *   - Plan consistency checkpoint (verifies endpoints match tasks)
 */

import type { WebSocket } from "ws";

import { callAIGenerate } from "../services/ai-generate.js";
import { extractJSON, extractAndValidate, ORCHESTRATOR_SHAPE } from "../services/json-parser.js";
import { resolveApiKey, type UserSettings } from "../services/user-settings.js";
import { validateOrchestratorPlan } from "./helpers.js";

/**
 * Generate a project plan from the user's message and conversation history.
 * Returns a task file with API contract, tasks, and metadata.
 */
export async function OrchestratorAgent(
    userMessage: string,
    conversationHistory: any[],
    snapshot: any | null,
    ws: WebSocket,
    pluginContext: string = '',
    userSettings?: UserSettings
): Promise<any> {
    /* Build compact context from recent conversation */
    const contextMessages = conversationHistory
        .reverse()
        .map(msg => ({ user: msg.userMessage, intent: msg.intent, tasks: msg.coordinatorResponse?.content }))
        .filter(msg => msg.tasks)
        .slice(0, 3);

    const previousContext = contextMessages.length > 0
        ? `\n\nPREVIOUS CONVERSATION:\n${contextMessages.map((msg, i) => `${i + 1}. [${msg.intent?.toUpperCase() || 'BUILD'}] User: ${msg.user}`).join('\n')}`
        : '';

    const snapshotContext = snapshot
        ? `\n\nEXISTING CODEBASE:\nFrontend files: ${JSON.stringify(Object.keys(snapshot.frontendCode || {}))}\nBackend files: ${JSON.stringify(Object.keys(snapshot.backendCode || {}))}\nPrevious features: ${JSON.stringify(snapshot.taskFile?.features || [])}`
        : '';

    const systemPrompt = `Senior architect. Classify intent, define API contract, break into tasks. Return ONLY valid JSON.

PRE-ANALYSIS (think through before responding, do not output):
1. AMBIGUITY: Are there unstated requirements? (auth scheme, data persistence, real-time needs)
2. CONFLICTS: Does anything contradict itself?
3. SCOPE: Is this actually multiple projects? If so, break into phases and only plan phase 1.
4. FEASIBILITY: Can this be built with the requested stack? Flag impossible combinations.

RULES:
- intent: "build" | "iterate" | "debug"
- API contract: every endpoint (method, path, body, response), every model (typed fields), auth scheme. Field names must be EXACT — both agents use them.
- Complexity: rate 1-5 (1=trivial, 2=simple CRUD, 3=multi-resource+auth, 4=realtime/payments, 5=multi-tenant/complex)
- Tasks: specify libraries, components, file paths. For iterate/debug: only changed parts.
${previousContext ? '\nUse conversation history.' : ''}${snapshotContext ? '\nExisting code — prefer iterate.' : ''}

CONTEXT BUDGET:
- For debug intent: skip architecture/tech stack description, jump straight to the fix tasks.
- For iterate intent: only describe NEW endpoints and tasks — don't repeat existing ones.
- Complexity 1-2: max 3-5 tasks per side. Don't over-architect simple features.
- Complexity 3+: include architecture description and full task breakdown.

ANTI-PATTERNS — NEVER DO THESE:
- Don't add endpoints the user didn't ask for (no /health, /metrics, /admin unless requested)
- Don't split a single resource into 10 endpoints — CRUD + any custom actions is enough
- Don't add WebSocket/real-time unless the user explicitly needs it
- Don't default to microservices — monolith is correct for 90% of requests
- Don't add pagination to endpoints that will never return more than 50 items

If you detect issues, include them in "warnings" (array of strings) in the output.

JSON format:
{"intent":"build|iterate|debug","projectMeta":{"name":"string","description":"string"},"techStack":{"frontend":{"framework":"string","styling":"string","libraries":["string"]},"backend":{"runtime":"string","framework":"string","database":"string","libraries":["string"]}},"apiContract":{"baseUrl":"/api","auth":{"scheme":"JWT Bearer","headerName":"Authorization","tokenStorage":"localStorage"},"models":{"ModelName":{"field":"type"}},"endpoints":[{"method":"POST","path":"/api/auth/register","body":{"email":"string"},"response":{"token":"string"}}]},"features":["feature"],"complexity":{"overall":3,"reasoning":"string"},"frontendTasks":[{"task":"string","details":"string","complexity":2}],"backendTasks":[{"task":"string","details":"string","complexity":3}],"architecture":"string","fileStructure":{"frontend":["src/App.tsx"],"backend":["server.js"]},"warnings":[],"notes":"string"}`;

    const orchProvider = userSettings?.agentModels.orchestrator.provider || 'glm';
    const orchModel = userSettings?.agentModels.orchestrator.model || 'GLM-4.7-FlashX';
    const orchKey = userSettings ? resolveApiKey(orchProvider, userSettings.apiKeys) : '';
    const fullUserPrompt = previousContext + snapshotContext + pluginContext + '\n\nUSER REQUEST: ' + userMessage;

    let content: string;
    try {
        content = await callAIGenerate(orchProvider, orchModel, systemPrompt, fullUserPrompt, 8000, orchKey || undefined);
    } catch (err: any) {
        console.error("[orchestrator] AI call failed:", err.message || err);
        return {
            intent: snapshot ? 'iterate' : 'build',
            projectMeta: { name: "Generated Project", description: userMessage },
            features: ["Core functionality"],
            frontendTasks: [{ task: "Build the UI", details: userMessage }],
            backendTasks: [{ task: "Build the API", details: userMessage }],
            apiContract: { baseUrl: "/api", auth: { scheme: "none" }, models: {}, endpoints: [] },
            architecture: "Standard web application",
            notes: "",
        };
    }

    try {
        /* Schema validation with retry */
        const plan = await extractAndValidate(content.trim(), ORCHESTRATOR_SHAPE, async () => {
            return await callAIGenerate(orchProvider, orchModel,
                systemPrompt + '\n\nCRITICAL: Your previous response was not valid JSON with required fields (intent, projectMeta, apiContract, features, frontendTasks, backendTasks). Return ONLY the JSON object.',
                fullUserPrompt, 8000, orchKey || undefined);
        });

        /* Plan consistency checkpoint */
        const validation = validateOrchestratorPlan(plan);
        if (!validation.valid && validation.issues.length > 0) {
            ws.send(JSON.stringify({
                type: 'status', agent: 'Orchestrator Agent',
                message: `Fixing ${validation.issues.length} plan inconsistencies...`,
                provider: orchProvider, model: orchModel,
            }));

            /* Re-run with specific fix instructions */
            const fixPrompt = `${fullUserPrompt}\n\nFIX THESE PLAN ISSUES:\n${validation.issues.map((i, n) => `${n + 1}. ${i}`).join('\n')}\n\nReturn the corrected complete JSON plan.`;
            const fixedContent = await callAIGenerate(orchProvider, orchModel, systemPrompt, fixPrompt, 8000, orchKey || undefined);
            try {
                return extractJSON(fixedContent.trim());
            } catch {
                return plan; // Use original if fix fails
            }
        }

        return plan;
    } catch {
        console.warn("[orchestrator] JSON parse failed, using fallback");
        return {
            intent: snapshot ? 'iterate' : 'build',
            projectMeta: { name: "Generated Project", description: userMessage },
            features: ["Core functionality"],
            frontendTasks: [{ task: "Build the UI", details: userMessage }],
            backendTasks: [{ task: "Build the API", details: userMessage }],
            apiContract: { baseUrl: "/api", auth: { scheme: "none" }, models: {}, endpoints: [] },
            architecture: "Standard web application",
            notes: "",
        };
    }
}
