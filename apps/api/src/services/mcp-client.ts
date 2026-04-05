/**
 * MCP Client Manager
 *
 * Manages connections to Model Context Protocol servers. Provides
 * tool discovery, health checking, and tool invocation. Each server
 * connection is lazy (created on first use) and auto-disconnected
 * after 5 minutes of inactivity.
 *
 * Supported transports:
 *   - stdio: Spawns a child process
 *   - http-sse: Connects via HTTP + SSE
 *   - streamable-http: Connects via streamable HTTP
 *
 * Note: This service uses the @modelcontextprotocol/sdk package.
 * If the SDK is not installed, operations gracefully degrade.
 */

import { MCPServer } from "../models/index.js";

// ─── Types ──────────────────────────────────────────────────────

interface MCPTool {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
}

interface MCPConnection {
    serverId: string;
    client: any; // MCP Client instance
    transport: any; // Transport instance
    tools: MCPTool[];
    lastUsed: number;
    idleTimer: NodeJS.Timeout | null;
}

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/** Allowlist for stdio commands to prevent arbitrary command execution */
const ALLOWED_COMMANDS = ['npx', 'node', 'python', 'python3', 'uvx', 'bunx'];

// ─── Client Manager ─────────────────────────────────────────────

export class MCPClientManager {
    private connections = new Map<string, MCPConnection>();

    /**
     * Connect to an MCP server and discover its tools.
     * Returns discovered tools or throws on connection failure.
     */
    async connect(serverConfig: any): Promise<MCPTool[]> {
        const serverId = serverConfig._id.toString();

        // Return cached connection if alive
        const existing = this.connections.get(serverId);
        if (existing) {
            existing.lastUsed = Date.now();
            return existing.tools;
        }

        // Validate stdio command against allowlist
        if (serverConfig.transport === 'stdio') {
            const cmd = serverConfig.command?.split('/').pop()?.split('\\').pop();
            if (!cmd || !ALLOWED_COMMANDS.includes(cmd)) {
                throw new Error(`Command "${serverConfig.command}" is not in the allowed list: ${ALLOWED_COMMANDS.join(', ')}`);
            }
        }

        try {
            // Dynamic import to handle missing SDK gracefully
            const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");

            let transport: any;

            if (serverConfig.transport === 'stdio') {
                const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js");
                transport = new StdioClientTransport({
                    command: serverConfig.command,
                    args: serverConfig.args || [],
                    env: { ...process.env, ...(serverConfig.env || {}) },
                });
            } else if (serverConfig.transport === 'http-sse') {
                const { SSEClientTransport } = await import("@modelcontextprotocol/sdk/client/sse.js");
                transport = new SSEClientTransport(new URL(serverConfig.url), {
                    requestInit: { headers: serverConfig.headers || {} },
                });
            } else if (serverConfig.transport === 'streamable-http') {
                const { StreamableHTTPClientTransport } = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");
                transport = new StreamableHTTPClientTransport(new URL(serverConfig.url), {
                    requestInit: { headers: serverConfig.headers || {} },
                });
            } else {
                throw new Error(`Unknown transport: ${serverConfig.transport}`);
            }

            const client = new Client({ name: "co-lab-ai", version: "1.0.0" }, {});
            await client.connect(transport);

            // Discover tools
            const toolsResult = await client.listTools();
            const tools: MCPTool[] = (toolsResult.tools || []).map((t: any) => ({
                name: t.name,
                description: t.description || '',
                inputSchema: t.inputSchema || {},
            }));

            // Cache connection with idle timeout
            const conn: MCPConnection = {
                serverId,
                client,
                transport,
                tools,
                lastUsed: Date.now(),
                idleTimer: null,
            };

            conn.idleTimer = setInterval(() => {
                if (Date.now() - conn.lastUsed > IDLE_TIMEOUT) {
                    this.disconnect(serverId);
                }
            }, 60_000);

            this.connections.set(serverId, conn);
            return tools;

        } catch (err: any) {
            throw new Error(`MCP connect failed (${serverConfig.name}): ${err.message}`);
        }
    }

    /**
     * Disconnect from an MCP server and clean up resources.
     */
    async disconnect(serverId: string): Promise<void> {
        const conn = this.connections.get(serverId);
        if (!conn) return;

        if (conn.idleTimer) clearInterval(conn.idleTimer);

        try {
            await conn.client.close();
        } catch { /* ignore cleanup errors */ }

        try {
            await conn.transport.close();
        } catch { /* ignore cleanup errors */ }

        this.connections.delete(serverId);
    }

    /**
     * Run a health check on an MCP server.
     * Connects, lists tools, then disconnects.
     */
    async healthCheck(serverConfig: any): Promise<'healthy' | 'unhealthy'> {
        try {
            const tools = await this.connect(serverConfig);
            // Update the DB record
            await MCPServer.findByIdAndUpdate(serverConfig._id, {
                healthStatus: 'healthy',
                lastHealthCheck: new Date(),
                discoveredTools: tools,
            });
            return 'healthy';
        } catch {
            await MCPServer.findByIdAndUpdate(serverConfig._id, {
                healthStatus: 'unhealthy',
                lastHealthCheck: new Date(),
            });
            return 'unhealthy';
        }
    }

    /**
     * Discover tools from an MCP server and update the DB cache.
     */
    async discoverTools(serverConfig: any): Promise<MCPTool[]> {
        const tools = await this.connect(serverConfig);
        await MCPServer.findByIdAndUpdate(serverConfig._id, {
            discoveredTools: tools,
            lastHealthCheck: new Date(),
            healthStatus: 'healthy',
        });
        return tools;
    }

    /**
     * Call a tool on a connected MCP server.
     */
    async callTool(serverId: string, toolName: string, args: any): Promise<any> {
        const conn = this.connections.get(serverId);
        if (!conn) throw new Error(`No active connection for server ${serverId}`);

        conn.lastUsed = Date.now();
        const result = await conn.client.callTool({ name: toolName, arguments: args });
        return result;
    }

    /**
     * Get formatted tool descriptions for prompt injection.
     */
    getToolDescriptions(connections: MCPConnection[]): string {
        const lines: string[] = [];
        for (const conn of connections) {
            if (conn.tools.length === 0) continue;
            const toolList = conn.tools.map(t => `  - ${t.name}: ${t.description}`).join('\n');
            lines.push(`Server "${conn.serverId}":\n${toolList}`);
        }
        return lines.join('\n\n');
    }

    /**
     * Clean up all connections.
     */
    async dispose(): Promise<void> {
        const ids = Array.from(this.connections.keys());
        await Promise.all(ids.map(id => this.disconnect(id)));
    }
}

/** Singleton instance */
export const mcpManager = new MCPClientManager();
