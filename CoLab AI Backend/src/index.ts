import dotenv from "dotenv";
dotenv.config();

import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import bcrypt from "bcryptjs";
import z from "zod";
import * as http from "http";

import { User, Project, Message, mongo } from "./db.js";
import { validate, authCheck, type AuthRequest } from "./middleware.js";
import { setupWebSocket } from "./function.js";

// ─── Env validation ──────────────────────────────────────────────
const REQUIRED_ENV = ["DATABASE_URL", "JWT_SECRET"] as const;
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
    console.error(`[startup] Missing required environment variables: ${missingEnv.join(", ")}`);
    process.exit(1);
}

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ];

const app = express();
app.use(express.json());

app.use(cookieParser());

app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (e.g. curl, Postman in dev)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin '${origin}' not allowed`));
        }
    },
    credentials: true
}));

const server = http.createServer(app);

// Attach WebSocket Server to HTTP server
setupWebSocket(server);

const signupSchema = z.object({
    username: z.string().trim().min(3, "Username must be at least 3 characters"),
    email: z.string().email(),
    password: z.string().min(8)
});

const signinSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
});

app.post("/api/v1/signup", validate(signupSchema), async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            username: username,
            email: email,
            password: hashedPassword
        });

        res.json({
            message: "account created"
        });
    }
    catch (error: unknown) {
        const mongoError = error as { code?: number; message?: string };
        if (mongoError.code === 11000) {
            res.status(409).json({
                message: "user already exists"
            });
        } else {
            console.error("[signup] error:", error);
            res.status(400).json({
                message: "error creating user"
            });
        }
    }
});

app.post("/api/v1/signin", validate(signinSchema), async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) {
        res.status(400).json({
            message: "unable to find user"
        });
        return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password as string);
    if (!isPasswordValid) {
        res.status(400).json({
            message: "invalid credentials"
        });
        return;
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }).status(200).json({
        message: "Signed in successfully"
    });
});

app.post("/api/v1/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    }).status(200).json({
        message: "Logged out successfully"
    });
});

app.get("/api/v1/loggedin", authCheck, async (req: AuthRequest, res) => {
    try {
        const user = await User.findById(req.userId).select("-password -__v");
        res.status(200).json({
            loggedin: true,
            user: user
        });
    } catch (error) {
        res.status(500).json({
            loggedin: false,
            message: "Server error"
        });
    }
});

app.post("/api/v1/project", authCheck, async (req: AuthRequest, res) => {
    const { name, description } = req.body;

    try {
        await Project.create({
            name: name,
            description: description,
            userId: req.userId
        });
        res.status(200).json({
            message: "Project created successfully"
        });
    } catch {
        res.status(400).json({
            message: "unable to create project"
        });
    }
});

app.get("/api/v1/project", authCheck, async (req: AuthRequest, res) => {
    const userId = req.userId;
    const projects = await Project.find({ userId: userId });

    res.json(projects);
});

app.post("/api/v1/message", authCheck, async (req: AuthRequest, res) => {
    const message = req.body.message;
    const projectId = req.body.projectId;

    try {
        const newMsg = await Message.create({
            projectId: projectId,
            userMessage: message,
            status: "processing"
        });

        res.status(200).json({
            message: "Message recorded",
            data: newMsg
        });
    }
    catch (error) {
        res.status(400).json({
            message: "Unable to give output",
            error: error
        });
    }
});

app.get("/api/v1/projects/:projectId/messages", authCheck, async (req: AuthRequest, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.userId;

        // Verify user owns the project
        const project = await Project.findOne({ _id: projectId, userId });
        if (!project) {
            res.status(404).json({ error: "Project not found" });
            return;
        }

        const messages = await Message.find({ projectId })
            .sort({ timestamp: 1 })
            .lean();

        res.json({ messages: messages || [] });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({
            error: "Failed to fetch messages",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

async function startServer() {
    await mongo();
    const PORT = Number(process.env.PORT) || 5000;
    server.listen(PORT, () => {
        console.log(`[server] Listening on port ${PORT}`);
    });
}

startServer();