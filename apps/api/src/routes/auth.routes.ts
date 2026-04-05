/**
 * Authentication Routes
 *
 * Handles user registration, login (email + Google OAuth), logout,
 * and session verification. All auth tokens are stored in HTTP-only cookies.
 *
 * Routes:
 *   POST /api/v1/signup       - Register with email/password
 *   POST /api/v1/signin       - Login with email/password
 *   POST /api/v1/logout       - Clear auth cookie
 *   POST /api/v1/auth/google  - Google OAuth sign-in
 *   GET  /api/v1/loggedin     - Check auth status + get user profile
 */

import { Router } from "express";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import z from "zod";
import { OAuth2Client } from "google-auth-library";

import { User } from "../models/index.js";
import { validate, authCheck, type AuthRequest } from "../middleware/index.js";
import { JWT_SECRET, GOOGLE_CLIENT_ID, IS_PRODUCTION } from "../config/env.js";

export const authRouter = Router();

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/** Cookie options shared by sign-in and logout */
const cookieOptions = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? "strict" as const : "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ─── Validation Schemas ─────────────────────────────────────────

const signupSchema = z.object({
    username: z.string().trim().min(3, "Username must be at least 3 characters"),
    email: z.string().email(),
    password: z.string().min(8),
});

const signinSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

// ─── Email/Password Registration ────────────────────────────────

authRouter.post("/api/v1/signup", validate(signupSchema), async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, email, password: hashedPassword });

        res.json({ message: "account created" });
    } catch (error: unknown) {
        const mongoError = error as { code?: number; message?: string };
        if (mongoError.code === 11000) {
            res.status(409).json({ message: "user already exists" });
        } else {
            console.error("[signup] error:", error);
            res.status(400).json({ message: "error creating user" });
        }
    }
});

// ─── Email/Password Login ───────────────────────────────────────

authRouter.post("/api/v1/signin", validate(signinSchema), async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        res.status(400).json({ message: "unable to find user" });
        return;
    }

    /* Account created via Google has no password */
    if (!user.password) {
        res.status(400).json({
            message: "This account uses Google sign-in. Please use Continue with Google."
        });
        return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        res.status(400).json({ message: "invalid credentials" });
        return;
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie("token", token, cookieOptions).status(200).json({
        message: "Signed in successfully"
    });
});

// ─── Logout ─────────────────────────────────────────────────────

authRouter.post("/api/v1/logout", (_req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: IS_PRODUCTION ? "strict" as const : "lax" as const,
    }).status(200).json({ message: "Logged out successfully" });
});

// ─── Google OAuth ───────────────────────────────────────────────

authRouter.post("/api/v1/auth/google", async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        res.status(400).json({ message: "Missing Google credential" });
        return;
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            res.status(400).json({ message: "Invalid Google token" });
            return;
        }

        const googleId = payload.sub;
        const email = payload.email as string;
        const name: string = payload.name ?? email.split("@")[0] ?? "user";
        const avatar = payload.picture;

        /* Find existing user by googleId or email */
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (!user) {
            /* Create new user with a unique username derived from name */
            const baseUsername = name.replace(/\s+/g, "").slice(0, 20);
            const username = `${baseUsername}_${Math.random().toString(36).slice(2, 6)}`;
            user = await User.create({ username, email, googleId, avatar });
        } else {
            /* Link Google account if not already linked, update avatar */
            if (!user.googleId) user.googleId = googleId;
            if (avatar && user.avatar !== avatar) user.avatar = avatar;
            await user.save();
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
        res.cookie("token", token, cookieOptions).status(200).json({
            message: "Signed in with Google successfully",
        });
    } catch (error) {
        console.error("[google-auth] error:", error);
        res.status(401).json({ message: "Google authentication failed" });
    }
});

// ─── Google OAuth Redirect Callback ─────────────────────────────
// Used with ux_mode: 'redirect' — Google POSTs the credential here
// as URL-encoded form data after the user authenticates.
// This avoids the popup flow which breaks under COOP: same-origin.

authRouter.post("/api/v1/auth/google/redirect",
    express.urlencoded({ extended: true }),
    async (req, res) => {
        const credential = req.body.credential;

        if (!credential) {
            res.status(400).send("Missing credential");
            return;
        }

        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                res.status(400).send("Invalid Google token");
                return;
            }

            const googleId = payload.sub;
            const email = payload.email as string;
            const name: string = payload.name ?? email.split("@")[0] ?? "user";
            const avatar = payload.picture;

            let user = await User.findOne({ $or: [{ googleId }, { email }] });

            if (!user) {
                const baseUsername = name.replace(/\s+/g, "").slice(0, 20);
                const username = `${baseUsername}_${Math.random().toString(36).slice(2, 6)}`;
                user = await User.create({ username, email, googleId, avatar });
            } else {
                if (!user.googleId) user.googleId = googleId;
                if (avatar && user.avatar !== avatar) user.avatar = avatar;
                await user.save();
            }

            const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

            /* Set auth cookie and redirect to the frontend projects page */
            res.cookie("token", token, cookieOptions)
                .redirect(302, "/projects");
        } catch (error) {
            console.error("[google-auth-redirect] error:", error);
            res.redirect(302, "/login?error=google_auth_failed");
        }
    }
);

// ─── Session Check ──────────────────────────────────────────────

authRouter.get("/api/v1/loggedin", authCheck, async (req: AuthRequest, res) => {
    try {
        const user = await User.findById(req.userId).select("-password -__v");
        res.status(200).json({ loggedin: true, user });
    } catch {
        res.status(500).json({ loggedin: false, message: "Server error" });
    }
});
