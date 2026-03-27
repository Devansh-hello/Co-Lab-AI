/**
 * Request Validation Middleware
 *
 * Uses Zod schemas to validate request bodies.
 * Returns the first validation error as a 400 response.
 */

import type zod from "zod";
import type { Request, Response, NextFunction } from "express";

/**
 * Creates an Express middleware that validates req.body against the given Zod schema.
 * On failure, responds with 400 and the first error message.
 */
export function validate(schema: zod.ZodSchema) {
    return function (req: Request, res: Response, next: NextFunction) {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors = result.error.errors.map((e) => e.message);
            res.status(400).json({
                message: errors[0] ?? "Invalid request",
                errors
            });
            return;
        }

        next();
    };
}
