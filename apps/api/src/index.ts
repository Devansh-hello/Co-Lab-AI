/**
 * Co-Lab AI Backend — Application Entry Point
 *
 * Bootstraps the Express server with:
 *   - Environment validation (config/env.ts)
 *   - Structured logging (lib/logger.ts, lib/http-logger.ts)
 *   - CORS + cookie + JSON middleware
 *   - REST API routes (routes/index.ts)
 *   - WebSocket server for the agent pipeline (websocket/server.ts)
 *   - MongoDB connection
 */

import "./config/env.js"; // Validates env vars on import (fails fast)

import express from "express";
import cookieParser from "cookie-parser";
import * as http from "http";

import { PORT } from "./config/env.js";
import { corsMiddleware } from "./config/cors.js";
import { apiRouter } from "./routes/index.js";
import { setupWebSocket } from "./websocket/server.js";
import { mongo } from "./models/index.js";
import { logger, flushAndExit } from "./lib/logger.js";
import { httpLogger } from "./lib/http-logger.js";

const log = logger.child({ module: "server" });

// ─── Express App ────────────────────────────────────────────────

const app = express();
// Required when requests are forwarded (Next dev proxy, nginx, cloud LB).
app.set("trust proxy", 1);

/* HTTP request logger — runs first so every request (incl. body parsing
 * failures) gets a reqId and a completion log line. */
app.use(httpLogger);

app.use(express.json());
app.use(cookieParser());
app.use(corsMiddleware);

// Lightweight liveness probe (skipped by the http logger).
app.get("/health", (_req, res) => { res.status(200).json({ ok: true }); });

// Mount all API routes
app.use(apiRouter);

// ─── Global Error Handler ──────────────────────────────────────

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // req.log is attached by pino-http and already carries reqId + userId
    const reqLog = (req as unknown as { log?: typeof logger }).log ?? log;
    reqLog.error({ err }, "unhandled error in request pipeline");
    res.status(500).json({ message: "Internal server error" });
});

// ─── HTTP + WebSocket Server ────────────────────────────────────

const server = http.createServer(app);
setupWebSocket(server);

// ─── Process Error Handlers ────────────────────────────────────

process.on("unhandledRejection", (reason) => {
    log.error({ err: reason }, "unhandledRejection");
});

process.on("uncaughtException", (err) => {
    log.fatal({ err }, "uncaughtException — shutting down");
    flushAndExit(1);
});

/* Graceful shutdown: flush logs on SIGTERM/SIGINT. */
for (const sig of ["SIGTERM", "SIGINT"] as const) {
    process.on(sig, () => {
        log.info({ signal: sig }, "received shutdown signal");
        server.close(() => flushAndExit(0));
    });
}

// ─── Start ──────────────────────────────────────────────────────

async function startServer() {
    await mongo();
    server.listen(PORT, () => {
        log.info({ port: PORT }, "server listening");
    });
}

startServer();
