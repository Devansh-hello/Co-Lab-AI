#!/usr/bin/env node
/**
 * CoLab AI – REST endpoint integration tests
 * Uses only Node.js built-ins (no extra deps required).
 *
 * Run from the repo root:
 *   node test-endpoints.mjs
 *
 * Requires the backend to be running on http://localhost:5000
 */

const BASE = "http://localhost:5000/api/v1";

// ── helpers ─────────────────────────────────────────────────────────────────

let cookieJar = "";
let passedCount = 0;
let failedCount = 0;

async function req(method, path, body, jar) {
    const headers = { "Content-Type": "application/json" };
    if (jar) headers["Cookie"] = jar;

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        redirect: "manual",
    });

    // capture Set-Cookie
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookieJar = setCookie.split(";")[0]; // keep only name=value

    let data = {};
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
        data = await res.json().catch(() => ({}));
    }

    return { status: res.status, data };
}

function assert(label, condition, got) {
    if (condition) {
        console.log(`  ✅  ${label}`);
        passedCount++;
    } else {
        console.error(`  ❌  ${label}  →  ${JSON.stringify(got)}`);
        failedCount++;
    }
}

// ── tests ────────────────────────────────────────────────────────────────────

const testUser = {
    username: `testuser_${Date.now()}`,
    email: `testuser_${Date.now()}@example.com`,
    password: "Password123",
};

let projectId = null;

async function runTests() {
    console.log("\n═══════════════════════════════════════════════════");
    console.log("  CoLab AI – endpoint integration tests");
    console.log("═══════════════════════════════════════════════════\n");

    // ── 1. Signup ──────────────────────────────────────────────────────────
    console.log("[ 1 ] POST /signup");
    {
        const r = await req("POST", "/signup", {
            username: testUser.username,
            email: testUser.email,
            password: testUser.password,
        });
        assert("returns 200", r.status === 200, r);
        assert('message = "account created"', r.data.message === "account created", r.data);
    }

    // duplicate signup
    {
        const r = await req("POST", "/signup", {
            username: testUser.username,
            email: testUser.email,
            password: testUser.password,
        });
        assert("duplicate returns 409", r.status === 409, r);
    }

    // ── 2. Signup validation errors ────────────────────────────────────────
    console.log("\n[ 2 ] POST /signup – validation");
    {
        const r = await req("POST", "/signup", { email: "bad", password: "123" });
        assert("missing username → 400", r.status === 400, r);
        assert("returns friendly message string", typeof r.data.message === "string", r.data);
        assert("no raw zod error object leaked", !r.data.Error, r.data);
    }

    // ── 3. Signin – wrong password ─────────────────────────────────────────
    console.log("\n[ 3 ] POST /signin – bad credentials");
    {
        const r = await req("POST", "/signin", {
            email: testUser.email,
            password: "WrongPassword1",
        });
        assert("returns 400", r.status === 400, r);
    }

    // ── 4. Signin – correct ────────────────────────────────────────────────
    console.log("\n[ 4 ] POST /signin");
    {
        const r = await req("POST", "/signin", {
            email: testUser.email,
            password: testUser.password,
        });
        assert("returns 200", r.status === 200, r);
        assert("cookie set", cookieJar.startsWith("token="), cookieJar);
    }

    // ── 5. /loggedin ───────────────────────────────────────────────────────
    console.log("\n[ 5 ] GET /loggedin");
    {
        const r = await req("GET", "/loggedin", null, cookieJar);
        assert("returns 200", r.status === 200, r);
        assert("loggedin = true", r.data.loggedin === true, r.data);
        assert("username present", r.data.user?.username === testUser.username, r.data);
        assert("password NOT leaked", r.data.user?.password === undefined, r.data);
    }

    // ── 6. /loggedin without auth ──────────────────────────────────────────
    console.log("\n[ 6 ] GET /loggedin (no cookie)");
    {
        const r = await req("GET", "/loggedin", null, "");
        assert("returns 401", r.status === 401, r);
    }

    // ── 7. Create project ──────────────────────────────────────────────────
    console.log("\n[ 7 ] POST /project");
    {
        const r = await req(
            "POST",
            "/project",
            { name: "Test Project", description: "Integration test" },
            cookieJar
        );
        assert("returns 200", r.status === 200, r);
    }

    // ── 8. Get projects ────────────────────────────────────────────────────
    console.log("\n[ 8 ] GET /project");
    {
        const r = await req("GET", "/project", null, cookieJar);
        assert("returns 200", r.status === 200, r);
        assert("returns array", Array.isArray(r.data), r.data);
        assert("has at least one project", r.data.length >= 1, r.data);
        projectId = r.data[r.data.length - 1]?._id;
        assert("project has _id", !!projectId, r.data[0]);
        assert("project has name", r.data[r.data.length - 1]?.name === "Test Project", r.data[0]);
    }

    // ── 9. Get messages ────────────────────────────────────────────────────
    console.log("\n[ 9 ] GET /projects/:id/messages");
    {
        const r = await req("GET", `/projects/${projectId}/messages`, null, cookieJar);
        assert("returns 200", r.status === 200, r);
        assert("messages is array", Array.isArray(r.data.messages), r.data);
    }

    // ── 10. Get messages – wrong project (other user's) ────────────────────
    console.log("\n[ 10 ] GET /projects/wrongid/messages (invalid id)");
    {
        const r = await req("GET", "/projects/000000000000000000000000/messages", null, cookieJar);
        assert("returns 404", r.status === 404, r);
    }

    // ── 11. Logout ─────────────────────────────────────────────────────────
    console.log("\n[ 11 ] POST /logout");
    {
        const r = await req("POST", "/logout", null, cookieJar);
        assert("returns 200", r.status === 200, r);
    }

    // ── summary ─────────────────────────────────────────────────────────────
    console.log("\n═══════════════════════════════════════════════════");
    console.log(`  Results: ${passedCount} passed, ${failedCount} failed`);
    console.log("═══════════════════════════════════════════════════\n");

    process.exit(failedCount > 0 ? 1 : 0);
}

runTests().catch((err) => {
    console.error("Test runner error:", err.message);
    process.exit(1);
});
