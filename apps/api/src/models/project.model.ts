/**
 * Project Model
 *
 * Represents a user's project. Each project belongs to one user
 * and serves as a container for messages, snapshots, and Turso databases.
 */

import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
}, {
    timestamps: true,
});

export const Project = mongoose.model("project", projectSchema);
