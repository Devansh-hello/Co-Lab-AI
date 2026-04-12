/**
 * Feature Model
 *
 * Tracks individual features within a project through a lifecycle:
 *   Planned → Architected → In Progress → In Review → Approved → Deployed
 *
 * Each pipeline run creates/updates features extracted from the orchestrator's
 * task file. Features link back to the messages that created/modified them.
 */

import mongoose from "mongoose";

export const FEATURE_STATUSES = [
    'planned',
    'architected',
    'in_progress',
    'in_review',
    'approved',
    'deployed',
] as const;

export type FeatureStatus = typeof FEATURE_STATUSES[number];

const featureSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "project", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },

    /** Short feature name (e.g., "User Authentication") */
    name: { type: String, required: true },
    /** Detailed description from the orchestrator */
    description: { type: String },

    /** Current lifecycle status */
    status: {
        type: String,
        enum: FEATURE_STATUSES,
        default: 'planned',
    },

    /** Priority from orchestrator complexity analysis */
    priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },

    /** Acceptance criteria extracted from the understanding/orchestrator phase */
    acceptanceCriteria: [{ type: String }],

    /** Spec document (PRD content for this feature) */
    spec: { type: String },

    /** Quality score from the last review */
    qualityScore: {
        grade: { type: String },
        overall: { type: Number },
    },

    /** Messages that created or modified this feature */
    linkedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: "message" }],

    /** Status history for audit trail */
    statusHistory: [{
        from: { type: String },
        to: { type: String },
        changedAt: { type: Date, default: Date.now },
        reason: { type: String },
    }],
}, {
    timestamps: true,
});

/** Compound index for listing features by project with status filtering */
featureSchema.index({ projectId: 1, status: 1 });

export const Feature = mongoose.model("feature", featureSchema);
