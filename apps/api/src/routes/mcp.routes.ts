/**
 * MCP Server Routes
 *
 * CRUD for user-registered Model Context Protocol servers.
 * Includes health check and tool discovery endpoints.
 *
 * Routes:
 *   GET    /api/v1/mcp/servers              - List user's MCP servers
 *   POST   /api/v1/mcp/servers              - Register a new MCP server
 *   PUT    /api/v1/mcp/servers/:id          - Update an MCP server
 *   DELETE /api/v1/mcp/servers/:id          - Remove an MCP server
 *   POST   /api/v1/mcp/servers/:id/health   - Run health check
 *   POST   /api/v1/mcp/servers/:id/discover - Force tool discovery
 */

import { Router } from "express";
import { authCheck, type AuthRequest } from "../middleware/index.js";
import { MCPServer } from "../models/index.js";
import { mcpManager } from "../services/mcp-client.js";

export const mcpRouter = Router();

// ─── List MCP Servers ───────────────────────────────────────────

mcpRouter.get("/api/v1/mcp/servers", authCheck, async (req: AuthRequest, res) => {
    try {
        const { projectId } = req.query;
        const filter: any = { userId: req.userId };
        if (projectId) {
            filter.$or = [{ projectId: null }, { projectId }];
        }

        const servers = await MCPServer.find(filter).lean();
        res.json({ servers });
    } catch {
        res.status(500).json({ message: "Failed to fetch MCP servers" });
    }
});

// ─── Register MCP Server ────────────────────────────────────────

mcpRouter.post("/api/v1/mcp/servers", authCheck, async (req: AuthRequest, res) => {
    try {
        const { name, transport, command, args, env, url, headers, projectId } = req.body;

        if (!name || !transport) {
            res.status(400).json({ message: "name and transport are required" });
            return;
        }

        if (transport === 'stdio' && !command) {
            res.status(400).json({ message: "stdio transport requires a command" });
            return;
        }

        if ((transport === 'http-sse' || transport === 'streamable-http') && !url) {
            res.status(400).json({ message: "HTTP transport requires a url" });
            return;
        }

        const server = await MCPServer.create({
            userId: req.userId,
            projectId: projectId || null,
            name,
            transport,
            command,
            args: args || [],
            env: env || {},
            url,
            headers: headers || {},
        });

        res.status(201).json({ server });
    } catch (err: any) {
        if (err.code === 11000) {
            res.status(409).json({ message: "An MCP server with this name already exists" });
            return;
        }
        res.status(500).json({ message: "Failed to register MCP server" });
    }
});

// ─── Update MCP Server ─────────────────────────────────────────

mcpRouter.put("/api/v1/mcp/servers/:id", authCheck, async (req: AuthRequest, res) => {
    try {
        const { name, transport, command, args, env, url, headers, enabled } = req.body;
        const update: any = {};

        if (name !== undefined) update.name = name;
        if (transport !== undefined) update.transport = transport;
        if (command !== undefined) update.command = command;
        if (args !== undefined) update.args = args;
        if (env !== undefined) update.env = env;
        if (url !== undefined) update.url = url;
        if (headers !== undefined) update.headers = headers;
        if (enabled !== undefined) update.enabled = enabled;

        const server = await MCPServer.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { $set: update },
            { new: true }
        );

        if (!server) {
            res.status(404).json({ message: "MCP server not found" });
            return;
        }

        // Disconnect if config changed (will reconnect with new config on next use)
        await mcpManager.disconnect(req.params.id as string);

        res.json({ server });
    } catch {
        res.status(500).json({ message: "Failed to update MCP server" });
    }
});

// ─── Delete MCP Server ─────────────────────────────────────────

mcpRouter.delete("/api/v1/mcp/servers/:id", authCheck, async (req: AuthRequest, res) => {
    try {
        await mcpManager.disconnect(req.params.id as string);
        const result = await MCPServer.deleteOne({ _id: req.params.id, userId: req.userId });

        if (result.deletedCount === 0) {
            res.status(404).json({ message: "MCP server not found" });
            return;
        }

        res.json({ message: "MCP server removed" });
    } catch {
        res.status(500).json({ message: "Failed to delete MCP server" });
    }
});

// ─── Health Check ───────────────────────────────────────────────

mcpRouter.post("/api/v1/mcp/servers/:id/health", authCheck, async (req: AuthRequest, res) => {
    try {
        const server = await MCPServer.findOne({ _id: req.params.id, userId: req.userId });
        if (!server) {
            res.status(404).json({ message: "MCP server not found" });
            return;
        }

        const status = await mcpManager.healthCheck(server);
        res.json({ status, lastHealthCheck: new Date() });
    } catch (err: any) {
        res.status(500).json({ message: err.message || "Health check failed" });
    }
});

// ─── Force Tool Discovery ───────────────────────────────────────

mcpRouter.post("/api/v1/mcp/servers/:id/discover", authCheck, async (req: AuthRequest, res) => {
    try {
        const server = await MCPServer.findOne({ _id: req.params.id, userId: req.userId });
        if (!server) {
            res.status(404).json({ message: "MCP server not found" });
            return;
        }

        const tools = await mcpManager.discoverTools(server);
        res.json({ tools, count: tools.length });
    } catch (err: any) {
        res.status(500).json({ message: err.message || "Tool discovery failed" });
    }
});
