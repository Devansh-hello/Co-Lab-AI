/**
 * Co-Lab AI Backend — Application Entry Point
 *
 * Bootstraps the Express server with:
 *   - Environment validation (config/env.ts)
 *   - CORS + cookie + JSON middleware
 *   - REST API routes (routes/index.ts)
 *   - WebSocket server for the agent pipeline (websocket/server.ts)
 *   - MongoDB connection
 */

import "./config/env.js"; // Validates env vars on import (fails fast)

// TODO: Implement advanced analytics and telemetry
import express from "express";
import cookieParser from "cookie-parser";
import * as http from "http";

import { PORT } from "./config/env.js";
import { corsMiddleware } from "./config/cors.js";
import { apiRouter } from "./routes/index.js";
import { setupWebSocket } from "./websocket/server.js";
import { mongo } from "./models/index.js";

// ─── Express App ────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(corsMiddleware);

// Mount all API routes
app.use(apiRouter);

// ─── Global Error Handler ──────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[server] Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
});

// ─── HTTP + WebSocket Server ────────────────────────────────────

const server = http.createServer(app);
setupWebSocket(server);

// ─── Process Error Handlers ────────────────────────────────────

process.on("unhandledRejection", (reason) => {
    console.error("[server] Unhandled rejection:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("[server] Uncaught exception:", err);
    process.exit(1);
});

// ─── Start ──────────────────────────────────────────────────────

async function startServer() {
    await mongo();
    server.listen(PORT, () => {
        console.log(`[server] Listening on port ${PORT}`);
    });
}

startServer();
