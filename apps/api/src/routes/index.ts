/**
 * Routes Barrel Export
 *
 * Mounts all route modules onto a single router.
 * Import this in index.ts and use with app.use():
 *   import { apiRouter } from "./routes/index.js";
 *   app.use(apiRouter);
 */

import { Router } from "express";
import rateLimit from "express-rate-limit";

import { authRouter } from "./auth.routes.js";
import { projectRouter } from "./project.routes.js";
import { messageRouter } from "./message.routes.js";
import { settingsRouter } from "./settings.routes.js";
import { pluginRouter } from "./plugin.routes.js";
import { tursoRouter } from "./turso.routes.js";
// SSE fallback is not yet implemented — stubs exist but are not registered
// import { pipelineCommandRouter } from "./pipeline-command.routes.js";
// import { sseRouter } from "../websocket/sse-fallback.js";
import { permissionRouter } from "./permission.routes.js";
import { mcpRouter } from "./mcp.routes.js";
import { qualityTrendRouter } from "./quality-trend.routes.js";
import { featureRouter } from "./feature.routes.js";
import { checkpointRouter } from "./checkpoint.routes.js";

/* Strict limiter for auth endpoints (brute-force protection) */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,                   // 15 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later" },
});

/* General API limiter */
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1 minute
    max: 100,                  // 100 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please slow down" },
});

export const apiRouter = Router();

apiRouter.use("/api/v1/signup", authLimiter);
apiRouter.use("/api/v1/signin", authLimiter);
apiRouter.use("/api/v1/auth/google", authLimiter);
apiRouter.use(apiLimiter);

apiRouter.use(authRouter);
apiRouter.use(projectRouter);
apiRouter.use(messageRouter);
apiRouter.use(settingsRouter);
apiRouter.use(pluginRouter);
apiRouter.use(tursoRouter);
// apiRouter.use(pipelineCommandRouter);  // SSE stub — not yet implemented
// apiRouter.use(sseRouter);              // SSE stub — not yet implemented
apiRouter.use(permissionRouter);
apiRouter.use(mcpRouter);
apiRouter.use(qualityTrendRouter);
apiRouter.use(featureRouter);
apiRouter.use(checkpointRouter);
