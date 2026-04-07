/**
 * Q&A Handler + Orchestrator Runner
 *
 * Processes clarifying question answers from the user and runs the
 * orchestrator agent to generate the task plan.
 */

import type { ConnectionContext } from "../types.js";
import { emitEvent } from "../event-emitter.js";
import { Message } from "../../models/index.js";
import { OrchestratorAgent } from "../../agents/orchestrator.agent.js";
import { tryRestorePipelineFromRun } from "./restore-pipeline.js";

/** Handle Q&A answers and proceed to orchestrator */
export async function handleQAComplete(
    parsed: any,
    ctx: ConnectionContext,
): Promise<void> {
    if (!ctx.pipeline) {
        const restored = await tryRestorePipelineFromRun(ctx, ['qa', 'planning']);
        if (!restored) {
            emitEvent(ctx, { type: 'error', message: 'No pending project' });
            return;
        }
    }

    const pipeline = ctx.pipeline!;
    const { answers } = parsed;
    pipeline.qaAnswers = answers;
    pipeline.phase = 'planning';
    pipeline.messageDoc.qaAnswers = answers;
    await pipeline.messageDoc.save();

    /* Build enriched message for the orchestrator (includes Q&A context) */
    const originalMessage = pipeline.messageDoc.userMessage;
    const qaContext = Array.isArray(answers) && answers.length > 0
        ? '\n\nCLARIFICATIONS FROM USER:\n' + answers.map(
            (a: { questionId: string; answer: string }) => {
                const q = pipeline.understanding?.questions.find((q: any) => q.id === a.questionId);
                return `Q: ${q?.question || a.questionId}\nA: ${a.answer}`;
            }
        ).join('\n')
        : '';

    (pipeline.messageDoc as any)._enrichedMessage = `${originalMessage}${qaContext}`;
    await runOrchestratorAndSendPlan(ctx);
}

/** Run the orchestrator agent and send the plan to the client */
export async function runOrchestratorAndSendPlan(ctx: ConnectionContext): Promise<void> {
    const pipeline = ctx.pipeline!;

    emitEvent(ctx, {
        type: 'status', agent: 'Orchestrator Agent',
        message: 'Architecting your project...',
        provider: pipeline.userSettings.agentModels.orchestrator.provider,
        model: pipeline.userSettings.agentModels.orchestrator.model,
    });

    let conversationHistory: any[];
    try {
        conversationHistory = await Message.find({ projectId: pipeline.projectId })
            .sort({ timestamp: -1 }).limit(5).lean();
    } catch (err: any) {
        console.error("[orchestrator] Failed to load conversation history:", err.message);
        conversationHistory = [];
    }

    const orchestratorMessage = (pipeline.messageDoc as any)._enrichedMessage || pipeline.messageDoc.userMessage;

    const taskFile = await OrchestratorAgent(
        orchestratorMessage,
        conversationHistory,
        pipeline.snapshot, ctx.ws,
        pipeline.pluginContext,
        pipeline.userSettings
    );

    pipeline.taskFile = taskFile;
    pipeline.messageDoc.intent = taskFile.intent;
    pipeline.messageDoc.coordinatorResponse = { content: taskFile, timestamp: new Date() };
    await pipeline.messageDoc.save();

    /* Persist taskFile + phase so pipeline can be restored after disconnect */
    if (ctx.pipelineRunId) {
        try {
            const { PipelineRun } = await import("../../models/index.js");
            await PipelineRun.findByIdAndUpdate(ctx.pipelineRunId, {
                phase: 'planning',
                'state.phase': 'planning',
                'state.taskFile': taskFile,
                'state.snapshot': pipeline.snapshot,
                lastSeq: ctx.lastSeq,
                updatedAt: new Date(),
            });
        } catch { /* non-critical */ }
    }

    emitEvent(ctx, { type: 'final_plan', content: taskFile });
}
