/**
 * User Plugin Model
 *
 * Tracks which third-party plugins a user has enabled (e.g. Supabase,
 * GitHub, Firebase). Stores per-plugin credentials and enable state.
 * Unique constraint on (userId, pluginId) prevents duplicates.
 */

import mongoose from "mongoose";
import { encrypt, decrypt, isEncryptionConfigured } from "../services/crypto.js";

const userPluginSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    pluginId: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    credentials: { type: mongoose.Schema.Types.Mixed, default: {} },
    enabledAt: { type: Date },
}, {
    timestamps: true,
});

/** Compound index ensures one plugin config per user */
userPluginSchema.index({ userId: 1, pluginId: 1 }, { unique: true });

/** Encrypt credential values before save */
userPluginSchema.pre('save', function () {
    if (!isEncryptionConfigured()) return;
    if (this.credentials && typeof this.credentials === 'object') {
        const encrypted: Record<string, any> = {};
        for (const [k, v] of Object.entries(this.credentials as Record<string, any>)) {
            encrypted[k] = typeof v === 'string' && v ? encrypt(v) : v;
        }
        this.credentials = encrypted;
    }
});

/** Decrypt credential values on read */
userPluginSchema.post('init', function () {
    if (!isEncryptionConfigured()) return;
    if (this.credentials && typeof this.credentials === 'object') {
        const decrypted: Record<string, any> = {};
        for (const [k, v] of Object.entries(this.credentials as Record<string, any>)) {
            decrypted[k] = typeof v === 'string' ? decrypt(v) : v;
        }
        this.credentials = decrypted;
    }
});

export const UserPlugin = mongoose.model("userPlugin", userPluginSchema);
