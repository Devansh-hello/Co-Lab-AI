import "./config/env.js"; // Ensure env is loaded (dotenv called once in config/env.ts)

const TURSO_API_URL = "https://api.turso.tech";
const TURSO_ORG = process.env.TURSO_ORG_SLUG || "";
const TURSO_API_TOKEN = process.env.TURSO_API_TOKEN || "";
const TURSO_GROUP = process.env.TURSO_GROUP || "default";

interface TursoHeaders { [key: string]: string }

function headers(): TursoHeaders {
    return {
        "Authorization": `Bearer ${TURSO_API_TOKEN}`,
        "Content-Type": "application/json",
    };
}

// ─── Create a database ───────────────────────────────────────────

export async function createDatabase(dbName: string): Promise<{
    hostname: string;
    dbName: string;
} | null> {
    if (!TURSO_API_TOKEN || !TURSO_ORG) {
        console.warn("[turso] Missing TURSO_API_TOKEN or TURSO_ORG_SLUG env vars");
        return null;
    }

    try {
        const res = await fetch(
            `${TURSO_API_URL}/v1/organizations/${TURSO_ORG}/databases`,
            {
                method: "POST",
                headers: headers(),
                body: JSON.stringify({
                    name: dbName,
                    group: TURSO_GROUP,
                }),
            }
        );

        if (!res.ok) {
            const err = await res.text();
            console.error(`[turso] Create DB failed (${res.status}):`, err);
            return null;
        }

        const data = await res.json() as any;
        const hostname = data.database?.Hostname || data.database?.hostname || `${dbName}-${TURSO_ORG}.turso.io`;

        return { hostname: `libsql://${hostname}`, dbName: data.database?.Name || dbName };
    } catch (err) {
        console.error("[turso] Create DB error:", err);
        return null;
    }
}

// ─── Create an auth token for a database ─────────────────────────

export async function createAuthToken(dbName: string): Promise<string | null> {
    if (!TURSO_API_TOKEN || !TURSO_ORG) return null;

    try {
        const res = await fetch(
            `${TURSO_API_URL}/v1/organizations/${TURSO_ORG}/databases/${dbName}/auth/tokens`,
            {
                method: "POST",
                headers: headers(),
                body: JSON.stringify({ permissions: { read_attach: { databases: ["*"] } } }),
            }
        );

        if (!res.ok) {
            console.error(`[turso] Create token failed (${res.status}):`, await res.text());
            return null;
        }

        const data = await res.json() as any;
        return data.jwt || null;
    } catch (err) {
        console.error("[turso] Create token error:", err);
        return null;
    }
}

// ─── Delete a database ───────────────────────────────────────────

export async function deleteDatabase(dbName: string): Promise<boolean> {
    if (!TURSO_API_TOKEN || !TURSO_ORG) return false;

    try {
        const res = await fetch(
            `${TURSO_API_URL}/v1/organizations/${TURSO_ORG}/databases/${dbName}`,
            { method: "DELETE", headers: headers() }
        );
        return res.ok;
    } catch {
        return false;
    }
}

// ─── Get database usage (storage) ────────────────────────────────

export async function getDatabaseUsage(dbName: string): Promise<number> {
    if (!TURSO_API_TOKEN || !TURSO_ORG) return 0;

    try {
        const res = await fetch(
            `${TURSO_API_URL}/v1/organizations/${TURSO_ORG}/databases/${dbName}/usage`,
            { method: "GET", headers: headers() }
        );

        if (!res.ok) return 0;
        const data = await res.json() as any;
        // Usage is in bytes, convert to MB
        const bytes = data.database?.usage?.storage_bytes_used || data.usage?.storage_bytes_used || 0;
        return Math.round((bytes / (1024 * 1024)) * 100) / 100;
    } catch {
        return 0;
    }
}

// ─── Provision a full database (create + token) ──────────────────

export async function provisionDatabase(projectId: string): Promise<{
    hostname: string;
    authToken: string;
    dbName: string;
} | null> {
    // Generate a unique DB name from project ID
    const dbName = `colab-${projectId.slice(-12)}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

    const db = await createDatabase(dbName);
    if (!db) return null;

    const token = await createAuthToken(db.dbName);
    if (!token) {
        // Cleanup: delete the DB if token creation fails
        await deleteDatabase(db.dbName);
        return null;
    }

    return {
        hostname: db.hostname,
        authToken: token,
        dbName: db.dbName,
    };
}

// ─── Check if Turso is configured ────────────────────────────────

export function isTursoConfigured(): boolean {
    return !!(TURSO_API_TOKEN && TURSO_ORG);
}
