/**
 * Understanding Agent
 *
 * First stage of the pipeline. Analyzes the user's project description
 * and generates a summary + clarifying questions. Uses a fast model
 * (Gemini Flash) since this is a lightweight analysis task.
 *
 * Output: { summary, projectName, questions[] }
 */

import { callAIGenerate } from "../services/ai-generate.js";
import { extractJSON } from "../services/json-parser.js";
import { resolveApiKey, DEFAULT_AGENT_MODELS, type UserSettings } from "../services/user-settings.js";

export interface UnderstandingResponse {
    summary: string;
    projectName: string;
    questions: Array<{ id: string; question: string; options: string[] }>;
}

/**
 * Analyze a user's message to extract project intent and generate
 * clarifying questions for ambiguous decisions.
 */
export async function UnderstandingAgent(userMessage: string, userSettings?: UserSettings): Promise<UnderstandingResponse> {
    const systemPrompt = `Analyze the user's project description. Return ONLY valid JSON.

1. Summarize in 2-3 sentences.
2. Generate 0-5 clarifying questions ONLY for genuinely ambiguous decisions (auth, DB, framework, real-time, scope). Skip if already specified.
3. Each question: 2-4 options, no "Other".

PRE-ANALYSIS (think through before responding, do not output):
- Is this actually multiple projects disguised as one? If so, note it in the summary.
- Are there any contradictory requirements?
- What is the most likely auth scheme, database, and real-time need based on the description?
- What unstated requirements are implied? (e.g., "social media app" implies auth, feeds, real-time)

QUESTION QUALITY:
- Never ask about things the user already specified or strongly implied
- Questions should resolve genuinely ambiguous architectural decisions, not preferences
- If the request is clear enough to build, return ZERO questions — don't ask for the sake of asking

JSON format:
{"summary":"string","projectName":"string (max 4 words)","questions":[{"id":"q1","question":"string","options":["A","B"]}]}`;

    const uProvider = userSettings?.agentModels.orchestrator.provider || DEFAULT_AGENT_MODELS.orchestrator.provider;
    const uModel = userSettings?.agentModels.orchestrator.model || DEFAULT_AGENT_MODELS.orchestrator.model;
    const uKey = userSettings ? resolveApiKey(uProvider, userSettings.apiKeys) : '';

    const content = await callAIGenerate(
        uProvider, uModel,
        systemPrompt, 'USER REQUEST: ' + userMessage,
        undefined, uKey || undefined
    );

    try {
        const parsed = extractJSON(content.trim()) as UnderstandingResponse;
        return {
            summary: parsed.summary || userMessage,
            projectName: parsed.projectName || "Project",
            questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 5) : [],
        };
    } catch {
        return { summary: userMessage, projectName: "Project", questions: [] };
    }
}
