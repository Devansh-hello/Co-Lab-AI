/**
 * Pipeline Run Model
 *
 * Tracks the current state of an active pipeline execution.
 * When a client disconnects, the pipeline state is serialized here
 * so it can be restored on reconnect.
 *
 * One PipelineRun per Message (unique on messageId).
 */

import mongoose from "mongoose";

const pipelineRunSchema = new mongoose.Schema({
    /** FK to the Message that started this pipeline */
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "message", unique: true },
    /** FK to Project */
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "project", index: true },
    /** FK to User */
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    /** Current pipeline phase */
    phase: {
        type: String,
        enum: ['understanding', 'qa', 'planning', 'building', 'testing', 'feedback', 'done', 'error', 'cancelled'],
        required: true,
    },
    /** Serialized PipelineState (minus non-serializable fields) */
    state: { type: mongoose.Schema.Types.Mixed },
    /** Last sequence number emitted */
    lastSeq: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

pipelineRunSchema.index({ userId: 1, projectId: 1 });

/** Auto-cleanup: pipeline runs older than 7 days */
pipelineRunSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const PipelineRun = mongoose.model("pipelineRun", pipelineRunSchema);
