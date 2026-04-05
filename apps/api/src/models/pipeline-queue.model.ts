/**
 * Pipeline Queue Model
 *
 * Queues pipeline requests per project instead of aborting.
 * When a user sends a new message while a pipeline is running,
 * the request is queued and processed sequentially.
 *
 * Lifecycle: queued → running → completed | error | cancelled
 */

import mongoose from "mongoose";

const pipelineQueueSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "project", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    /** The raw message payload from the client */
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    /** Queue position (lower = earlier in queue) */
    position: { type: Number, required: true },
    status: {
        type: String,
        enum: ['queued', 'running', 'completed', 'error', 'cancelled'],
        default: 'queued',
    },
    createdAt: { type: Date, default: Date.now },
    startedAt: { type: Date },
    completedAt: { type: Date },
});

/** Fast lookup: next queued item for a project */
pipelineQueueSchema.index({ projectId: 1, status: 1, position: 1 });

/** Auto-cleanup: queue items older than 24 hours */
pipelineQueueSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export const PipelineQueue = mongoose.model("pipelineQueue", pipelineQueueSchema);
