/**
 * Logger — Pino-based structured logging.
 *
 * Usage:
 *   import { logger } from "../lib/logger.js";
 *   const log = logger.child({ module: "auth" });
 *   log.info({ userId }, "signed in");
 *   log.error({ err }, "failed to verify token");
 *
 * Env vars:
 *   LOG_LEVEL   - trace | debug | info | warn | error | fatal | silent (default: info in prod, debug in dev)
 *   LOG_PRETTY  - "1" to force pino-pretty; defaults to on in dev, off in prod
 *
 * Performance: pino writes JSON to stdout via a low-overhead path. Redaction
 * uses static paths (fast). Child loggers reuse the parent stream — no extra
 * allocation per request beyond the bindings object.
 */

import pino, { type LoggerOptions } from "pino";
import { IS_PRODUCTION } from "../config/env.js";

const defaultLevel = IS_PRODUCTION ? "info" : "debug";
const level = process.env.LOG_LEVEL || defaultLevel;
const pretty = process.env.LOG_PRETTY === "1" || (!IS_PRODUCTION && process.env.LOG_PRETTY !== "0");

const baseOptions: LoggerOptions = {
    level,
    base: { service: "colab-api", env: IS_PRODUCTION ? "prod" : "dev" },
    timestamp: pino.stdTimeFunctions.isoTime,

    /* Redact sensitive fields wherever they appear in log objects.
     * Paths are evaluated once at startup — constant overhead. */
    redact: {
        paths: [
            "password",
            "*.password",
            "req.body.password",
            "req.body.credential",
            "req.body.apiKey",
            "req.body.apiKeys",
            "req.body.apiKeys.*",
            "req.body.env",
            "req.body.env.*",
            "req.body.headers",
            "req.body.headers.*",
            "req.headers.cookie",
            "req.headers.authorization",
            "req.headers[\"x-api-key\"]",
            "res.headers[\"set-cookie\"]",
            'headers["cookie"]',
            'headers["authorization"]',
            "token",
            "jwt",
            "credential",
            "apiKey",
            "apiKeys",
            "apiKeys.*",
            "settings.apiKeys",
            "settings.apiKeys.*",
        ],
        censor: "[REDACTED]",
    },

    serializers: {
        err: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
    },
};

const options: LoggerOptions = pretty
    ? {
        ...baseOptions,
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "HH:MM:ss.l",
                ignore: "pid,hostname,service,env",
                singleLine: false,
            },
        },
    }
    : baseOptions;

/** Root logger. Prefer `logger.child({ module: "x" })` in each module. */
export const logger = pino(options);

/** Ensure buffered logs are flushed before the process exits. */
function flushAndExit(code: number) {
    try {
        logger.flush();
    } catch { /* noop */ }
    setTimeout(() => process.exit(code), 50).unref();
}

process.on("beforeExit", () => {
    try { logger.flush(); } catch { /* noop */ }
});

export { flushAndExit };
