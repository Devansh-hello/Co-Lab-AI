/**
 * Turso Database Routes
 *
 * Manages per-project Turso (LibSQL) database provisioning.
 * Enforces a per-user storage quota (default 250 MB).
 *
 * Routes:
 *   GET    /api/v1/turso/status                - Check if Turso is configured
 *   GET    /api/v1/turso/usage                 - Get user's storage usage
 *   POST   /api/v1/turso/provision             - Provision a database for a project
 *   DELETE /api/v1/turso/database/:projectId   - Delete a project's database
 */

import { Router } from "express";

import { TursoDatabase, Project } from "../models/index.js";
import { authCheck, type AuthRequest } from "../middleware/index.js";
import { provisionDatabase, deleteDatabase, getDatabaseUsage, isTursoConfigured } from "../turso.js";
import { USER_STORAGE_LIMIT_MB } from "../config/env.js";
import { logger } from "../lib/logger.js";

const log = logger.child({ module: "routes.turso" });

export const tursoRouter = Router();

// ─── Status Check ───────────────────────────────────────────────

tursoRouter.get("/api/v1/turso/status", authCheck, async (_req: AuthRequest, res) => {
    res.json({ available: isTursoConfigured(), storageLimitMB: USER_STORAGE_LIMIT_MB });
});

// ─── Storage Usage ──────────────────────────────────────────────

tursoRouter.get("/api/v1/turso/usage", authCheck, async (req: AuthRequest, res) => {
    try {
        const databases = await TursoDatabase.find({ userId: req.userId }).lean();

        /* Refresh storage for databases not checked in the last 5 minutes */
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        for (const db of databases) {
            if (!db.lastUsageCheck || new Date(db.lastUsageCheck) < fiveMinAgo) {
                const usage = await getDatabaseUsage(db.dbName);
                await TursoDatabase.updateOne(
                    { _id: db._id },
                    { storageMB: usage, lastUsageCheck: new Date() }
                );
                (db as any).storageMB = usage;
            }
        }

        const usedMB = databases.reduce((sum, db) => sum + ((db as any).storageMB || 0), 0);

        res.json({
            usedMB: Math.round(usedMB * 100) / 100,
            limitMB: USER_STORAGE_LIMIT_MB,
            percentage: Math.round((usedMB / USER_STORAGE_LIMIT_MB) * 100),
            databases: databases.map(db => ({
                projectId: db.projectId,
                dbName: db.dbName,
                storageMB: (db as any).storageMB || 0,
                hostname: db.hostname,
            })),
        });
    } catch {
        res.status(500).json({ message: "Failed to fetch storage usage" });
    }
});

// ─── Provision Database ─────────────────────────────────────────

tursoRouter.post("/api/v1/turso/provision", authCheck, async (req: AuthRequest, res) => {
    try {
        const { projectId } = req.body;
        if (!projectId) {
            res.status(400).json({ message: "projectId is required" });
            return;
        }

        if (!isTursoConfigured()) {
            res.status(503).json({ message: "Database hosting is not configured" });
            return;
        }

        /* Verify the authenticated user owns this project */
        const project = await Project.findOne({ _id: projectId, userId: req.userId });
        if (!project) {
            res.status(403).json({ message: "Not authorized for this project" });
            return;
        }

        /* Check if already provisioned */
        const existing = await TursoDatabase.findOne({ projectId, userId: req.userId });
        if (existing) {
            res.json({
                message: "Database already exists",
                database: { hostname: existing.hostname, dbName: existing.dbName },
            });
            return;
        }

        /* Enforce storage quota */
        const totalUsed = await TursoDatabase.aggregate([
            { $match: { userId: req.userId } },
            { $group: { _id: null, total: { $sum: "$storageMB" } } },
        ]);
        const currentUsage = totalUsed[0]?.total || 0;
        if (currentUsage >= USER_STORAGE_LIMIT_MB) {
            res.status(429).json({ message: "Storage limit reached (250 MB)" });
            return;
        }

        const result = await provisionDatabase(projectId);
        if (!result) {
            res.status(500).json({ message: "Failed to provision database" });
            return;
        }

        await TursoDatabase.create({
            userId: req.userId,
            projectId,
            dbName: result.dbName,
            hostname: result.hostname,
            authToken: result.authToken,
            storageMB: 0,
        });

        res.status(201).json({
            message: "Database provisioned",
            database: { hostname: result.hostname, dbName: result.dbName },
        });
    } catch (err) {
        log.error({ err, userId: req.userId }, "provision database failed");
        res.status(500).json({ message: "Failed to provision database" });
    }
});

// ─── Delete Database ────────────────────────────────────────────

tursoRouter.delete("/api/v1/turso/database/:projectId", authCheck, async (req: AuthRequest, res) => {
    try {
        const db = await TursoDatabase.findOne({ projectId: req.params.projectId, userId: req.userId });
        if (!db) {
            res.status(404).json({ message: "No database found for this project" });
            return;
        }

        await deleteDatabase(db.dbName);
        await TursoDatabase.deleteOne({ _id: db._id });

        res.json({ message: "Database deleted" });
    } catch {
        res.status(500).json({ message: "Failed to delete database" });
    }
});
