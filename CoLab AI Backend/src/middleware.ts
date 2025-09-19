import zod, { string } from "zod";

import { type Request,type Response,type NextFunction } from "express";

import jwt from "jsonwebtoken";

const JWT_PASSWORD: string = "wioefiowiwhfe897g897e234fw";

export interface AuthRequest extends Request{
    userId?: string;
}


export function zodMiddleware(req: Request, res: Response, next: NextFunction){

    const zodschema = zod.object({
        username: zod.string().trim().optional(),
        email: zod.email(),
        password: zod.string().min(8)
    })

    const result = zodschema.safeParse(req.body);

    if (!result.success){
        res.status(400).json({
            message: "error happened",
            Error: result.error
        })
    }else{
        next()
    }
    
}

export function authCheck(req: AuthRequest, res:Response, next:NextFunction){
    const token = req.cookies.token;

    if(!token){
        res.status(400).json({
            message: "you are not loged in"
        })
    }else{
        try{
            const data: any  = jwt.verify(token, JWT_PASSWORD);
            req.userId = data.id;

            next()
        }   
        catch{
            res.json({
                message:"Unable to get the data"
            })
        }
        

    }
}