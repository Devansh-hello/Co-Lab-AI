/**
 * Checkpoint Handler
 *
 * Handles resume_checkpoint WebSocket messages. Restores pipeline
 * state from a saved checkpoint and resumes from the next phase.
 */

import type { ConnectionContext, PipelineState } from "../types.js";
import { emitEvent } from "../event-emitter.js";
import { Message, ProjectSnapshot } from "../../models/index.js";
import { getCheckpoint, getResumePhase } from "../../services/checkpoint.js";
import { getUserSettings } from "../../services/user-settings.js";
import { getPluginContext } from "../../services/plugin-context.js";
import { handleProceed } from "./proceed.handler.js";

export async function handleResumeCheckpoint(
    parsed: any,
    ctx: ConnectionContext,
): Promise<void> {
    const { checkpointId, projectId } = parsed;

    if (!checkpointId) {
        emitEvent(ctx, { type: 'error', message: 'No checkpoint ID provided' });
        return;
    }

    const checkpoint = await getCheckpoint(checkpointId);
    if (!checkpoint) {
        emitEvent(ctx, { type: 'error', message: 'Checkpoint not found' });
        return;
    }

    if (checkpoint.userId.toString() !== ctx.userId) {
        emitEvent(ctx, { type: 'error', message: 'Not authorized for this checkpoint' });
        return;
    }

    emitEvent(ctx, {
        type: 'status', agent: 'System',
        message: `Resuming from checkpoint: ${checkpoint.label || checkpoint.phase}`,
    });

    const snapshot = await ProjectSnapshot.findOne({ projectId: checkpoint.projectId }).lean();
    const userSettings = await getUserSettings(ctx.userId);
    const pluginContext = await getPluginContext(ctx.userId, checkpoint.projectId.toString(), '');

    // Create a new message doc for the resumed pipeline
    const messageDoc = new Message({
        projectId: checkpoint.projectId,
        userMessage: `[Resumed from checkpoint: ${checkpoint.label}]`,
        status: 'processing',
        intent: checkpoint.state.taskFile?.intent || 'iterate',
    });
    await messageDoc.save();

    const resumePhase = getResumePhase(checkpoint.phase);

    // Rebuild pipeline state from checkpoint
    const pipelineState: PipelineState = {
        projectId: checkpoint.projectId.toString(),
        userId: ctx.userId,
        provider: checkpoint.state.provider || 'openrouter',
        model: checkpoint.state.model || 'openai/gpt-oss-120b:free',
        taskFile: checkpoint.state.taskFile,
        messageDoc,
        snapshot: snapshot as any,
        understanding: checkpoint.state.understanding,
        qaAnswers: checkpoint.state.qaAnswers,
        pluginContext,
        userSettings,
        phase: resumePhase as any,
        feedbackIteration: checkpoint.state.feedbackIteration || 0,
        frontendResult: checkpoint.state.frontendResult,
        backendResult: checkpoint.state.backendResult,
    };

    ctx.pipeline = pipelineState;

    // If resuming from planning or later, re-emit the plan and proceed
    if (checkpoint.state.taskFile) {
        emitEvent(ctx, { type: 'final_plan', content: checkpoint.state.taskFile });
    }

    // Resume pipeline from the appropriate phase
    if (['building', 'reviewing', 'testing', 'feedback', 'done'].includes(resumePhase)) {
        await handleProceed({ proceed: true, projectId: checkpoint.projectId.toString() }, ctx);
    } else {
        emitEvent(ctx, {
            type: 'status', agent: 'System',
            message: `Pipeline restored at ${checkpoint.phase}. Waiting for user input to continue.`,
        });
    }
}
