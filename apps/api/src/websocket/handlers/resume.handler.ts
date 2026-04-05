/**
 * Resume Handler
 *
 * Handles client reconnection and pipeline resumption. When a client
 * sends { type: "resume", sessionId, lastSeq }, this handler:
 *   1. Tries to replay from the circular buffer (fast path)
 *   2. Falls back to DB replay if buffer doesn't go far enough
 *   3. Re-enters the pipeline at the saved phase if it was active
 */

import type { ConnectionContext } from "../types.js";
import { emitEvent, replayFromBuffer, replayFromDatabase } from "../event-emitter.js";
import { getUserSettings } from "../../services/user-settings.js";
import { getPluginContext } from "../../services/plugin-context.js";
import { handleProceed } from "./proceed.handler.js";

export async function handleResume(
    parsed: any,
    ctx: ConnectionContext,
): Promise<void> {
    const { lastSeq } = parsed;

    // Try buffer replay first (fast path)
    const bufferOldest = ctx.eventBuffer.oldestSeq();
    if (bufferOldest !== null && lastSeq >= bufferOldest - 1) {
        const replayed = replayFromBuffer(ctx, lastSeq);
        if (replayed > 0) return;
    }

    // Fall back to database replay if we have an active pipeline run
    if (!ctx.pipelineRunId) {
        // Try to find an active pipeline run for this user
        const { PipelineRun } = await import("../../models/index.js");
        const activeRun = await PipelineRun.findOne({
            userId: ctx.userId,
            phase: { $nin: ['done', 'error', 'cancelled'] },
        }).sort({ updatedAt: -1 }).lean();

        if (!activeRun) {
            emitEvent(ctx, { type: 'resume_failed', reason: 'no_active_pipeline' });
            return;
        }

        ctx.pipelineRunId = (activeRun as any)._id.toString();

        // Replay events from DB
        const replayed = await replayFromDatabase(ctx, ctx.pipelineRunId!, lastSeq);

        // Restore pipeline state and re-enter if needed
        const state = (activeRun as any).state;
        if (state && (activeRun as any).phase !== 'done') {
            await restorePipeline(ctx, activeRun as any);
        }

        return;
    }

    // Replay from DB for known pipeline run
    const replayed = await replayFromDatabase(ctx, ctx.pipelineRunId, lastSeq);
    if (replayed === 0) {
        emitEvent(ctx, { type: 'resume_failed', reason: 'no_events_found' });
    }
}

/**
 * Restore a pipeline from saved state and re-enter at the saved phase.
 * Only re-runs agents that haven't completed.
 */
async function restorePipeline(ctx: ConnectionContext, run: any): Promise<void> {
    const { Message } = await import("../../models/index.js");
    const state = run.state;
    if (!state) return;

    // Re-load live dependencies
    const messageDoc = await Message.findById(run.messageId);
    if (!messageDoc) return;

    const [pluginContext, userSettings] = await Promise.all([
        getPluginContext(ctx.userId),
        getUserSettings(ctx.userId),
    ]);

    ctx.pipeline = {
        ...state,
        messageDoc,
        pluginContext,
        userSettings,
    };

    const phase = state.phase;

    // Phases waiting for user input — just restore state, don't re-run anything
    if (phase === 'understanding' || phase === 'qa' || phase === 'planning') {
        return;
    }

    // Active phases — re-enter the build pipeline
    if (phase === 'building' || phase === 'testing' || phase === 'feedback') {
        await handleProceed({ proceed: true }, ctx);
    }
}
