/**
 * Environment Configuration
 *
 * Validates required environment variables at startup and exports
 * shared constants. Fails fast if critical vars are missing.
 */

import dotenv from "dotenv";
dotenv.config();

/** Whether the app is running in production mode */
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Required env vars - app will not start without these */
const REQUIRED_ENV = ["DATABASE_URL", "JWT_SECRET"] as const;

const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
    console.error(`[startup] Missing required environment variables: ${missingEnv.join(", ")}`);
    process.exit(1);
}

/* Encryption key is required in production — API keys must never be stored in plaintext */
if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 64) {
    if (IS_PRODUCTION) {
        console.error("[startup] FATAL: ENCRYPTION_KEY not set or invalid (must be 64-char hex). Refusing to start in production.");
        process.exit(1);
    } else {
        console.warn("[startup] WARNING: ENCRYPTION_KEY not set or invalid. API keys will be stored unencrypted.");
    }
}

/** Server port, defaults to 5000 */
export const PORT = Number(process.env.PORT) || 5000;

/** JWT secret for signing auth tokens */
export const JWT_SECRET = process.env.JWT_SECRET as string;

/** Google OAuth client ID (optional - Google auth disabled if not set) */
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;

/** Per-user Turso storage limit in megabytes */
export const USER_STORAGE_LIMIT_MB = 250;
