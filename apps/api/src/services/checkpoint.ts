/**
 * Checkpoint Service
 *
 * Saves and restores pipeline state at phase boundaries.
 * Enables resume-from-failure and manual rewind to any phase.
 */

import { Checkpoint } from "../models/checkpoint.model.js";
import type { ConnectionContext, PipelineState } from "../websocket/types.js";

/** Phases in execution order — used for rewind validation */
const PHASE_ORDER = ['understanding', 'qa', 'planning', 'building', 'reviewing', 'testing', 'feedback', 'done'] as const;

/**
 * Save a checkpoint at the current pipeline phase.
 * Extracts serializable state from the pipeline context.
 */
export async function saveCheckpoint(
    ctx: ConnectionContext,
    phase: string,
    extra?: {
        reviewResult?: any;
        testResult?: any;
        qualityScore?: any;
        label?: string;
    }
): Promise<string> {
    const pipeline = ctx.pipeline;
    if (!pipeline) throw new Error('No active pipeline');

    const checkpoint = await Checkpoint.create({
        pipelineRunId: ctx.pipelineRunId || `run_${Date.now()}`,
        projectId: pipeline.projectId,
        userId: pipeline.userId,
        messageId: pipeline.messageDoc?._id,
        phase,
        state: {
            taskFile: pipeline.taskFile,
            understanding: pipeline.understanding,
            qaAnswers: pipeline.qaAnswers,
            frontendResult: pipeline.frontendResult,
            backendResult: pipeline.backendResult,
            reviewResult: extra?.reviewResult || null,
            testResult: extra?.testResult || null,
            qualityScore: extra?.qualityScore || null,
            provider: pipeline.provider,
            model: pipeline.model,
            feedbackIteration: pipeline.feedbackIteration,
        },
        seq: ctx.lastSeq,
        label: extra?.label || `After ${phase}`,
    });

    return checkpoint._id.toString();
}

/**
 * List all checkpoints for a pipeline run or project.
 */
export async function listCheckpoints(
    projectId: string,
    pipelineRunId?: string,
): Promise<any[]> {
    const query: any = { projectId };
    if (pipelineRunId) query.pipelineRunId = pipelineRunId;

    return Checkpoint.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
}

/**
 * Get a specific checkpoint by ID.
 */
export async function getCheckpoint(checkpointId: string): Promise<any> {
    return Checkpoint.findById(checkpointId).lean();
}

/**
 * Get the latest checkpoint for a project (most recent successful phase).
 */
export async function getLatestCheckpoint(projectId: string): Promise<any> {
    return Checkpoint.findOne({ projectId })
        .sort({ createdAt: -1 })
        .lean();
}

/**
 * Restore pipeline state from a checkpoint.
 * Returns the phase to resume from (the next phase after the checkpoint).
 */
export function getResumePhase(checkpointPhase: string): string {
    const idx = PHASE_ORDER.indexOf(checkpointPhase as any);
    if (idx === -1 || idx >= PHASE_ORDER.length - 1) return 'done';
    return PHASE_ORDER[idx + 1];
}

/**
 * Validate that a rewind target is valid (must be before the current phase).
 */
export function canRewindTo(currentPhase: string, targetPhase: string): boolean {
    const currentIdx = PHASE_ORDER.indexOf(currentPhase as any);
    const targetIdx = PHASE_ORDER.indexOf(targetPhase as any);
    return targetIdx >= 0 && targetIdx < currentIdx;
}
