import dotenv from "dotenv";
import { isTursoConfigured } from "./turso.js";

dotenv.config();

const TURSO_API_URL = "https://api.turso.tech";
const TURSO_ORG = process.env.TURSO_ORG_SLUG || "";
const TURSO_API_TOKEN = process.env.TURSO_API_TOKEN || "";

async function testConnection() {
    console.log("Checking Turso configuration...");
    
    if (!isTursoConfigured()) {
        console.error("❌ Turso is NOT fully configured in .env. Missing API token or Org slug.");
        process.exit(1);
    }
    console.log("✅ Environment secrets loaded.");
    
    console.log(`Pinging Turso Platform API for organization: ${TURSO_ORG}...`);
    try {
        const res = await fetch(`${TURSO_API_URL}/v1/organizations/${TURSO_ORG}/databases`, {
            headers: {
                "Authorization": `Bearer ${TURSO_API_TOKEN}`,
                "Content-Type": "application/json",
            }
        });

        if (res.ok) {
            const data = await res.json();
            console.log("✅ Successful connection!");
            console.log(`📊 Found ${data.databases?.length || 0} databases in organization '${TURSO_ORG}'.`);
            console.log("Integration is working perfectly.");
        } else {
            console.error(`❌ API Error (${res.status}): ${res.statusText}`);
            const err = await res.text();
            console.error("Details:", err);
        }
    } catch (err) {
        console.error("❌ Network or Fetch Error:", err);
    }
}

testConnection();
