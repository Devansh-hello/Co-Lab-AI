/**
 * User Settings Service
 *
 * Loads per-user AI configuration (API keys + agent model preferences)
 * and resolves which API key to use for a given provider, falling back
 * to server-level keys when the user hasn't set their own.
 */

import { User } from "../models/index.js";
import { decrypt } from "./crypto.js";

/** Shape of per-user AI settings stored in the User document */
export interface UserSettings {
    apiKeys: {
        openai: string;
        anthropic: string;
        gemini: string;
        openrouter: string;
        glm: string;
    };
    agentModels: {
        orchestrator: { provider: string; model: string };
        frontend: { provider: string; model: string };
        backend: { provider: string; model: string };
        review: { provider: string; model: string };
        test: { provider: string; model: string };
    };
}

/** Default model configuration for each agent role */
export const DEFAULT_AGENT_MODELS: UserSettings['agentModels'] = {
    orchestrator: { provider: 'openrouter', model: 'google/gemini-2.5-flash' },
    frontend: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4.6' },
    backend: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4.6' },
    review: { provider: 'openrouter', model: 'google/gemini-2.5-flash' },
    test: { provider: 'openrouter', model: 'google/gemini-2.5-flash' },
};

/**
 * Load user settings from the database, filling in defaults for any
 * unset fields. Returns a complete UserSettings object.
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
    try {
        const user = await User.findById(userId).select('settings').lean() as any;

        return {
            apiKeys: {
                openai: decrypt(user?.settings?.apiKeys?.openai || ''),
                anthropic: decrypt(user?.settings?.apiKeys?.anthropic || ''),
                gemini: decrypt(user?.settings?.apiKeys?.gemini || ''),
                openrouter: decrypt(user?.settings?.apiKeys?.openrouter || ''),
                glm: decrypt(user?.settings?.apiKeys?.glm || ''),
            },
            agentModels: {
                orchestrator: {
                    provider: user?.settings?.agentModels?.orchestrator?.provider || DEFAULT_AGENT_MODELS.orchestrator.provider,
                    model: user?.settings?.agentModels?.orchestrator?.model || DEFAULT_AGENT_MODELS.orchestrator.model,
                },
                frontend: {
                    provider: user?.settings?.agentModels?.frontend?.provider || DEFAULT_AGENT_MODELS.frontend.provider,
                    model: user?.settings?.agentModels?.frontend?.model || DEFAULT_AGENT_MODELS.frontend.model,
                },
                backend: {
                    provider: user?.settings?.agentModels?.backend?.provider || DEFAULT_AGENT_MODELS.backend.provider,
                    model: user?.settings?.agentModels?.backend?.model || DEFAULT_AGENT_MODELS.backend.model,
                },
                review: {
                    provider: user?.settings?.agentModels?.review?.provider || DEFAULT_AGENT_MODELS.review.provider,
                    model: user?.settings?.agentModels?.review?.model || DEFAULT_AGENT_MODELS.review.model,
                },
                test: {
                    provider: user?.settings?.agentModels?.test?.provider || DEFAULT_AGENT_MODELS.test.provider,
                    model: user?.settings?.agentModels?.test?.model || DEFAULT_AGENT_MODELS.test.model,
                },
            },
        };
    } catch {
        return {
            apiKeys: { openai: '', anthropic: '', gemini: '', openrouter: '', glm: '' },
            agentModels: { ...DEFAULT_AGENT_MODELS },
        };
    }
}

/**
 * Resolve the API key for a given provider.
 * Priority: user's personal key > server-level env var.
 */
export function resolveApiKey(provider: string, userKeys: UserSettings['apiKeys']): string {
    const userKey = (userKeys as Record<string, string>)[provider] || '';
    if (userKey) return userKey;

    /* Fall back to server default */
    switch (provider) {
        case 'openai': return process.env.OPENAI_API_KEY || '';
        case 'anthropic': return process.env.ANTHROPIC_API_KEY || '';
        case 'gemini': return process.env.GEMINI_API_KEY || '';
        case 'openrouter': return process.env.OPENROUTER_API_KEY || '';
        case 'glm': return process.env.GLM_API_KEY || '';
        default: return process.env.OPENROUTER_API_KEY || '';
    }
}
