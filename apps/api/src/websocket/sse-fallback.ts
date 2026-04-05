/**
 * SSE Fallback Transport
 *
 * Provides a Server-Sent Events endpoint for environments where
 * WebSocket connections fail (corporate proxies, some cloud hosts).
 * The client receives events via SSE and sends commands via REST POST.
 *
 * Route: GET /api/v1/sse/:sessionId
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { EventEmitter } from "events";
import { authCheck, type AuthRequest } from "../middleware/index.js";

/** Shared event bus keyed by sessionId for cross-transport event forwarding */
export const sseEventBus = new EventEmitter();
sseEventBus.setMaxListeners(100);

export const sseRouter = Router();

sseRouter.get("/api/v1/sse/:sessionId", authCheck, (req: AuthRequest, res: Response) => {
    const { sessionId } = req.params;
    const userId = req.userId;

    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Send initial connection confirmation
    res.write(`event: connected\ndata: ${JSON.stringify({ sessionId })}\n\n`);

    // Keepalive: send comment every 15s to prevent proxy timeout
    const keepalive = setInterval(() => {
        res.write(': keepalive\n\n');
    }, 15_000);

    // Listen for events on this session
    const onEvent = (event: any) => {
        const id = event.seq?.toString() || Date.now().toString();
        res.write(`id: ${id}\nevent: pipeline\ndata: ${JSON.stringify(event)}\n\n`);
    };

    sseEventBus.on(`session:${sessionId}`, onEvent);

    // Cleanup on disconnect
    req.on('close', () => {
        clearInterval(keepalive);
        sseEventBus.off(`session:${sessionId}`, onEvent);
    });
});
