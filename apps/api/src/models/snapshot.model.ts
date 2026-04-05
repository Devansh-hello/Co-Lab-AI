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
    /** Accumulated learnings from previous iterations (with staleness tracking) */
    projectMemory: {
        /** Patterns the user prefers — long-lived (90 day decay) */
        preferredPatterns: [{
            value: { type: String },
            createdAt: { type: Date, default: Date.now },
            reinforcements: { type: Number, default: 1 },
        }],
        /** Approaches rejected — medium-lived (30 day decay) */
        rejectedApproaches: [{
            value: { type: String },
            createdAt: { type: Date, default: Date.now },
            reinforcements: { type: Number, default: 1 },
        }],
        /** Quality issues from reviews — short-lived (7 day decay, extends with reinforcement) */
        qualityFeedback: [{
            value: { type: String },
            createdAt: { type: Date, default: Date.now },
            reinforcements: { type: Number, default: 1 },
        }],
    },
    updatedAt: { type: Date, default: Date.now }
});

export const ProjectSnapshot = mongoose.model("projectSnapshot", projectSnapshotSchema);
