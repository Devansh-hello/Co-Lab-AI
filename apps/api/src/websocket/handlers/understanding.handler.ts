/**
 * Understanding Response Handler
 *
 * Processes the user's confirm/cancel after the understanding phase.
 * If confirmed with no questions, jumps to planning. If questions
 * exist, transitions to Q&A phase.
 */

import type { ConnectionContext } from "../types.js";
import { emitEvent } from "../event-emitter.js";
import { runOrchestratorAndSendPlan } from "./qa.handler.js";
import { tryRestorePipelineFromRun } from "./restore-pipeline.js";

/** Update PipelineRun phase (non-blocking) */
async function updateRunPhase(ctx: ConnectionContext, phase: string): Promise<void> {
    if (!ctx.pipelineRunId) return;
    try {
        const { PipelineRun } = await import("../../models/index.js");
        await PipelineRun.findByIdAndUpdate(ctx.pipelineRunId, {
            phase,
            'state.phase': phase,
            'state.taskFile': ctx.pipeline?.taskFile,
            lastSeq: ctx.lastSeq,
            updatedAt: new Date(),
        });
    } catch { /* non-critical */ }
}

export async function handleUnderstandingResponse(
    parsed: any,
    ctx: ConnectionContext,
): Promise<void> {
    if (!ctx.pipeline) {
        const restored = await tryRestorePipelineFromRun(ctx, ['understanding', 'qa']);
        if (!restored) {
            emitEvent(ctx, { type: 'error', message: 'No pending project' });
            return;
        }
    }
    const pipeline = ctx.pipeline!;

    const { confirmed } = parsed;
    if (!confirmed) {
        pipeline.messageDoc.status = 'cancelled';
        await pipeline.messageDoc.save();
        await updateRunPhase(ctx, 'cancelled');
        emitEvent(ctx, { type: 'cancelled', message: 'Project cancelled by user.' });
        return;
    }

    /* If no questions to ask, go straight to planning */
    if (!pipeline.understanding || pipeline.understanding.questions.length === 0) {
        pipeline.phase = 'planning';
        await updateRunPhase(ctx, 'planning');
        await runOrchestratorAndSendPlan(ctx);
        return;
    }

    pipeline.phase = 'qa';
    await updateRunPhase(ctx, 'qa');
}
