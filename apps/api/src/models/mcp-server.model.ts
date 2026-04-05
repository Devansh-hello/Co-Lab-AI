/**
 * MCP Server Model
 *
 * Stores user-registered Model Context Protocol servers.
 * Each server provides tools that are discoverable and can be
 * injected into agent prompts as available capabilities.
 *
 * Supports three transport types:
 *   - stdio:            Spawn a child process (e.g. npx @modelcontextprotocol/server-github)
 *   - http-sse:         Connect via HTTP + Server-Sent Events
 *   - streamable-http:  Connect via streamable HTTP transport
 */

import mongoose from "mongoose";

const discoveredToolSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    inputSchema: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const mcpServerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    /** null = user-level; ObjectId = project-specific */
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "project", default: null },
    name: { type: String, required: true, maxlength: 100 },
    transport: {
        type: String,
        required: true,
        enum: ['stdio', 'http-sse', 'streamable-http'],
    },

    // ── stdio transport fields ──────────────────────────────
    /** Command to spawn (e.g. "npx", "node", "python") */
    command: { type: String },
    /** Arguments to pass (e.g. ["-y", "@modelcontextprotocol/server-github"]) */
    args: [{ type: String }],
    /** Environment variables for the child process */
    env: { type: mongoose.Schema.Types.Mixed, default: {} },

    // ── HTTP transport fields ───────────────────────────────
    /** Server URL (e.g. "http://localhost:3001/mcp") */
    url: { type: String },
    /** HTTP headers (e.g. auth tokens) */
    headers: { type: mongoose.Schema.Types.Mixed, default: {} },

    // ── Common fields ───────────────────────────────────────
    enabled: { type: Boolean, default: true },
    lastHealthCheck: { type: Date },
    healthStatus: {
        type: String,
        enum: ['unknown', 'healthy', 'unhealthy'],
        default: 'unknown',
    },
    /** Tools discovered from this server (cached) */
    discoveredTools: [discoveredToolSchema],
}, {
    timestamps: true,
});

/** One server name per user per project scope */
mcpServerSchema.index({ userId: 1, name: 1, projectId: 1 }, { unique: true });

export const MCPServer = mongoose.model("mcpServer", mcpServerSchema);
