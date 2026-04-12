/**
 * PRD Generation Agent
 *
 * Init Mode: For new projects (first message, no snapshot), generates a
 * structured Product Requirements Document before jumping into code.
 *
 * Output: PRD with vision, user stories, feature breakdown, acceptance
 * criteria, technical constraints, and success metrics.
 */

import { callAIGenerate } from "../services/ai-generate.js";
import { extractJSON } from "../services/json-parser.js";
import { resolveApiKey, DEFAULT_AGENT_MODELS, type UserSettings } from "../services/user-settings.js";

export interface PRDOutput {
    projectName: string;
    vision: string;
    targetUsers: string;
    features: PRDFeature[];
    technicalConstraints: string[];
    successMetrics: string[];
    outOfScope: string[];
    mvpDefinition: string;
}

export interface PRDFeature {
    name: string;
    description: string;
    priority: 'P0' | 'P1' | 'P2';
    userStories: string[];
    acceptanceCriteria: string[];
}

/**
 * Generate a PRD from the user's initial project description.
 * Called when a project has no existing snapshot (first build).
 */
export async function PRDAgent(
    userMessage: string,
    projectName: string,
    userSettings?: UserSettings,
): Promise<PRDOutput> {
    const systemPrompt = `You are a senior product manager. Generate a structured PRD from the user's project description. Return ONLY valid JSON.

RULES:
- Extract concrete features (not vague categories)
- Prioritize: P0 = MVP must-have, P1 = important but not blocking, P2 = nice-to-have
- User stories follow "As a [user], I want [action] so that [benefit]" format
- Acceptance criteria are testable conditions
- Be realistic about MVP scope — 3-5 P0 features max
- Technical constraints should flag real blockers (not generic advice)
- Success metrics should be measurable
- Out of scope: explicitly list what this project does NOT do

JSON format:
{
  "projectName": "string",
  "vision": "1-2 sentence project vision",
  "targetUsers": "Who will use this",
  "features": [
    {
      "name": "Feature Name",
      "description": "What it does",
      "priority": "P0|P1|P2",
      "userStories": ["As a user, I want..."],
      "acceptanceCriteria": ["Given X, when Y, then Z"]
    }
  ],
  "technicalConstraints": ["Must use X", "Cannot exceed Y"],
  "successMetrics": ["User can complete Z in under N seconds"],
  "outOfScope": ["This project does NOT include..."],
  "mvpDefinition": "The MVP is complete when..."
}`;

    const provider = userSettings?.agentModels.orchestrator.provider || DEFAULT_AGENT_MODELS.orchestrator.provider;
    const model = userSettings?.agentModels.orchestrator.model || DEFAULT_AGENT_MODELS.orchestrator.model;
    const key = userSettings ? resolveApiKey(provider, userSettings.apiKeys) : '';

    const content = await callAIGenerate(
        provider, model,
        systemPrompt,
        `Project: ${projectName}\n\nUSER DESCRIPTION:\n${userMessage}`,
        undefined,
        key || undefined,
    );

    try {
        const parsed = extractJSON(content.trim()) as PRDOutput;
        return {
            projectName: parsed.projectName || projectName,
            vision: parsed.vision || '',
            targetUsers: parsed.targetUsers || '',
            features: Array.isArray(parsed.features) ? parsed.features : [],
            technicalConstraints: Array.isArray(parsed.technicalConstraints) ? parsed.technicalConstraints : [],
            successMetrics: Array.isArray(parsed.successMetrics) ? parsed.successMetrics : [],
            outOfScope: Array.isArray(parsed.outOfScope) ? parsed.outOfScope : [],
            mvpDefinition: parsed.mvpDefinition || '',
        };
    } catch {
        return {
            projectName,
            vision: userMessage,
            targetUsers: 'End users',
            features: [{ name: 'Core Functionality', description: userMessage, priority: 'P0', userStories: [], acceptanceCriteria: [] }],
            technicalConstraints: [],
            successMetrics: [],
            outOfScope: [],
            mvpDefinition: 'Basic functionality as described',
        };
    }
}
