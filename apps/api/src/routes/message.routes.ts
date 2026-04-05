/**
 * Message Routes
 *
 * Endpoints for creating messages and fetching conversation history
 * for a project. Messages are the primary way users interact with
 * the agent pipeline.
 *
 * Routes:
 *   POST /api/v1/message                      - Record a new message
 *   GET  /api/v1/projects/:projectId/messages  - Get message history for a project
 */

import { Router } from "express";
import z from "zod";

import { Message, Project } from "../models/index.js";
import { authCheck, validate, type AuthRequest } from "../middleware/index.js";

export const messageRouter = Router();

const createMessageSchema = z.object({
    message: z.string().trim().min(1, "Message is required").max(50000),
    projectId: z.string().min(1, "projectId is required"),
});

// ─── Create Message ─────────────────────────────────────────────

messageRouter.post("/api/v1/message", authCheck, validate(createMessageSchema), async (req: AuthRequest, res) => {
    const { message, projectId } = req.body;

    try {
        /* Verify the authenticated user owns this project */
        const project = await Project.findOne({ _id: projectId, userId: req.userId });
        if (!project) {
            res.status(403).json({ message: "Not authorized for this project" });
            return;
        }

        const newMsg = await Message.create({
            projectId,
            userMessage: message,
            status: "processing",
        });

        res.status(200).json({ message: "Message recorded", data: newMsg });
    } catch (error) {
        res.status(400).json({
            message: "Unable to save message",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

// ─── Get Project Messages ───────────────────────────────────────

messageRouter.get("/api/v1/projects/:projectId/messages", authCheck, async (req: AuthRequest, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.userId;

        /* Verify the authenticated user owns this project */
        const project = await Project.findOne({ _id: projectId, userId });
        if (!project) {
            res.status(404).json({ error: "Project not found" });
            return;
        }

        const messages = await Message.find({ projectId })
            .sort({ timestamp: 1 })
            .lean();

        res.json({ messages: messages || [] });
    } catch (error) {
        console.error("[messages] Error fetching:", error);
        res.status(500).json({
            error: "Failed to fetch messages",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
