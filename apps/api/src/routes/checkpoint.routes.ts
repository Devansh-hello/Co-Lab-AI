/**
 * Checkpoint Routes
 *
 * REST endpoints for listing and retrieving pipeline checkpoints.
 * Resume/rewind operations are handled via WebSocket messages.
 */

import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { listCheckpoints, getCheckpoint } from "../services/checkpoint.js";

export const checkpointRouter = Router();

/** List checkpoints for a project */
checkpointRouter.get("/api/v1/checkpoints/:projectId", authMiddleware, async (req, res) => {
    try {
        const { pipelineRunId } = req.query;
        const checkpoints = await listCheckpoints(
            req.params.projectId,
            pipelineRunId as string | undefined,
        );
        res.json({ checkpoints });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

/** Get a specific checkpoint */
checkpointRouter.get("/api/v1/checkpoint/:checkpointId", authMiddleware, async (req, res) => {
    try {
        const checkpoint = await getCheckpoint(req.params.checkpointId);
        if (!checkpoint) return res.status(404).json({ message: "Checkpoint not found" });
        res.json(checkpoint);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});
