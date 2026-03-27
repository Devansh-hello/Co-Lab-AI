/**
 * Encryption Service
 *
 * Encrypts/decrypts sensitive strings (API keys, auth tokens) at rest
 * using AES-256-GCM. Encrypted values are prefixed with "enc:" so the
 * system can transparently handle both legacy plaintext and encrypted values.
 *
 * Requires ENCRYPTION_KEY env var (64-char hex string = 32 bytes).
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const PREFIX = "enc:";

function getKey(): Buffer {
    const hex = process.env.ENCRYPTION_KEY || "";
    if (hex.length !== 64) {
        throw new Error(
            "ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
            "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        );
    }
    return Buffer.from(hex, "hex");
}

/** Encrypt a plaintext string. Returns a prefixed opaque string. */
export function encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;

    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Format: enc:<iv>:<authTag>:<ciphertext>  (all base64)
    return PREFIX + [iv, authTag, encrypted].map(b => b.toString("base64")).join(":");
}

/** Decrypt a value. Handles both encrypted (prefixed) and legacy plaintext. */
export function decrypt(value: string): string {
    if (!value) return value;
    if (!value.startsWith(PREFIX)) return value; // legacy plaintext — passthrough

    const parts = value.slice(PREFIX.length).split(":");
    if (parts.length !== 3) return ""; // corrupted

    const key = getKey();
    const ivB64 = parts[0]!;
    const tagB64 = parts[1]!;
    const dataB64 = parts[2]!;
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(tagB64, "base64");
    const encrypted = Buffer.from(dataB64, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

/** Check whether the encryption key is configured. */
export function isEncryptionConfigured(): boolean {
    return (process.env.ENCRYPTION_KEY || "").length === 64;
}
