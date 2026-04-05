/**
 * Event Emitter
 *
 * Centralized function for emitting pipeline events. Every event sent
 * to the client goes through here. Responsibilities:
 *   1. Assign monotonic sequence number
 *   2. Persist to MongoDB (for pipeline resumability)
 *   3. Push to circular buffer (for fast reconnect replay)
 *   4. Send over WebSocket (if open)
 *
 * Stream events (*_stream) are buffered but only persisted at throttled
 * intervals since the `accumulated` field already contains full text.
 */

import { WebSocket } from "ws";
import type { ConnectionContext, ServerEvent } from "./types.js";
import { PERSISTABLE_EVENT_TYPES, STREAM_EVENT_TYPES } from "./types.js";

/** Throttle interval for persisting stream events (ms) */
const STREAM_PERSIST_INTERVAL = 5000;

/** Tracks last persist time per stream type per pipeline */
const streamPersistTimers = new WeakMap<ConnectionContext, Map<string, number>>();

/**
 * Emit a pipeline event to the client.
 *
 * Assigns a sequence number, pushes to the circular buffer,
 * persists important events to the database, and sends over WebSocket.
 */
export function emitEvent(ctx: ConnectionContext, event: ServerEvent): void {
    // Assign sequence number
    ctx.lastSeq++;
    (event as any).seq = ctx.lastSeq;

    // Push to circular buffer for fast replay
    ctx.eventBuffer.push(ctx.lastSeq, event);

    // Persist to database (async, non-blocking)
    persistEvent(ctx, event).catch(err => {
        console.error("[event-emitter] Failed to persist event:", err.message);
    });

    // Send over WebSocket if open
    if (ctx.ws.readyState === WebSocket.OPEN) {
        try {
            ctx.ws.send(JSON.stringify(event));
        } catch (err: any) {
            console.error("[event-emitter] Failed to send:", err.message);
        }
    }
}

/**
 * Persist an event to the PipelineEvent collection.
 * Stream events are throttled — only persisted every STREAM_PERSIST_INTERVAL.
 */
async function persistEvent(ctx: ConnectionContext, event: ServerEvent): Promise<void> {
    const eventType = event.type;

    // Skip session/resume_failed — these are transport-level, not pipeline-level
    if (eventType === 'session' || eventType === 'resume_failed') return;

    // Skip if no active pipeline run
    if (!ctx.pipelineRunId) return;

    // Stream events: throttle persistence
    if ((STREAM_EVENT_TYPES as readonly string[]).includes(eventType)) {
        let timers = streamPersistTimers.get(ctx);
        if (!timers) {
            timers = new Map();
            streamPersistTimers.set(ctx, timers);
        }

        const lastPersist = timers.get(eventType) || 0;
        const now = Date.now();
        if (now - lastPersist < STREAM_PERSIST_INTERVAL) return;
        timers.set(eventType, now);
    }

    // Persistable events: write to DB
    // Import lazily to avoid circular deps at module load
    const { PipelineEvent } = await import("../models/index.js");
    await PipelineEvent.create({
        pipelineRunId: ctx.pipelineRunId,
        messageId: ctx.pipeline?.messageDoc?._id,
        projectId: ctx.pipeline?.projectId,
        userId: ctx.userId,
        seq: (event as any).seq,
        type: eventType,
        payload: event,
    });
}

/**
 * Replay buffered events to a reconnecting client.
 * Returns the number of events replayed.
 */
export function replayFromBuffer(ctx: ConnectionContext, afterSeq: number): number {
    const events = ctx.eventBuffer.getAfter(afterSeq);
    for (const event of events) {
        if (ctx.ws.readyState === WebSocket.OPEN) {
            ctx.ws.send(JSON.stringify(event));
        }
    }
    return events.length;
}

/**
 * Replay events from the database for a pipeline run.
 * Used when the circular buffer doesn't go back far enough.
 */
export async function replayFromDatabase(
    ctx: ConnectionContext,
    pipelineRunId: string,
    afterSeq: number
): Promise<number> {
    const { PipelineEvent } = await import("../models/index.js");
    const events = await PipelineEvent.find({
        pipelineRunId,
        seq: { $gt: afterSeq },
    }).sort({ seq: 1 }).lean();

    for (const doc of events) {
        if (ctx.ws.readyState === WebSocket.OPEN) {
            ctx.ws.send(JSON.stringify(doc.payload));
        }
    }
    return events.length;
}
