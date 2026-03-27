/**
 * Middleware Barrel Export
 *
 * Re-exports all middleware for clean imports:
 *   import { authCheck, validate, AuthRequest } from "./middleware/index.js";
 */

export { validate } from "./validate.js";
export { authCheck, type AuthRequest } from "./auth.js";
