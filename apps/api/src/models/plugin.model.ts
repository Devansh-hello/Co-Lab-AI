/**
 * User Plugin Model
 *
 * Tracks which third-party plugins a user has enabled (e.g. Supabase,
 * GitHub, Firebase). Stores per-plugin credentials and enable state.
 * Unique constraint on (userId, pluginId) prevents duplicates.
 */

import mongoose from "mongoose";

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

export const UserPlugin = mongoose.model("userPlugin", userPluginSchema);
