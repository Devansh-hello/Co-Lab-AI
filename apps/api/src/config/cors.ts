/**
 * CORS Configuration
 *
 * Builds the allowed-origins list from CORS_ORIGINS env var,
 * falling back to localhost defaults for development.
 */

import cors from "cors";

/** Parse comma-separated origins from env, or use dev defaults */
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ];

/**
 * Pre-configured CORS middleware.
 * Allows credentialed requests from whitelisted origins.
 * Requests with no origin (e.g. curl, Postman) are permitted in dev.
 */
export const corsMiddleware = cors({
    origin: (origin, callback) => {
        /* Allow: no origin (curl/Postman), whitelisted origins,
           and "null" origin (Google OAuth redirect POST sends Origin: null) */
        if (!origin || origin === "null" || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin '${origin}' not allowed`));
        }
    },
    credentials: true,
});
