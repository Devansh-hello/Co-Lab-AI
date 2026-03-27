/**
 * Project Routes
 *
 * CRUD operations for user projects. Deletion cascades to related
 * messages, snapshots, and Turso databases.
 *
 * Routes:
 *   POST   /api/v1/project     - Create a new project
 *   GET    /api/v1/project     - List all projects for the authenticated user
 *   DELETE /api/v1/project/:id - Delete a project and all related data
 */

import { Router } from "express";

import { Project, Message, ProjectSnapshot, TursoDatabase } from "../models/index.js";
import { authCheck, type AuthRequest } from "../middleware/index.js";
import { deleteDatabase } from "../turso.js";

export const projectRouter = Router();

// ─── Create Project ─────────────────────────────────────────────

projectRouter.post("/api/v1/project", authCheck, async (req: AuthRequest, res) => {
    const { name, description } = req.body;

    try {
        const project = await Project.create({
            name,
            description,
            userId: req.userId,
        });
        res.status(200).json({
            message: "Project created successfully",
            projectId: project._id,
        });
    } catch {
        res.status(400).json({ message: "unable to create project" });
    }
});

// ─── List User's Projects ───────────────────────────────────────

projectRouter.get("/api/v1/project", authCheck, async (req: AuthRequest, res) => {
    const projects = await Project.find({ userId: req.userId });
    res.json(projects);
});

// ─── Delete Project (cascading) ─────────────────────────────────

projectRouter.delete("/api/v1/project/:id", authCheck, async (req: AuthRequest, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.userId;

        const project = await Project.findOne({ _id: projectId, userId });
        if (!project) {
            res.status(404).json({ message: "Project not found" });
            return;
        }

        /* Clean up provisioned Turso database if one exists */
        const tursoDb = await TursoDatabase.findOne({ projectId });
        if (tursoDb) {
            await deleteDatabase(tursoDb.dbName).catch(() => {});
            await TursoDatabase.deleteOne({ _id: tursoDb._id });
        }

        /* Delete all related data in parallel */
        await Promise.all([
            Message.deleteMany({ projectId }),
            ProjectSnapshot.deleteMany({ projectId }),
            Project.findByIdAndDelete(projectId),
        ]);

        res.status(200).json({ message: "Project deleted successfully" });
    } catch {
        res.status(500).json({ message: "Unable to delete project" });
    }
});
