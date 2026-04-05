/**
 * Quality Trend Model
 *
 * Stores quality metrics per pipeline run for trend tracking and
 * regression detection. Each record captures the grade, individual
 * metrics, token usage, and timing for one pipeline execution.
 */

import mongoose from "mongoose";

const qualityTrendSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "project", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "message" },
    /** Quality grade (A-F) */
    grade: { type: String, required: true },
    /** Overall score (0-100) */
    overall: { type: Number, required: true },
    /** Individual metric scores */
    metrics: {
        completeness: { type: Number, default: 0 },
        security: { type: Number, default: 0 },
        compatibility: { type: Number, default: 0 },
        codeQuality: { type: Number, default: 0 },
        testCoverage: { type: Number, default: 0 },
    },
    /** Token usage across all agents */
    tokenUsage: {
        total: { type: Number, default: 0 },
        orchestrator: { type: Number, default: 0 },
        frontend: { type: Number, default: 0 },
        backend: { type: Number, default: 0 },
        review: { type: Number, default: 0 },
        test: { type: Number, default: 0 },
    },
    /** Pipeline timing */
    durationMs: { type: Number, default: 0 },
    /** Number of feedback iterations applied */
    feedbackIterations: { type: Number, default: 0 },
    /** Model used for code generation (for regression tracking across model changes) */
    modelUsed: { type: String },
    /** Project complexity score */
    complexity: { type: Number },
    /** Whether feedback loop was triggered */
    feedbackTriggered: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

/** Fast time-series query for a project */
qualityTrendSchema.index({ projectId: 1, createdAt: -1 });

/** User-wide trend query */
qualityTrendSchema.index({ userId: 1, createdAt: -1 });

export const QualityTrend = mongoose.model("qualityTrend", qualityTrendSchema);
