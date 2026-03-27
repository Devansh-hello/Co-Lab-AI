/**
 * Project Snapshot Model
 *
 * Stores the latest generated code for a project. One snapshot per project.
 * Used to provide context to agents on subsequent iterations so they
 * can modify existing code instead of regenerating from scratch.
 */

import mongoose from "mongoose";

const projectSnapshotSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "project", required: true, unique: true },
    /** Frontend code as { "filepath": "code" } map */
    frontendCode: { type: mongoose.Schema.Types.Mixed },
    /** Backend code as { "filepath": "code" } map */
    backendCode: { type: mongoose.Schema.Types.Mixed },
    /** The orchestrator task file used to generate this snapshot */
    taskFile: { type: mongoose.Schema.Types.Mixed },
    updatedAt: { type: Date, default: Date.now }
});

export const ProjectSnapshot = mongoose.model("projectSnapshot", projectSnapshotSchema);
