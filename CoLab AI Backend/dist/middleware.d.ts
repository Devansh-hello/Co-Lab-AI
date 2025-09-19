import { type Request, type Response, type NextFunction } from "express";
export interface AuthRequest extends Request {
    userId?: string;
}
export declare function zodMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function authCheck(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=middleware.d.ts.map