/**
 * Turso Database Model
 *
 * Tracks provisioned Turso (LibSQL) databases per project.
 * Each project can have at most one database. Stores connection
 * info and tracks storage usage for per-user quota enforcement.
 */

import mongoose from "mongoose";
import { encrypt, decrypt, isEncryptionConfigured } from "../services/crypto.js";

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

/** Encrypt authToken before save */
tursoDatabaseSchema.pre('save', function () {
    if (!isEncryptionConfigured()) return;
    if (this.authToken && !this.authToken.startsWith('enc:')) {
        this.authToken = encrypt(this.authToken);
    }
});

/** Decrypt authToken on read */
tursoDatabaseSchema.post('init', function () {
    if (!isEncryptionConfigured()) return;
    if (this.authToken) this.authToken = decrypt(this.authToken);
});

export const TursoDatabase = mongoose.model("tursoDatabase", tursoDatabaseSchema);
