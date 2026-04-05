/**
 * Permission Routes
 *
 * CRUD for user and project-level permission rules.
 *
 * Routes:
 *   GET    /api/v1/permissions              - List user-level rules
 *   GET    /api/v1/permissions/:projectId   - List project rules (merged with user)
 *   PUT    /api/v1/permissions              - Update user-level rules
 *   PUT    /api/v1/permissions/:projectId   - Update project-level rules
 *   DELETE /api/v1/permissions/:projectId   - Remove project overrides
 */

import { Router } from "express";
import { authCheck, type AuthRequest } from "../middleware/index.js";
import { PermissionRule } from "../models/index.js";
import { getEffectiveRules, ensureDefaultRules } from "../services/permission.service.js";

export const permissionRouter = Router();

// ─── List User Rules ────────────────────────────────────────────

permissionRouter.get("/api/v1/permissions", authCheck, async (req: AuthRequest, res) => {
    try {
        await ensureDefaultRules(req.userId!);
        const doc = await PermissionRule.findOne({ userId: req.userId, projectId: null }).lean();
        res.json({ rules: (doc as any)?.rules || [] });
    } catch {
        res.status(500).json({ message: "Failed to fetch permissions" });
    }
});

// ─── List Project Rules (merged) ────────────────────────────────

permissionRouter.get("/api/v1/permissions/:projectId", authCheck, async (req: AuthRequest, res) => {
    try {
        const rules = await getEffectiveRules(req.userId!, req.params.projectId as string);
        res.json({ rules });
    } catch {
        res.status(500).json({ message: "Failed to fetch permissions" });
    }
});

// ─── Update User Rules ──────────────────────────────────────────

permissionRouter.put("/api/v1/permissions", authCheck, async (req: AuthRequest, res) => {
    try {
        const { rules } = req.body;
        if (!Array.isArray(rules)) {
            res.status(400).json({ message: "rules must be an array" });
            return;
        }

        const doc = await PermissionRule.findOneAndUpdate(
            { userId: req.userId, projectId: null },
            {
                $set: { rules, updatedAt: new Date() },
                $setOnInsert: { userId: req.userId, projectId: null, scope: 'user' },
            },
            { upsert: true, new: true }
        );

        res.json({ rules: (doc as any).rules });
    } catch {
        res.status(500).json({ message: "Failed to update permissions" });
    }
});

// ─── Update Project Rules ───────────────────────────────────────

permissionRouter.put("/api/v1/permissions/:projectId", authCheck, async (req: AuthRequest, res) => {
    try {
        const { rules } = req.body;
        if (!Array.isArray(rules)) {
            res.status(400).json({ message: "rules must be an array" });
            return;
        }

        const doc = await PermissionRule.findOneAndUpdate(
            { userId: req.userId, projectId: req.params.projectId },
            {
                $set: { rules, updatedAt: new Date() },
                $setOnInsert: {
                    userId: req.userId,
                    projectId: req.params.projectId,
                    scope: 'project',
                },
            },
            { upsert: true, new: true }
        );

        res.json({ rules: (doc as any).rules });
    } catch {
        res.status(500).json({ message: "Failed to update permissions" });
    }
});

// ─── Delete Project Overrides ───────────────────────────────────

permissionRouter.delete("/api/v1/permissions/:projectId", authCheck, async (req: AuthRequest, res) => {
    try {
        await PermissionRule.deleteOne({
            userId: req.userId,
            projectId: req.params.projectId,
        });
        res.json({ message: "Project permission overrides removed" });
    } catch {
        res.status(500).json({ message: "Failed to delete permissions" });
    }
});
