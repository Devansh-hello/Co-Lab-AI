/**
 * Quality Scorer (QA-Checker Pattern)
 *
 * Inspired by CodeAgent's QA-Checker: a supervisory function that evaluates
 * output quality and determines if a feedback loop is needed.
 *
 * Blends the Review Agent's AI-generated quality assessment with count-based
 * heuristics to produce a final grade (A-F) and overall score (0-100).
 */

import type { ReviewResult, TestResult, TaskFile } from "./types.js";

/**
 * Compute a quality score from review and test results.
 *
 * @param reviewResult - Review agent output
 * @param testResult   - Test agent output
 * @param taskFile     - Orchestrator task file (for feature count)
 * @returns Grade, metrics, overall score, and whether feedback is needed
 */
export function computeQualityScore(
    reviewResult: ReviewResult | null,
    testResult: TestResult | null,
    taskFile: TaskFile
): { grade: string; metrics: Record<string, number>; overall: number; needsFeedback: boolean } {
    const metrics: Record<string, number> = {
        completeness: 85,
        security: 85,
        compatibility: 90,
        codeQuality: 80,
        testCoverage: 0,
    };

    /* Use the Review Agent's own quality assessment as primary signal.
     * The AI reviewer has full context — our formula blends its assessment
     * with count-based checks rather than overriding it. */
    const aiMetrics = reviewResult?.qualityScore?.metrics;
    const aiOverall = reviewResult?.qualityScore?.overall;

    // ── Completeness ────────────────────────────────────────────
    // Cap the missing-items penalty ratio at 1.0 and use a gentler curve.
    const missing = reviewResult?.completionStatus?.missingItems || [];
    const totalFeatures = Math.max((taskFile.features || []).length, 1);
    const missingRatio = Math.min(missing.length / totalFeatures, 1.0);
    const frontendDone = reviewResult?.completionStatus?.frontendComplete !== false;
    const backendDone = reviewResult?.completionStatus?.backendComplete !== false;
    const baseCompleteness = (frontendDone && backendDone) ? 85 : (frontendDone || backendDone) ? 55 : 20;
    metrics.completeness = aiMetrics?.completeness
        ? Math.round((aiMetrics.completeness + Math.max(baseCompleteness - missingRatio * 40, 20)) / 2)
        : Math.max(20, Math.round(baseCompleteness - missingRatio * 40));

    // ── Security ────────────────────────────────────────────────
    // Gentler penalty: -10 per issue (not -20), floor at 30.
    const criticalIssues = reviewResult?.codeReview?.criticalIssues || [];
    const countPenalty = Math.min(criticalIssues.length * 10, 60);
    metrics.security = aiMetrics?.security
        ? Math.round((aiMetrics.security + Math.max(90 - countPenalty, 30)) / 2)
        : Math.max(30, 90 - countPenalty);

    // ── API Compatibility ───────────────────────────────────────
    // If Review Agent says compatible=true, start at 90 regardless of mismatch count.
    const mismatches = reviewResult?.apiCompatibility?.mismatches || [];
    const compatible = reviewResult?.apiCompatibility?.compatible !== false;
    if (compatible) {
        metrics.compatibility = Math.max(75, 95 - mismatches.length * 5);
    } else {
        metrics.compatibility = Math.max(30, 60 - mismatches.length * 10);
    }
    if (aiMetrics?.compatibility) {
        metrics.compatibility = Math.round((aiMetrics.compatibility + metrics.compatibility) / 2);
    }

    // ── Test Coverage ───────────────────────────────────────────
    if (testResult?.coverage) {
        const ep = testResult.coverage.endpointCoverage || 0;
        const feat = testResult.coverage.featureCoverage || 0;
        const sec = testResult.coverage.securityCoverage || 0;
        metrics.testCoverage = Math.round((ep + feat + sec) / 3);
    }

    // ── Code Quality ────────────────────────────────────────────
    if (criticalIssues.length === 0 && missing.length === 0) metrics.codeQuality = 92;
    else if (criticalIssues.length === 0) metrics.codeQuality = 82;
    else metrics.codeQuality = Math.max(50, 80 - criticalIssues.length * 8);
    if (aiMetrics?.codeQuality) {
        metrics.codeQuality = Math.round((aiMetrics.codeQuality + metrics.codeQuality) / 2);
    }

    // ── Overall: blend formula with AI's overall score ──────────
    // If test coverage is 0 (e.g., frontend-only with no API tests),
    // redistribute its weight to other metrics instead of penalizing.
    const testCov = metrics.testCoverage ?? 0;
    const hasTests = testCov > 0;
    const formulaScore = hasTests
        ? Math.round(
            metrics.completeness! * 0.25 +
            metrics.security! * 0.20 +
            metrics.compatibility! * 0.25 +
            metrics.codeQuality! * 0.15 +
            testCov * 0.15
        )
        : Math.round(
            metrics.completeness! * 0.30 +
            metrics.security! * 0.25 +
            metrics.compatibility! * 0.25 +
            metrics.codeQuality! * 0.20
        );

    const overall = (aiOverall && aiOverall > 0)
        ? Math.round((formulaScore + aiOverall) / 2)
        : formulaScore;

    // ── Grade ───────────────────────────────────────────────────
    let grade: string;
    if (overall >= 90) grade = 'A';
    else if (overall >= 80) grade = 'B';
    else if (overall >= 70) grade = 'C';
    else if (overall >= 60) grade = 'D';
    else grade = 'F';

    /* Only trigger feedback for genuinely broken output, not minor issues.
     * Needs: grade D or below AND either API incompatible or major failures. */
    const needsFeedback = overall < 60 && (
        !compatible ||
        (!frontendDone && !backendDone) ||
        criticalIssues.length >= 3
    );

    return { grade, metrics, overall, needsFeedback };
}
