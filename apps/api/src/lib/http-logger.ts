/**
 * HTTP request logger — pino-http middleware.
 *
 * Adds `req.log` to every request, scoped with reqId + userId (when available).
 * One log line per request (completion), level derived from status code.
 * Skips health/static routes to keep volume low.
 */

import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "http";
import type { Options, HttpLogger } from "pino-http";
import { logger } from "./logger.js";

/* pino-http v11 ships CJS with an ESM-style `export default` in its d.ts.
 * Under `verbatimModuleSyntax: true` this default import mis-resolves to
 * the namespace. createRequire + a direct callable cast sidesteps the
 * interop dance cleanly. */
const require = createRequire(import.meta.url);
type PinoHttpFactory = (opts?: Options) => HttpLogger;
const pinoHttp = require("pino-http") as PinoHttpFactory;

type ReqWithUser = IncomingMessage & { userId?: string };

export const httpLogger = pinoHttp({
    logger,

    /* Correlate logs across services: honour inbound X-Request-Id,
     * otherwise mint a UUID and echo it back in the response. */
    genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const incoming = req.headers["x-request-id"];
        const id = (typeof incoming === "string" && incoming) || randomUUID();
        res.setHeader("X-Request-Id", id);
        return id;
    },

    /* Severity by status. 4xx = warn, 5xx/errors = error, 3xx silent (don't spam redirects). */
    customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        if (res.statusCode >= 300) return "silent";
        return "info";
    },

    customSuccessMessage: (req: IncomingMessage, res: ServerResponse) =>
        `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req: IncomingMessage, res: ServerResponse, err: Error) =>
        `${req.method} ${req.url} ${res.statusCode} ${err.message}`,

    customProps: (req: IncomingMessage) => {
        const userId = (req as ReqWithUser).userId;
        return userId ? { userId } : {};
    },

    autoLogging: {
        ignore: (req: IncomingMessage) => {
            const url = req.url || "";
            return url === "/health" || url === "/ready" || url === "/favicon.ico";
        },
    },

    serializers: {
        req: (req: IncomingMessage & { id?: string; remoteAddress?: string }) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            remoteAddress: req.remoteAddress,
        }),
        res: (res: ServerResponse) => ({
            statusCode: res.statusCode,
        }),
    },
});
