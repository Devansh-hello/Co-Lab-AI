/**
 * Checkpoint Model
 *
 * Saves pipeline state at each phase transition. Enables:
 *   - Resume from last successful checkpoint on failure
 *   - Manual rewind to a specific phase
 *   - Branching: fork from a checkpoint to try different approaches
 *
 * TTL index cleans up checkpoints older than 30 days.
 */

import mongoose from "mongoose";

const checkpointSchema = new mongoose.Schema({
    /** FK to the pipeline run this checkpoint belongs to */
    pipelineRunId: { type: String, required: true, index: true },
    /** FK to Project */
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "project", required: true, index: true },
    /** FK to User */
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    /** FK to Message */
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "message" },

    /** The pipeline phase this checkpoint was taken at */
    phase: {
        type: String,
        enum: ['understanding', 'qa', 'planning', 'building', 'reviewing', 'testing', 'feedback', 'done'],
        required: true,
    },

    /** Serialized pipeline state at this point */
    state: {
        taskFile: { type: mongoose.Schema.Types.Mixed },
        understanding: { type: mongoose.Schema.Types.Mixed },
        qaAnswers: { type: mongoose.Schema.Types.Mixed },
        frontendResult: { type: mongoose.Schema.Types.Mixed },
        backendResult: { type: mongoose.Schema.Types.Mixed },
        reviewResult: { type: mongoose.Schema.Types.Mixed },
        testResult: { type: mongoose.Schema.Types.Mixed },
        qualityScore: { type: mongoose.Schema.Types.Mixed },
        provider: { type: String },
        model: { type: String },
        feedbackIteration: { type: Number, default: 0 },
    },

    /** Sequence number at time of checkpoint */
    seq: { type: Number },

    /** Human-readable label (auto-generated or user-provided) */
    label: { type: String },

    createdAt: { type: Date, default: Date.now },
});

/** Fast lookup: latest checkpoint per pipeline run */
checkpointSchema.index({ pipelineRunId: 1, phase: 1 });

/** Auto-cleanup: checkpoints older than 30 days */
checkpointSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Checkpoint = mongoose.model("checkpoint", checkpointSchema);
