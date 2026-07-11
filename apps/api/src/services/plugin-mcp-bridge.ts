/**
 * Plugin → MCP Bridge
 *
 * When a user enables a plugin on the Plugins page, this service
 * auto-registers the corresponding MCP server so the tool execution
 * loop can actually invoke its tools. When disabled, the MCP server
 * is marked as disabled (not deleted, to preserve discovered tools cache).
 *
 * Maps each plugin ID to its MCP server configuration.
 */

import { MCPServer } from "../models/index.js";
import { mcpManager } from "./mcp-client.js";
import { logger } from "../lib/logger.js";

const log = logger.child({ module: "service.plugin-mcp-bridge" });

// ─── Plugin → MCP Server Config Map ────────────────────────────

interface MCPConfig {
    transport: 'stdio' | 'http-sse' | 'streamable-http';
    command?: string;
    args?: string[];
    /** Function to build env vars from user-provided credentials */
    buildEnv?: (creds: Record<string, string>) => Record<string, string>;
    /** For HTTP transports: function to build the URL from credentials */
    buildUrl?: (creds: Record<string, string>) => string;
    /** For HTTP transports: function to build headers from credentials */
    buildHeaders?: (creds: Record<string, string>) => Record<string, string>;
}

const PLUGIN_MCP_MAP: Record<string, MCPConfig> = {
    // ── Core ────────────────────────────────────────────────
    'context7': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@upstash/context7-mcp@latest'],
        buildEnv: (creds) => ({
            CONTEXT7_API_KEY: creds.apiKey || '',
        }),
    },
    'github': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        buildEnv: (creds) => ({
            GITHUB_PERSONAL_ACCESS_TOKEN: creds.token || '',
        }),
    },
    'filesystem': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        // Root path is appended to args at registration time
        buildEnv: () => ({}),
    },
    'fetch': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-fetch'],
    },
    'sequential-thinking': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    },

    // ── Dev Tools ───────────────────────────────────────────
    'playwright': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@anthropic/mcp-server-playwright'],
    },
    'chrome-devtools': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@anthropic/mcp-server-chrome-devtools'],
        buildEnv: (creds) => ({
            ...(creds.debugPort ? { CHROME_DEBUG_PORT: creds.debugPort } : {}),
        }),
    },

    // ── Databases ───────────────────────────────────────────
    'postgresql': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-postgres'],
        buildEnv: (creds) => ({
            POSTGRES_CONNECTION_STRING: creds.connectionString || '',
        }),
    },
    'mongodb': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-mongodb'],
        buildEnv: (creds) => ({
            MONGODB_URI: creds.connectionString || '',
        }),
    },
    'supabase': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@supabase/mcp-server-supabase@latest', '--read-only'],
        buildEnv: (creds) => ({
            SUPABASE_URL: creds.url || '',
            SUPABASE_SERVICE_ROLE_KEY: creds.anonKey || '',
        }),
    },

    // ── Cloud ───────────────────────────────────────────────
    'vercel': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@vercel/mcp-adapter'],
        buildEnv: (creds) => ({
            VERCEL_API_TOKEN: creds.token || '',
        }),
    },
    'cloudflare': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@cloudflare/mcp-server-cloudflare'],
        buildEnv: (creds) => ({
            CLOUDFLARE_API_TOKEN: creds.apiToken || '',
        }),
    },

    // ── Search & Data ───────────────────────────────────────
    'exa': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', 'exa-mcp-server'],
        buildEnv: (creds) => ({
            EXA_API_KEY: creds.apiKey || '',
        }),
    },
    'firecrawl': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', 'firecrawl-mcp'],
        buildEnv: (creds) => ({
            FIRECRAWL_API_KEY: creds.apiKey || '',
        }),
    },

    // ── Workflow ─────────────────────────────────────────────
    'zapier': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', 'zapier-mcp-server'],
        buildEnv: (creds) => ({
            ZAPIER_API_KEY: creds.apiKey || '',
        }),
    },
};

// ─── Bridge Functions ───────────────────────────────────────────

/**
 * When a plugin is enabled, register or update the MCP server.
 * Runs tool discovery in the background (non-blocking).
 */
export async function onPluginEnabled(
    userId: string,
    pluginId: string,
    credentials: Record<string, string>,
): Promise<void> {
    const config = PLUGIN_MCP_MAP[pluginId];
    if (!config) return; // Plugin has no MCP mapping

    const env = config.buildEnv?.(credentials) || {};
    let args = [...(config.args || [])];

    // Special case: filesystem plugin needs root path as an arg
    if (pluginId === 'filesystem' && credentials.rootPath) {
        args.push(credentials.rootPath);
    }

    // Upsert the MCP server
    const serverDoc = await MCPServer.findOneAndUpdate(
        { userId, name: pluginIdToName(pluginId), projectId: null },
        {
            $set: {
                transport: config.transport,
                command: config.command,
                args,
                env,
                url: config.buildUrl?.(credentials) || undefined,
                headers: config.buildHeaders?.(credentials) || undefined,
                enabled: true,
            },
            $setOnInsert: {
                userId,
                name: pluginIdToName(pluginId),
                projectId: null,
            },
        },
        { upsert: true, new: true },
    );

    // Discover tools in the background (don't block the UI)
    discoverToolsBackground(serverDoc);
}

/**
 * When a plugin is disabled, disable the MCP server (keep config for re-enable).
 */
export async function onPluginDisabled(
    userId: string,
    pluginId: string,
): Promise<void> {
    const config = PLUGIN_MCP_MAP[pluginId];
    if (!config) return;

    await MCPServer.findOneAndUpdate(
        { userId, name: pluginIdToName(pluginId), projectId: null },
        { $set: { enabled: false } },
    );

    // Disconnect active connection if any
    const server = await MCPServer.findOne({ userId, name: pluginIdToName(pluginId), projectId: null });
    if (server) {
        try { await mcpManager.disconnect(server._id.toString()); } catch { /* ignore */ }
    }
}

/**
 * Check if a plugin has an MCP server mapping.
 */
export function hasPluginMCPMapping(pluginId: string): boolean {
    return pluginId in PLUGIN_MCP_MAP;
}

// ─── Helpers ────────────────────────────────────────────────────

/** Convert plugin ID to a display name for the MCP server */
function pluginIdToName(pluginId: string): string {
    const names: Record<string, string> = {
        'context7': 'Context7',
        'github': 'GitHub',
        'filesystem': 'Filesystem',
        'fetch': 'Fetch',
        'sequential-thinking': 'Sequential Thinking',
        'playwright': 'Playwright',
        'chrome-devtools': 'Chrome DevTools',
        'postgresql': 'PostgreSQL',
        'mongodb': 'MongoDB',
        'supabase': 'Supabase',
        'vercel': 'Vercel',
        'cloudflare': 'Cloudflare',
        'exa': 'Exa Search',
        'firecrawl': 'Firecrawl',
        'zapier': 'Zapier',
    };
    return names[pluginId] || pluginId;
}

/** Run tool discovery without blocking. Logs errors but doesn't throw. */
function discoverToolsBackground(serverDoc: any): void {
    (async () => {
        try {
            await mcpManager.discoverTools(serverDoc);
            log.info({ serverName: serverDoc.name }, "discovered MCP tools");
        } catch (err: any) {
            log.error({ err, serverName: serverDoc.name }, "MCP tool discovery failed");
            // Mark as unhealthy but don't fail
            await MCPServer.findByIdAndUpdate(serverDoc._id, {
                healthStatus: 'unhealthy',
                lastHealthCheck: new Date(),
            });
        }
    })();
}
