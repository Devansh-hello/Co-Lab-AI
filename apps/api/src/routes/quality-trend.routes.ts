/**
 * Quality Trend Routes
 *
 * API endpoints for querying quality metrics over time.
 * Used by the Benchmarks page to display trend charts and regression alerts.
 *
 * Routes:
 *   GET /api/v1/quality/project/:projectId  - Project trend
 *   GET /api/v1/quality/user                - User-wide trend
 *   GET /api/v1/quality/stats/:projectId    - Project aggregate stats
 */

import { Router } from "express";
import { authCheck, type AuthRequest } from "../middleware/index.js";
import { getProjectTrend, getUserTrend, getProjectStats } from "../services/quality-trends.js";
import { Project } from "../models/index.js";

export const qualityTrendRouter = Router();

/** Verify the authenticated user owns the project */
async function verifyOwnership(userId: string, projectId: string): Promise<boolean> {
    const project = await Project.findOne({ _id: projectId, userId }).lean();
    return !!project;
}

qualityTrendRouter.get("/api/v1/quality/project/:projectId", authCheck, async (req: AuthRequest, res) => {
    try {
        if (!(await verifyOwnership(req.userId!, req.params.projectId as string))) {
            res.status(403).json({ message: "Not authorized for this project" });
            return;
        }
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const trend = await getProjectTrend(req.params.projectId as string, limit);
        res.json({ trend });
    } catch {
        res.status(500).json({ message: "Failed to fetch quality trend" });
    }
});

qualityTrendRouter.get("/api/v1/quality/user", authCheck, async (req: AuthRequest, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
        const trend = await getUserTrend(req.userId!, limit);
        res.json({ trend });
    } catch {
        res.status(500).json({ message: "Failed to fetch quality trend" });
    }
});

qualityTrendRouter.get("/api/v1/quality/stats/:projectId", authCheck, async (req: AuthRequest, res) => {
    try {
        if (!(await verifyOwnership(req.userId!, req.params.projectId as string))) {
            res.status(403).json({ message: "Not authorized for this project" });
            return;
        }
        const stats = await getProjectStats(req.params.projectId as string);
        res.json(stats);
    } catch {
        res.status(500).json({ message: "Failed to fetch quality stats" });
    }
});
