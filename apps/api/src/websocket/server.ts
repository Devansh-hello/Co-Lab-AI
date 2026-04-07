/**
 * WebSocket Server
 *
 * Handles real-time communication for the agent pipeline. Each WebSocket
 * connection maps to one user session. The pipeline flows through these phases:
 *
 *   1. understanding  - Analyze the user's request
 *   2. qa             - (Optional) Clarifying questions
 *   3. planning       - Orchestrator generates task file
 *   4. building       - Frontend + Backend agents generate code in parallel
 *   5. testing        - Review + Test agents evaluate quality
 *   6. feedback       - (Conditional) Fix agent patches issues
 *   7. done           - Snapshot saved, message completed
 *
 * Message types received from client:
 *   - message                - Start a new pipeline
 *   - understanding_response - User confirms/cancels after understanding
 *   - qa_complete            - User answers clarifying questions
 *   - proceed                - User confirms/cancels after seeing the plan
 *   - resume                 - Reconnect and replay missed events
 *   - permission_response    - User responds to a permission prompt
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server, IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import crypto from "crypto";

import { JWT_SECRET } from "../config/env.js";
import type { ConnectionContext } from "./types.js";
import { CircularEventBuffer } from "./event-buffer.js";
import { emitEvent } from "./event-emitter.js";

import { handleNewMessage } from "./handlers/message.handler.js";
import { handleUnderstandingResponse } from "./handlers/understanding.handler.js";
import { handleQAComplete } from "./handlers/qa.handler.js";
import { handleProceed } from "./handlers/proceed.handler.js";
import { handleResume } from "./handlers/resume.handler.js";
import { handlePermissionResponse } from "./handlers/permission.handler.js";

// ─── WebSocket Setup ────────────────────────────────────────────

/**
 * Attach a WebSocket server to an existing HTTP server.
 * Authenticates connections via JWT cookie and manages pipeline state.
 */
export function setupWebSocket(server: Server) {
    const wss = new WebSocketServer({ server, path: "/ws" });

    // ── Heartbeat: detect dead connections ──────────────────
    // Allow 2 missed pongs before terminating to tolerate network blips
    const HEARTBEAT_INTERVAL = 30_000;
    const heartbeat = setInterval(() => {
        for (const client of wss.clients) {
            const ws = client as WebSocket & { missedPongs?: number };
            if (ws.missedPongs === undefined) ws.missedPongs = 0;

            ws.missedPongs++;
            if (ws.missedPongs > 2) {
                ws.terminate();
                continue;
            }
            ws.ping();
        }
    }, HEARTBEAT_INTERVAL);

    wss.on("close", () => clearInterval(heartbeat));

    wss.on("connection", function connection(ws: WebSocket & { isAlive?: boolean }, req: IncomingMessage) {
        (ws as any).missedPongs = 0;
        ws.on("pong", () => { (ws as any).missedPongs = 0; });

        /* Authenticate via cookie */
        const rawCookies = req.headers.cookie || "";
        const cookies = cookie.parse(rawCookies);
        const token = cookies.token;

        if (!token) {
            ws.send(JSON.stringify({ type: "error", message: "Unauthorized - token missing" }));
            ws.close(4401, "Unauthorized");
            return;
        }

        let wsUserId: string;
        try {
            const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
            wsUserId = payload.id as string;
        } catch {
            ws.send(JSON.stringify({ type: "error", message: "Forbidden - invalid or expired token" }));
            ws.close(4403, "Forbidden");
            return;
        }

        /* Initialize connection context */
        const sessionId = crypto.randomUUID();
        const ctx: ConnectionContext = {
            ws,
            userId: wsUserId,
            sessionId,
            pipeline: null,
            pipelineAbort: null,
            pipelineRunId: null,
            lastSeq: 0,
            eventBuffer: new CircularEventBuffer(100),
            messageTimestamps: [],
            pendingPermissions: new Map(),
        };

        /* Send session info to client */
        emitEvent(ctx, { type: 'session', sessionId, seq: 0 });

        /* Rate limiting: max 5 new pipeline messages per minute */
        const WS_RATE_LIMIT = 5;
        const WS_RATE_WINDOW_MS = 60_000;

        /* Save pipeline state on disconnect (for resumability) */
        ws.on("close", async () => {
            // Save pipeline state before aborting
            if (ctx.pipeline && ctx.pipelineRunId) {
                try {
                    const { PipelineRun } = await import("../models/index.js");
                    await PipelineRun.findOneAndUpdate(
                        { _id: ctx.pipelineRunId },
                        {
                            phase: ctx.pipeline.phase,
                            state: {
                                projectId: ctx.pipeline.projectId,
                                userId: ctx.pipeline.userId,
                                provider: ctx.pipeline.provider,
                                model: ctx.pipeline.model,
                                taskFile: ctx.pipeline.taskFile,
                                snapshot: ctx.pipeline.snapshot,
                                understanding: ctx.pipeline.understanding,
                                qaAnswers: ctx.pipeline.qaAnswers,
                                phase: ctx.pipeline.phase,
                                feedbackIteration: ctx.pipeline.feedbackIteration,
                                frontendResult: ctx.pipeline.frontendResult,
                                backendResult: ctx.pipeline.backendResult,
                            },
                            lastSeq: ctx.lastSeq,
                            updatedAt: new Date(),
                        },
                        { upsert: true }
                    );
                } catch (err) {
                    console.error("[ws] Failed to save pipeline state on disconnect:", err);
                }
            }

            if (ctx.pipelineAbort) {
                ctx.pipelineAbort.abort();
                ctx.pipelineAbort = null;
            }
            ctx.pipeline = null;

            // Reject any pending permission requests
            for (const [, pending] of ctx.pendingPermissions) {
                pending.resolve('deny');
            }
            ctx.pendingPermissions.clear();
        });

        ws.on("message", async function message(data) {
            try {
                const parsed = JSON.parse(data.toString());
                const msgType = parsed.type || 'message';

                /* Throttle new pipeline messages (not control messages) */
                if (msgType === 'message') {
                    const now = Date.now();
                    while (ctx.messageTimestamps.length > 0 && now - ctx.messageTimestamps[0]! > WS_RATE_WINDOW_MS) {
                        ctx.messageTimestamps.shift();
                    }
                    if (ctx.messageTimestamps.length >= WS_RATE_LIMIT) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded. Please wait before sending another message.' }));
                        return;
                    }
                    ctx.messageTimestamps.push(now);
                }

                switch (msgType) {
                    case 'message':
                        if (ctx.pipelineAbort) ctx.pipelineAbort.abort();
                        ctx.pipelineAbort = new AbortController();
                        await handleNewMessage(parsed, ctx);
                        break;

                    case 'understanding_response':
                        await handleUnderstandingResponse(parsed, ctx);
                        break;

                    case 'qa_complete':
                        await handleQAComplete(parsed, ctx);
                        break;

                    case 'proceed':
                        await handleProceed(parsed, ctx);
                        break;

                    case 'resume':
                        await handleResume(parsed, ctx);
                        break;

                    case 'permission_response':
                        await handlePermissionResponse(parsed, ctx);
                        break;
                }
            } catch (error: any) {
                console.error("[ws] Error:", error);

                if (ctx.pipeline?.messageDoc) {
                    ctx.pipeline.messageDoc.status = 'error';
                    await ctx.pipeline.messageDoc.save();
                }

                emitEvent(ctx, { type: 'error', message: error.message });
            }
        });
    });
}
