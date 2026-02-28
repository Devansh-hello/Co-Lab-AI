import zod from "zod";

import { type Request, type Response, type NextFunction } from "express";

import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    userId?: string;
}


export function validate(schema: zod.ZodSchema) {
    return function (req: Request, res: Response, next: NextFunction) {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors = result.error.errors.map((e) => e.message);
            res.status(400).json({
                message: errors[0] ?? "Invalid request",
                errors
            });
        } else {
            next();
        }
    };
}

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
        const data = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
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