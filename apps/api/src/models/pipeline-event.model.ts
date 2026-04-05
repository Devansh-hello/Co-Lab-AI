/**
 * Pipeline Event Model
 *
 * Stores every significant event emitted during a pipeline run.
 * Used for replaying events to reconnecting clients and for
 * auditing pipeline execution history.
 *
 * TTL index auto-cleans events older than 7 days.
 */

import mongoose from "mongoose";

const pipelineEventSchema = new mongoose.Schema({
    /** Groups events for one pipeline execution */
    pipelineRunId: { type: String, required: true, index: true },
    /** FK to Message document */
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "message" },
    /** FK to Project */
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "project", index: true },
    /** FK to User */
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    /** Monotonic sequence number within a pipeline run */
    seq: { type: Number, required: true },
    /** Event type (status, understanding, frontend_complete, etc.) */
    type: {
        type: String,
        required: true,
        enum: [
            'session', 'status', 'understanding', 'final_plan',
            'frontend_stream', 'backend_stream', 'review_stream', 'test_stream',
            'frontend_complete', 'backend_complete', 'review_complete', 'test_complete',
            'complexity_score', 'quality_score', 'feedback_iteration',
            'token_usage', 'all_complete', 'error', 'cancelled',
            'permission_request',
        ],
    },
    /** The full event payload (JSON blob) */
    payload: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
});

/** Fast lookup: all events for a pipeline run in order */
pipelineEventSchema.index({ pipelineRunId: 1, seq: 1 }, { unique: true });

/** Auto-cleanup: events older than 7 days are removed */
pipelineEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const PipelineEvent = mongoose.model("pipelineEvent", pipelineEventSchema);
