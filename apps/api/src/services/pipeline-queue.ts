/**
 * Pipeline Queue Service
 *
 * Manages sequential pipeline execution per project. When a user sends
 * a new message while a pipeline is running, the request is queued
 * instead of aborting the current pipeline.
 *
 * Inspired by Vellum's optimistic queue locking pattern with
 * claim-based polling to prevent double-processing.
 */

import { PipelineQueue } from "../models/index.js";

/**
 * Enqueue a pipeline request. Returns the queue entry with position.
 */
export async function enqueuePipeline(
    projectId: string,
    userId: string,
    payload: any,
): Promise<{ queueId: string; position: number; isNext: boolean }> {
    // Count existing queued/running items for this project
    const aheadCount = await PipelineQueue.countDocuments({
        projectId,
        status: { $in: ['queued', 'running'] },
    });

    const position = aheadCount + 1;

    const entry = await PipelineQueue.create({
        projectId,
        userId,
        payload,
        position,
        status: position === 1 ? 'running' : 'queued',
        ...(position === 1 ? { startedAt: new Date() } : {}),
    });

    return {
        queueId: entry._id.toString(),
        position,
        isNext: position === 1,
    };
}

/**
 * Mark the current pipeline as completed and return the next queued item.
 * Returns null if the queue is empty.
 */
export async function completeAndDequeue(
    projectId: string,
    queueId: string,
): Promise<{ queueId: string; payload: any } | null> {
    // Mark current as completed
    await PipelineQueue.findByIdAndUpdate(queueId, {
        status: 'completed',
        completedAt: new Date(),
    });

    // Find and claim the next queued item
    const next = await PipelineQueue.findOneAndUpdate(
        { projectId, status: 'queued' },
        { status: 'running', startedAt: new Date() },
        { sort: { position: 1 }, new: true }
    );

    if (!next) return null;

    return {
        queueId: next._id.toString(),
        payload: (next as any).payload,
    };
}

/**
 * Mark a pipeline as errored and dequeue the next.
 */
export async function errorAndDequeue(
    projectId: string,
    queueId: string,
): Promise<{ queueId: string; payload: any } | null> {
    await PipelineQueue.findByIdAndUpdate(queueId, {
        status: 'error',
        completedAt: new Date(),
    });

    return completeAndDequeue(projectId, queueId).then(() => {
        // Re-check since completeAndDequeue already marked it
        return PipelineQueue.findOneAndUpdate(
            { projectId, status: 'queued' },
            { status: 'running', startedAt: new Date() },
            { sort: { position: 1 }, new: true }
        ).then(next => next ? { queueId: next._id.toString(), payload: (next as any).payload } : null);
    });
}

/**
 * Cancel all queued items for a project (not running ones).
 */
export async function cancelQueue(projectId: string): Promise<number> {
    const result = await PipelineQueue.updateMany(
        { projectId, status: 'queued' },
        { status: 'cancelled', completedAt: new Date() }
    );
    return result.modifiedCount;
}

/**
 * Get queue status for a project.
 */
export async function getQueueStatus(projectId: string): Promise<{
    running: number;
    queued: number;
    items: Array<{ id: string; position: number; status: string; createdAt: Date }>;
}> {
    const items = await PipelineQueue.find({
        projectId,
        status: { $in: ['queued', 'running'] },
    }).sort({ position: 1 }).lean();

    return {
        running: items.filter(i => i.status === 'running').length,
        queued: items.filter(i => i.status === 'queued').length,
        items: items.map(i => ({
            id: (i as any)._id.toString(),
            position: (i as any).position,
            status: i.status as string,
            createdAt: (i as any).createdAt,
        })),
    };
}
