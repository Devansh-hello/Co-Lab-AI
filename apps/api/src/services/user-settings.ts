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

/** Model intent types — request models by purpose, not hardcoded IDs */
export type ModelIntent = 'latency' | 'quality' | 'budget';

/**
 * Intent-to-model resolution table.
 * Updated centrally when better models become available —
 * users with intent-based settings auto-upgrade without config changes.
 */
export const INTENT_MODELS: Record<ModelIntent, { provider: string; model: string }> = {
    latency: { provider: 'openrouter', model: 'google/gemini-2.5-flash' },
    quality: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4.6' },
    budget: { provider: 'openrouter', model: 'openai/gpt-oss-120b:free' },
};

/** Default agent roles mapped to intents */
const DEFAULT_AGENT_INTENTS: Record<string, ModelIntent> = {
    orchestrator: 'latency',
    frontend: 'quality',
    backend: 'quality',
    review: 'latency',
    test: 'latency',
};

/**
 * Resolve a model from an intent string.
 * If the value is a known intent, returns the current best model for it.
 * Otherwise treats it as a literal model name (backward compatible).
 */
export function resolveModelFromIntent(model: string): { provider: string; model: string } | null {
    if (model in INTENT_MODELS) {
        return INTENT_MODELS[model as ModelIntent];
    }
    return null;
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
 * Resolve agent models from user settings.
 * Supports both explicit provider+model and intent-based resolution.
 * If user sets model to "latency", "quality", or "budget", it auto-resolves
 * to the current best model for that intent.
 */
function resolveAgentModels(userModels: any): UserSettings['agentModels'] {
    const roles = ['orchestrator', 'frontend', 'backend', 'review', 'test'] as const;
    const result: any = {};

    for (const role of roles) {
        const userConfig = userModels?.[role];
        const defaultConfig = DEFAULT_AGENT_MODELS[role];

        const rawModel = userConfig?.model || '';
        const rawProvider = userConfig?.provider || '';

        // Check if the model field is an intent keyword
        const intentResolved = resolveModelFromIntent(rawModel);
        if (intentResolved) {
            result[role] = intentResolved;
        } else {
            result[role] = {
                provider: rawProvider || defaultConfig.provider,
                model: rawModel || defaultConfig.model,
            };
        }
    }

    return result;
}

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
            agentModels: resolveAgentModels(user?.settings?.agentModels),
        };
    } catch {
        return {
            apiKeys: { openai: '', anthropic: '', gemini: '', openrouter: '', glm: '' },
            agentModels: { ...DEFAULT_AGENT_MODELS },
        };
    }
}

/**
 * Check which providers used by the agent config are missing API keys.
 * Returns a list of provider names that have no key (user or server).
 */
export function getMissingProviders(settings: UserSettings): string[] {
    const neededProviders = new Set<string>();
    for (const role of Object.values(settings.agentModels)) {
        neededProviders.add(role.provider);
    }

    const missing: string[] = [];
    for (const provider of neededProviders) {
        const key = resolveApiKey(provider, settings.apiKeys);
        if (!key) missing.push(provider);
    }
    return missing;
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
