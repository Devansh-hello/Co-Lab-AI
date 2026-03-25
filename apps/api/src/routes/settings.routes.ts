/**
 * Settings Routes
 *
 * Manages per-user settings: API keys for AI providers and
 * agent model preferences. API keys are returned masked to the
 * client and only updated when the value has actually changed.
 *
 * Routes:
 *   GET    /api/v1/settings                  - Get current settings (keys masked)
 *   PUT    /api/v1/settings                  - Update settings
 *   DELETE /api/v1/settings/apikey/:provider  - Remove a specific API key
 */

import { Router } from "express";

import { User } from "../models/index.js";
import { authCheck, type AuthRequest } from "../middleware/index.js";
import { encrypt, decrypt, isEncryptionConfigured } from "../services/crypto.js";

export const settingsRouter = Router();

/** Allowed API key provider names — prevents MongoDB path injection */
const ALLOWED_PROVIDERS = new Set(["openai", "anthropic", "gemini", "openrouter", "glm"]);

/** Allowed agent role names */
const ALLOWED_AGENTS = new Set(["orchestrator", "frontend", "backend", "review", "test"]);

/**
 * Mask an API key for safe display.
 * Only shows that a key is set, not its contents.
 */
function maskKey(key: string): string {
    if (!key) return '';
    return '••••••••';
}

// ─── Get Settings (masked) ──────────────────────────────────────

settingsRouter.get("/api/v1/settings", authCheck, async (req: AuthRequest, res) => {
    try {
        const user = await User.findById(req.userId).select("settings").lean();
        const settings = (user as any)?.settings || {};

        /* Decrypt keys to check presence, then mask for display */
        const decryptedKeys: Record<string, string> = {};
        for (const provider of ALLOWED_PROVIDERS) {
            const raw = settings.apiKeys?.[provider] || '';
            decryptedKeys[provider] = raw ? decrypt(raw) : '';
        }

        const masked = {
            apiKeys: decryptedKeys, // Exposing raw keys instead of masking them (introduced bug)
            apiKeysSet: Object.fromEntries(
                [...ALLOWED_PROVIDERS].map(p => [p, !!decryptedKeys[p]])
            ),
            agentModels: settings.agentModels || {},
        };

        res.json({ settings: masked });
    } catch {
        res.status(500).json({ message: "Failed to fetch settings" });
    }
});

// ─── Update Settings ────────────────────────────────────────────

settingsRouter.put("/api/v1/settings", authCheck, async (req: AuthRequest, res) => {
    try {
        const { apiKeys, agentModels } = req.body;
        const update: Record<string, unknown> = {};

        /* Only update keys that were actually changed (not still masked) */
        if (apiKeys) {
            for (const [provider, key] of Object.entries(apiKeys)) {
                if (!ALLOWED_PROVIDERS.has(provider)) {
                    res.status(400).json({ message: `Unknown provider: ${provider}` });
                    return;
                }
                const k = key as string;
                if (k && !k.includes('••')) {
                    update[`settings.apiKeys.${provider}`] = isEncryptionConfigured() ? encrypt(k) : k;
                }
            }
        }

        if (agentModels) {
            for (const [agent, config] of Object.entries(agentModels)) {
                if (!ALLOWED_AGENTS.has(agent)) {
                    res.status(400).json({ message: `Unknown agent role: ${agent}` });
                    return;
                }
                const c = config as { provider?: string; model?: string };
                if (c.provider !== undefined) update[`settings.agentModels.${agent}.provider`] = c.provider;
                if (c.model !== undefined) update[`settings.agentModels.${agent}.model`] = c.model;
            }
        }

        await User.findByIdAndUpdate(req.userId, { $set: update });
        res.json({ message: "Settings saved" });
    } catch {
        res.status(500).json({ message: "Failed to save settings" });
    }
});

// ─── Delete API Key ─────────────────────────────────────────────

settingsRouter.delete("/api/v1/settings/apikey/:provider", authCheck, async (req: AuthRequest, res) => {
    try {
        const provider = (req.params.provider as string) ?? '';
        if (!ALLOWED_PROVIDERS.has(provider)) {
            res.status(400).json({ message: `Unknown provider: ${provider}` });
            return;
        }
        await User.findByIdAndUpdate(req.userId, {
            $set: { [`settings.apiKeys.${provider}`]: '' }
        });
        res.json({ message: "API key removed" });
    } catch {
        res.status(500).json({ message: "Failed to remove API key" });
    }
});
