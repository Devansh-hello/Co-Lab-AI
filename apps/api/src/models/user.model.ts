/**
 * User Model
 *
 * Stores user accounts with support for both email/password
 * and Google OAuth authentication. Also holds per-user settings
 * for API keys and agent model preferences.
 */

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },

    /** Per-user configuration for AI providers and agent model routing */
    settings: {
        apiKeys: {
            openai: { type: String, default: '' },
            anthropic: { type: String, default: '' },
            gemini: { type: String, default: '' },
            openrouter: { type: String, default: '' },
            glm: { type: String, default: '' },
        },
        agentModels: {
            orchestrator: { provider: { type: String, default: '' }, model: { type: String, default: '' } },
            frontend: { provider: { type: String, default: '' }, model: { type: String, default: '' } },
            backend: { provider: { type: String, default: '' }, model: { type: String, default: '' } },
            review: { provider: { type: String, default: '' }, model: { type: String, default: '' } },
            test: { provider: { type: String, default: '' }, model: { type: String, default: '' } },
        },
    },
});

export const User = mongoose.model("user", userSchema);
