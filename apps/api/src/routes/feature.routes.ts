/**
 * Feature Routes
 *
 * CRUD + lifecycle management for project features.
 * Features track individual capabilities through the pipeline lifecycle.
 */

import { Router } from "express";
import { Feature } from "../models/feature.model.js";
import { authCheck } from "../middleware/auth.js";
import { getFeatureSummary } from "../services/feature-tracker.js";

export const featureRouter = Router();

/** List features for a project */
featureRouter.get("/api/v1/features/:projectId", authCheck, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { status } = req.query;
        const query: any = { projectId, userId: (req as any).userId };
        if (status) query.status = status;

        const features = await Feature.find(query)
            .sort({ priority: 1, createdAt: -1 })
            .lean();

        res.json({ features });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

/** Get feature summary (counts by status) */
featureRouter.get("/api/v1/features/:projectId/summary", authCheck, async (req, res) => {
    try {
        const summary = await getFeatureSummary(req.params.projectId as string);
        res.json(summary);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

/** Get a single feature */
featureRouter.get("/api/v1/feature/:featureId", authCheck, async (req, res) => {
    try {
        const feature = await Feature.findOne({
            _id: req.params.featureId,
            userId: (req as any).userId,
        }).lean();

        if (!feature) return res.status(404).json({ message: "Feature not found" });
        res.json(feature);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

/** Update feature status (manual lifecycle transition) */
featureRouter.patch("/api/v1/feature/:featureId/status", authCheck, async (req, res) => {
    try {
        const { status, reason } = req.body;
        const feature = await Feature.findOne({
            _id: req.params.featureId,
            userId: (req as any).userId,
        });

        if (!feature) return res.status(404).json({ message: "Feature not found" });

        const from = feature.status;
        feature.status = status;
        feature.statusHistory.push({
            from,
            to: status,
            changedAt: new Date(),
            reason: reason || `Manually set to ${status}`,
        });
        await feature.save();

        res.json(feature);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

/** Update feature details */
featureRouter.put("/api/v1/feature/:featureId", authCheck, async (req, res) => {
    try {
        const { name, description, priority, acceptanceCriteria, spec } = req.body;
        const feature = await Feature.findOneAndUpdate(
            { _id: req.params.featureId, userId: (req as any).userId },
            { $set: { name, description, priority, acceptanceCriteria, spec } },
            { new: true },
        );

        if (!feature) return res.status(404).json({ message: "Feature not found" });
        res.json(feature);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

/** Delete a feature */
featureRouter.delete("/api/v1/feature/:featureId", authCheck, async (req, res) => {
    try {
        const result = await Feature.findOneAndDelete({
            _id: req.params.featureId,
            userId: (req as any).userId,
        });

        if (!result) return res.status(404).json({ message: "Feature not found" });
        res.json({ message: "Feature deleted" });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});
