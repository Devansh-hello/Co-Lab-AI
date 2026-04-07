/**
 * Pipeline Restoration
 *
 * Restores pipeline state from the database after a page refresh or
 * WebSocket reconnection where the in-memory state was lost.
 */

import type { ConnectionContext, PipelinePhase } from "../types.js";
import { PipelineRun, Message } from "../../models/index.js";
import { getUserSettings } from "../../services/user-settings.js";
import { getPluginContext } from "../../services/plugin-context.js";

/**
 * Try to restore pipeline from the most recent PipelineRun matching
 * the given phases. Returns true if restoration succeeded.
 */
export async function tryRestorePipelineFromRun(
    ctx: ConnectionContext,
    phases: string[],
): Promise<boolean> {
    try {
        const activeRun = await PipelineRun.findOne({
            userId: ctx.userId,
            phase: { $in: phases },
        }).sort({ updatedAt: -1 }).lean() as any;

        if (!activeRun?.state) return false;

        const messageDoc = await Message.findById(activeRun.messageId);
        if (!messageDoc) return false;

        const [userSettings, pluginContext] = await Promise.all([
            getUserSettings(ctx.userId),
            getPluginContext(ctx.userId),
        ]);

        const state = activeRun.state;
        ctx.pipeline = {
            projectId: state.projectId,
            userId: ctx.userId,
            provider: state.provider || 'openrouter',
            model: state.model || '',
            taskFile: state.taskFile || null,
            messageDoc,
            snapshot: state.snapshot || null,
            understanding: state.understanding || null,
            qaAnswers: state.qaAnswers || null,
            pluginContext,
            userSettings,
            phase: (state.phase || activeRun.phase) as PipelinePhase,
            feedbackIteration: state.feedbackIteration || 0,
            frontendResult: state.frontendResult || null,
            backendResult: state.backendResult || null,
        };
        ctx.pipelineRunId = activeRun._id.toString();
        return true;
    } catch (err) {
        console.error("[restore-pipeline] Failed to restore:", err);
        return false;
    }
}
