/**
 * Turso Database Model
 *
 * Tracks provisioned Turso (LibSQL) databases per project.
 * Each project can have at most one database. Stores connection
 * info and tracks storage usage for per-user quota enforcement.
 */

import mongoose from "mongoose";

const tursoDatabaseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "project", required: true, index: true },
    dbName: { type: String, required: true, unique: true },
    hostname: { type: String, required: true },
    authToken: { type: String, required: true },
    /** Current storage usage in megabytes */
    storageMB: { type: Number, default: 0 },
    /** Last time storage was checked via Turso API */
    lastUsageCheck: { type: Date },
}, { timestamps: true });

export const TursoDatabase = mongoose.model("tursoDatabase", tursoDatabaseSchema);
