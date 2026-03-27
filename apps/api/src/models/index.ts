/**
 * Models Barrel Export
 *
 * Re-exports all Mongoose models and the database connection helper.
 * Import from here instead of individual model files:
 *   import { User, Project, mongo } from "./models/index.js";
 */

import mongoose from "mongoose";

/**
 * Connect to MongoDB using the DATABASE_URL environment variable.
 * Exits the process on failure since the app cannot function without a database.
 */
export async function mongo() {
    try {
        await mongoose.connect(process.env.DATABASE_URL as string);
        console.log("[db] Connected to MongoDB");
    } catch (err) {
        console.error("[db] Unable to connect to database", err);
        process.exit(1);
    }
}

export { User } from "./user.model.js";
export { Project } from "./project.model.js";
export { Message } from "./message.model.js";
export { ProjectSnapshot } from "./snapshot.model.js";
export { UserPlugin } from "./plugin.model.js";
export { TursoDatabase } from "./turso-db.model.js";
