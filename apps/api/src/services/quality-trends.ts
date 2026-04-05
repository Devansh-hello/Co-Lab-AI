/**
 * Quality Trends Service
 *
 * Records and queries quality metrics over time.
 * Enables regression detection when model/prompt changes cause quality drops.
 */

import { QualityTrend } from "../models/index.js";

/**
 * Record a pipeline run's quality metrics.
 */
export async function recordQualityTrend(data: {
    projectId: string;
    userId: string;
    messageId: string;
    grade: string;
    overall: number;
    metrics: Record<string, number>;
    tokenUsage?: Record<string, number>;
    durationMs: number;
    feedbackIterations: number;
    modelUsed?: string;
    complexity?: number;
    feedbackTriggered?: boolean;
}): Promise<void> {
    await QualityTrend.create({
        projectId: data.projectId,
        userId: data.userId,
        messageId: data.messageId,
        grade: data.grade,
        overall: data.overall,
        metrics: data.metrics,
        tokenUsage: data.tokenUsage || {},
        durationMs: data.durationMs,
        feedbackIterations: data.feedbackIterations,
        modelUsed: data.modelUsed,
        complexity: data.complexity,
        feedbackTriggered: data.feedbackTriggered || false,
    });
}

/**
 * Get quality trend for a project (last N runs).
 */
export async function getProjectTrend(projectId: string, limit = 20): Promise<any[]> {
    return QualityTrend.find({ projectId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
}

/**
 * Get quality trend for a user across all projects.
 */
export async function getUserTrend(userId: string, limit = 50): Promise<any[]> {
    return QualityTrend.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
}

/**
 * Detect regression: compare latest run against the average of the last N runs.
 * Returns a regression alert if the latest score dropped significantly.
 */
export async function detectRegression(
    projectId: string,
    latestOverall: number,
    windowSize = 5,
    thresholdDrop = 15,
): Promise<{ regressed: boolean; avgScore: number; drop: number } | null> {
    const recent = await QualityTrend.find({ projectId })
        .sort({ createdAt: -1 })
        .skip(1) // Exclude the latest (just recorded)
        .limit(windowSize)
        .lean();

    if (recent.length < 2) return null; // Not enough data

    const avgScore = recent.reduce((sum, r) => sum + ((r as any).overall || 0), 0) / recent.length;
    const drop = avgScore - latestOverall;

    return {
        regressed: drop >= thresholdDrop,
        avgScore: Math.round(avgScore),
        drop: Math.round(drop),
    };
}

/**
 * Get aggregate stats for a project.
 */
export async function getProjectStats(projectId: string): Promise<{
    totalRuns: number;
    avgGrade: string;
    avgScore: number;
    avgDuration: number;
    totalTokens: number;
}> {
    const runs = await QualityTrend.find({ projectId }).lean();
    if (runs.length === 0) {
        return { totalRuns: 0, avgGrade: '-', avgScore: 0, avgDuration: 0, totalTokens: 0 };
    }

    const avgScore = runs.reduce((s, r) => s + ((r as any).overall || 0), 0) / runs.length;
    const avgDuration = runs.reduce((s, r) => s + ((r as any).durationMs || 0), 0) / runs.length;
    const totalTokens = runs.reduce((s, r) => s + ((r as any).tokenUsage?.total || 0), 0);

    const gradeFromScore = (s: number) =>
        s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 70 ? 'C' : s >= 60 ? 'D' : 'F';

    return {
        totalRuns: runs.length,
        avgGrade: gradeFromScore(avgScore),
        avgScore: Math.round(avgScore),
        avgDuration: Math.round(avgDuration),
        totalTokens,
    };
}
