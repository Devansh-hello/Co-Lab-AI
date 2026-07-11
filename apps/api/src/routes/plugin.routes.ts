/**
 * Plugin Routes
 *
 * Manages user plugin integrations (Supabase, GitHub, Firebase, etc.).
 * Each plugin can be enabled/disabled with optional credentials.
 *
 * When a plugin with MCP support is toggled, the bridge service
 * automatically registers/disables the corresponding MCP server
 * so agents can invoke its tools during code generation.
 *
 * Routes:
 *   GET    /api/v1/plugins             - List all plugin states for the user
 *   PUT    /api/v1/plugins/:pluginId   - Enable/disable a plugin + save credentials
 *   DELETE /api/v1/plugins/:pluginId   - Reset a plugin (delete config)
 */

import { Router } from "express";

import { UserPlugin } from "../models/index.js";
import { authCheck, type AuthRequest } from "../middleware/index.js";
import { onPluginEnabled, onPluginDisabled } from "../services/plugin-mcp-bridge.js";
import { logger } from "../lib/logger.js";

const log = logger.child({ module: "routes.plugin" });

export const pluginRouter = Router();

// -- List Plugins --

pluginRouter.get("/api/v1/plugins", authCheck, async (req: AuthRequest, res) => {
    try {
        const plugins = await UserPlugin.find({ userId: req.userId }).lean();
        res.json({ plugins });
    } catch {
        res.status(500).json({ message: "Failed to fetch plugins" });
    }
});

// -- Enable/Disable Plugin --

pluginRouter.put("/api/v1/plugins/:pluginId", authCheck, async (req: AuthRequest, res) => {
    try {
        const pluginId = req.params.pluginId as string;
        const { enabled, credentials } = req.body;

        const update: Record<string, unknown> = { enabled: !!enabled };
        if (enabled) update.enabledAt = new Date();
        if (credentials && typeof credentials === 'object') update.credentials = credentials;

        const plugin = await UserPlugin.findOneAndUpdate(
            { userId: req.userId, pluginId },
            { $set: update, $setOnInsert: { userId: req.userId, pluginId } },
            { upsert: true, new: true }
        );

        // Bridge to MCP: register/disable the MCP server
        try {
            if (enabled) {
                await onPluginEnabled(
                    req.userId!,
                    pluginId,
                    credentials || plugin.credentials || {},
                );
            } else {
                await onPluginDisabled(req.userId!, pluginId);
            }
        } catch (err: any) {
            // Non-blocking: MCP registration failure shouldn't break plugin toggle
            log.error({ err, pluginId, userId: req.userId }, "MCP bridge failed during plugin toggle");
        }

        res.json({ plugin });
    } catch {
        res.status(500).json({ message: "Failed to update plugin" });
    }
});

// -- Reset Plugin --

pluginRouter.delete("/api/v1/plugins/:pluginId", authCheck, async (req: AuthRequest, res) => {
    try {
        const pluginId = req.params.pluginId as string;
        await UserPlugin.deleteOne({ userId: req.userId, pluginId });

        // Also disable the MCP server
        try {
            await onPluginDisabled(req.userId!, pluginId);
        } catch { /* non-blocking */ }

        res.json({ message: "Plugin reset" });
    } catch {
        res.status(500).json({ message: "Failed to reset plugin" });
    }
});
