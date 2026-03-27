/**
 * Authentication Middleware
 *
 * Extracts and verifies JWT tokens from HTTP-only cookies.
 * Attaches the authenticated user's ID to the request object.
 */

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

/** Extended Request type with authenticated userId */
export interface AuthRequest extends Request {
    userId?: string;
}

/**
 * Middleware that checks for a valid JWT in the `token` cookie.
 * - 401 if token is missing
 * - 403 if token is invalid or expired
 * - Attaches decoded user ID to req.userId on success
 */
export function authCheck(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.cookies.token;

    if (!token) {
        res.status(401).json({
            loggedin: false,
            message: "Unauthorized - Token missing"
        });
        return;
    }

    try {
        const data = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
        req.userId = data.id;
        next();
    } catch {
        res.status(403).json({
            loggedin: false,
            message: "Forbidden - Invalid or expired token"
        });
        return;
    }
}
