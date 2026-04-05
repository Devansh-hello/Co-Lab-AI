/**
 * Proceed Handler
 *
 * The main build/review/test/feedback pipeline. Invoked when the user
 * confirms the plan and triggers code generation. This is the largest
 * handler — it orchestrates parallel agent invocations, quality scoring,
 * and the feedback loop.
 */

import type { ConnectionContext } from "../types.js";
import { emitEvent } from "../event-emitter.js";
import { Project, ProjectSnapshot } from "../../models/index.js";
import { recordQualityTrend, detectRegression } from "../../services/quality-trends.js";
import { FrontendCodeAgent } from "../../agents/frontend.agent.js";
import { BackendCodeAgent } from "../../agents/backend.agent.js";
import { ReviewAgent } from "../../agents/review.agent.js";
import { TestAgent } from "../../agents/test.agent.js";
import { FeedbackFixAgent } from "../../agents/feedback.agent.js";
import { computeQualityScore } from "../../agents/quality-scorer.js";
import type { CodeMap } from "../../agents/types.js";

export async function handleProceed(
    parsed: any,
    ctx: ConnectionContext,
): Promise<void> {
    const pipeline = ctx.pipeline;
    if (!pipeline) {
        emitEvent(ctx, { type: 'error', message: 'No pending pipeline to proceed' });
        return;
    }

    const { proceed } = parsed;
    if (!proceed) {
        pipeline.messageDoc.status = 'cancelled';
        await pipeline.messageDoc.save();
        emitEvent(ctx, { type: 'cancelled', message: 'Generation stopped by user.' });
        ctx.pipeline = null;
        ctx.pipelineAbort = null;
        return;
    }

    pipeline.phase = 'building';
    const pipelineStartTime = Date.now();
    const { messageDoc, snapshot, provider, model, projectId } = pipeline;
    const taskFile = pipeline.taskFile;

    if (!taskFile) {
        emitEvent(ctx, { type: 'error', message: 'No task plan available' });
        return;
    }

    // ── Send complexity score ───────────────────────────────
    const complexity = taskFile.complexity || { overall: 3 };
    messageDoc.complexityScore = complexity.overall;
    emitEvent(ctx, {
        type: 'complexity_score',
        score: complexity.overall,
        reasoning: complexity.reasoning || '',
    });

    const isDirect = taskFile.intent === 'debug' && complexity.overall <= 2;

    // ── Code Agents (parallel) ──────────────────────────────
    let frontendResult: CodeMap | null = pipeline.frontendResult || null;
    let backendResult: CodeMap | null = pipeline.backendResult || null;

    const hasFrontendTasks = taskFile.frontendTasks && taskFile.frontendTasks.length > 0;
    const hasBackendTasks = taskFile.backendTasks && taskFile.backendTasks.length > 0;
    const agentPromises: Promise<void>[] = [];

    if (hasFrontendTasks && !frontendResult) {
        emitEvent(ctx, {
            type: 'status', agent: 'Frontend Agent',
            message: 'Building frontend...',
            provider: pipeline.userSettings.agentModels.frontend.provider,
            model: pipeline.userSettings.agentModels.frontend.model,
        });

        agentPromises.push(
            FrontendCodeAgent(taskFile, snapshot?.frontendCode || null, ctx.ws, pipeline.pluginContext, pipeline.userSettings)
                .then(result => {
                    const agentOutput = result as CodeMap;
                    /* For iterate/debug: merge with existing code so unchanged files are preserved */
                    const isPartial = (taskFile.intent === 'iterate' || taskFile.intent === 'debug') && snapshot?.frontendCode;
                    frontendResult = isPartial ? { ...snapshot!.frontendCode, ...agentOutput } as CodeMap : agentOutput;
                    messageDoc.frontendResponse = { content: frontendResult, timestamp: new Date() };
                    emitEvent(ctx, { type: 'frontend_complete', content: frontendResult });
                })
        );
    } else if (frontendResult) {
        messageDoc.frontendResponse = { content: frontendResult, timestamp: new Date() };
        emitEvent(ctx, { type: 'frontend_complete', content: frontendResult });
    }

    if (hasBackendTasks && !backendResult) {
        emitEvent(ctx, {
            type: 'status', agent: 'Backend Agent',
            message: 'Building backend...',
            provider, model,
        });

        agentPromises.push(
            BackendCodeAgent(taskFile, snapshot?.backendCode || null, provider, model, ctx.ws, pipeline.pluginContext, pipeline.userSettings)
                .then(result => {
                    const agentOutput = result as CodeMap;
                    const isPartial = (taskFile.intent === 'iterate' || taskFile.intent === 'debug') && snapshot?.backendCode;
                    backendResult = isPartial ? { ...snapshot!.backendCode, ...agentOutput } as CodeMap : agentOutput;
                    messageDoc.backendResponse = { content: backendResult, timestamp: new Date() };
                    emitEvent(ctx, { type: 'backend_complete', content: backendResult });
                })
        );
    } else if (backendResult) {
        messageDoc.backendResponse = { content: backendResult, timestamp: new Date() };
        emitEvent(ctx, { type: 'backend_complete', content: backendResult });
    }

    await Promise.all(agentPromises);
    pipeline.frontendResult = frontendResult;
    pipeline.backendResult = backendResult;
    await messageDoc.save();

    // ── Review Agent ────────────────────────────────────────
    emitEvent(ctx, {
        type: 'status', agent: 'Review Agent',
        message: 'Reviewing code and checking API compatibility...',
        provider: pipeline.userSettings.agentModels.review.provider,
        model: pipeline.userSettings.agentModels.review.model,
    });

    const reviewResult = await ReviewAgent(taskFile, frontendResult, backendResult, ctx.ws, pipeline.userSettings);
    messageDoc.reviewResponse = { content: reviewResult, timestamp: new Date() };
    await messageDoc.save();
    emitEvent(ctx, { type: 'review_complete', content: reviewResult });

    // ── Test Agent ──────────────────────────────────────────
    pipeline.phase = 'testing';
    emitEvent(ctx, {
        type: 'status', agent: 'Test Agent',
        message: 'Generating test cases...',
        provider: pipeline.userSettings.agentModels.test.provider || 'glm',
        model: pipeline.userSettings.agentModels.test.model || 'GLM-4.7-FlashX',
    });

    const testResult = await TestAgent(taskFile, frontendResult, backendResult, ctx.ws, pipeline.userSettings);
    messageDoc.testResponse = { content: testResult, timestamp: new Date() };
    await messageDoc.save();
    emitEvent(ctx, { type: 'test_complete', content: testResult });

    // ── Quality Scoring ─────────────────────────────────────
    const quality = computeQualityScore(reviewResult, testResult, taskFile);
    messageDoc.qualityScore = { grade: quality.grade, metrics: quality.metrics, timestamp: new Date() };
    await messageDoc.save();

    emitEvent(ctx, {
        type: 'quality_score',
        grade: quality.grade,
        metrics: quality.metrics,
        overall: quality.overall,
        needsFeedback: quality.needsFeedback,
    });

    // ── Feedback Loop (max 1 iteration) ─────────────────────
    if (quality.needsFeedback && pipeline.feedbackIteration < 1 && !isDirect) {
        pipeline.phase = 'feedback';
        pipeline.feedbackIteration++;
        messageDoc.feedbackIterations = pipeline.feedbackIteration;

        const actionableFixes = reviewResult?.codeReview?.actionableFixes || [];
        const apiMismatches = reviewResult?.apiCompatibility?.mismatches || [];
        const allIssues = [...actionableFixes, ...apiMismatches];

        const frontendIssues = allIssues.filter((i: string) =>
            /frontend|component|react|ui|page|css|style|jsx|tsx/i.test(i));
        const backendIssues = allIssues.filter((i: string) =>
            /backend|endpoint|route|api|server|database|model|auth|middleware|schema/i.test(i));

        const unclassified = allIssues.filter((i: string) =>
            !frontendIssues.includes(i) && !backendIssues.includes(i));
        if (unclassified.length > 0) backendIssues.push(...unclassified);

        const skippedFrontend = frontendIssues.length === 0;
        const skippedBackend = backendIssues.length === 0;

        emitEvent(ctx, {
            type: 'feedback_iteration',
            iteration: pipeline.feedbackIteration,
            issues: allIssues.slice(0, 5),
            message: `Quality grade ${quality.grade} — fixing ${allIssues.length} issues${skippedFrontend ? ' (frontend OK, skipping)' : ''}${skippedBackend ? ' (backend OK, skipping)' : ''}...`,
        });

        const fixPromises: Promise<void>[] = [];

        if (frontendIssues.length > 0 && frontendResult) {
            emitEvent(ctx, {
                type: 'status', agent: 'Frontend Agent',
                message: `Fixing ${frontendIssues.length} issues...`,
                provider: pipeline.userSettings.agentModels.frontend.provider,
                model: pipeline.userSettings.agentModels.frontend.model,
            });
            fixPromises.push(
                FeedbackFixAgent(frontendIssues, frontendResult, 'frontend', taskFile, ctx.ws, pipeline.userSettings)
                    .then(fixed => {
                        frontendResult = fixed as CodeMap;
                        pipeline.frontendResult = fixed as CodeMap;
                        messageDoc.frontendResponse = { content: fixed, timestamp: new Date() };
                        emitEvent(ctx, { type: 'frontend_complete', content: fixed as CodeMap });
                    })
            );
        }

        if (backendIssues.length > 0 && backendResult) {
            emitEvent(ctx, {
                type: 'status', agent: 'Backend Agent',
                message: `Fixing ${backendIssues.length} issues...`,
                provider: pipeline.userSettings.agentModels.backend.provider,
                model: pipeline.userSettings.agentModels.backend.model,
            });
            fixPromises.push(
                FeedbackFixAgent(backendIssues, backendResult, 'backend', taskFile, ctx.ws, pipeline.userSettings)
                    .then(fixed => {
                        backendResult = fixed as CodeMap;
                        pipeline.backendResult = fixed as CodeMap;
                        messageDoc.backendResponse = { content: fixed, timestamp: new Date() };
                        emitEvent(ctx, { type: 'backend_complete', content: fixed as CodeMap });
                    })
            );
        }

        if (fixPromises.length > 0) {
            await Promise.all(fixPromises);
            await messageDoc.save();

            emitEvent(ctx, {
                type: 'status', agent: 'Review Agent',
                message: 'Re-evaluating fixed code...',
            });

            const postFixReview = await ReviewAgent(taskFile, frontendResult, backendResult, ctx.ws, pipeline.userSettings);
            const postFixQuality = computeQualityScore(postFixReview, testResult, taskFile);
            emitEvent(ctx, {
                type: 'quality_score',
                grade: postFixQuality.grade,
                metrics: postFixQuality.metrics,
                overall: postFixQuality.overall,
                needsFeedback: false,
                iteration: pipeline.feedbackIteration,
            });
        }
    }

    // ── Record Quality Trend ─────────────────────────────
    const durationMs = Date.now() - pipelineStartTime;
    recordQualityTrend({
        projectId,
        userId: pipeline.userId,
        messageId: messageDoc._id.toString(),
        grade: quality.grade,
        overall: quality.overall,
        metrics: quality.metrics,
        durationMs,
        feedbackIterations: pipeline.feedbackIteration,
        modelUsed: pipeline.userSettings.agentModels.frontend.model,
        complexity: complexity.overall,
        feedbackTriggered: quality.needsFeedback,
    }).catch(err => console.error('[quality-trend] Failed to record:', err));

    // Check for regression (non-blocking)
    detectRegression(projectId, quality.overall).then(result => {
        if (result?.regressed) {
            emitEvent(ctx, {
                type: 'status',
                agent: 'System',
                message: `Quality regression detected: score dropped ${result.drop} points from average ${result.avgScore}`,
            });
        }
    }).catch(() => {});

    // ── Save Snapshot + Project Memory ────────────────────
    // Accumulate quality feedback into project memory with timestamps for staleness tracking
    const feedbackItems: Array<{ value: string; createdAt: Date; reinforcements: number }> = [];
    const criticalIssues = reviewResult?.codeReview?.criticalIssues || [];
    const mismatches = reviewResult?.apiCompatibility?.mismatches || [];
    if (criticalIssues.length > 0) {
        feedbackItems.push(...criticalIssues.slice(0, 3).map((i: string) => ({
            value: `Previous review found: ${i}`,
            createdAt: new Date(),
            reinforcements: 1,
        })));
    }
    if (mismatches.length > 0) {
        feedbackItems.push(...mismatches.slice(0, 3).map((m: string) => ({
            value: `API mismatch: ${m}`,
            createdAt: new Date(),
            reinforcements: 1,
        })));
    }

    /* For iterate/debug: merge new files with existing snapshot (preserves unchanged files).
     * For build: use agent output as-is (complete fresh code). */
    const isPartialUpdate = taskFile.intent === 'iterate' || taskFile.intent === 'debug';
    const mergedFrontend = isPartialUpdate && snapshot?.frontendCode && frontendResult
        ? { ...snapshot.frontendCode, ...frontendResult }
        : frontendResult || snapshot?.frontendCode || null;
    const mergedBackend = isPartialUpdate && snapshot?.backendCode && backendResult
        ? { ...snapshot.backendCode, ...backendResult }
        : backendResult || snapshot?.backendCode || null;

    await ProjectSnapshot.findOneAndUpdate(
        { projectId },
        {
            projectId,
            frontendCode: mergedFrontend,
            backendCode: mergedBackend,
            taskFile,
            updatedAt: new Date(),
            ...(feedbackItems.length > 0 ? {
                $push: { 'projectMemory.qualityFeedback': { $each: feedbackItems, $slice: -10 } },
            } : {}),
        },
        { upsert: true, new: true }
    );

    await Project.findByIdAndUpdate(projectId, { updatedAt: new Date() });

    messageDoc.status = 'completed';
    await messageDoc.save();

    /* Mark PipelineRun as done */
    if (ctx.pipelineRunId) {
        try {
            const { PipelineRun } = await import("../../models/index.js");
            await PipelineRun.findByIdAndUpdate(ctx.pipelineRunId, { phase: 'done', updatedAt: new Date() });
        } catch { /* non-critical */ }
    }

    emitEvent(ctx, {
        type: 'all_complete',
        message: 'Project generation completed!',
        messageId: messageDoc._id,
        qualityGrade: quality.grade,
        feedbackIterations: pipeline.feedbackIteration,
    });

    ctx.pipeline = null;
    ctx.pipelineAbort = null;
    ctx.pipelineRunId = null;
}
