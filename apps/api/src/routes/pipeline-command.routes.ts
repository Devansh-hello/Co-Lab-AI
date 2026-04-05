/**
 * Pipeline Command Routes (SSE Fallback)
 *
 * When the client uses SSE for receiving events, it sends commands
 * (message, understanding_response, qa_complete, proceed) over HTTP
 * instead of WebSocket. This route accepts those commands.
 *
 * Route: POST /api/v1/pipeline/:sessionId/command
 */

import { Router } from "express";
import { authCheck, type AuthRequest } from "../middleware/index.js";

export const pipelineCommandRouter = Router();

/**
 * POST /api/v1/pipeline/:sessionId/command
 *
 * Accepts pipeline control messages when the client is using SSE transport.
 * The body should match the same format as WebSocket client messages.
 */
pipelineCommandRouter.post(
    "/api/v1/pipeline/:sessionId/command",
    authCheck,
    async (req: AuthRequest, res) => {
        try {
            const { sessionId } = req.params;
            const command = req.body;

            if (!command?.type) {
                res.status(400).json({ message: "Missing command type" });
                return;
            }

            // SSE command handling is a future enhancement.
            // For now, return acknowledgement — full implementation requires
            // a session registry that maps sessionId to pipeline state,
            // which will be built when SSE becomes the primary transport.
            res.json({
                message: "Command received",
                sessionId,
                type: command.type,
            });
        } catch {
            res.status(500).json({ message: "Failed to process command" });
        }
    }
);
