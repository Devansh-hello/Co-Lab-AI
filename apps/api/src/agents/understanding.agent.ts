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

export interface UnderstandingResponse {
    summary: string;
    projectName: string;
    questions: Array<{ id: string; question: string; options: string[] }>;
}

/**
 * Analyze a user's message to extract project intent and generate
 * clarifying questions for ambiguous decisions.
 */
export async function UnderstandingAgent(userMessage: string): Promise<UnderstandingResponse> {
    const systemPrompt = `Analyze the user's project description. Return ONLY valid JSON.

1. Summarize in 2-3 sentences.
2. Generate 0-5 clarifying questions ONLY for genuinely ambiguous decisions (auth, DB, framework, real-time, scope). Skip if already specified.
3. Each question: 2-4 options, no "Other".

JSON format:
{"summary":"string","projectName":"string (max 4 words)","questions":[{"id":"q1","question":"string","options":["A","B"]}]}`;

    const content = await callAIGenerate(
        'openrouter', 'google/gemini-2.5-flash',
        systemPrompt, 'USER REQUEST: ' + userMessage
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
