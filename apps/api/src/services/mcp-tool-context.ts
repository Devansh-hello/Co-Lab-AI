/**
 * MCP Tool Context Service
 *
 * Builds a text context block describing tools available from the
 * user's registered MCP servers. This replaces/supplements the
 * hardcoded PLUGIN_INFO in plugin-context.ts.
 *
 * Tool descriptions are read from the cached `discoveredTools` field
 * in the MCPServer model — no live connection needed for prompt injection.
 */

import { MCPServer } from "../models/index.js";

/**
 * Build MCP tool context for a user's enabled MCP servers.
 * Returns formatted text for injection into agent prompts.
 */
export async function getMCPToolContext(userId: string, projectId?: string): Promise<string> {
    try {
        // Load user-level and project-level servers
        const filter: any = {
            userId,
            enabled: true,
            $or: [
                { projectId: null },
                ...(projectId ? [{ projectId }] : []),
            ],
        };

        const servers = await MCPServer.find(filter).lean();
        if (servers.length === 0) return '';

        const lines: string[] = [
            'AVAILABLE MCP TOOLS (user has these tool servers connected — you can reference their capabilities):',
        ];

        for (const server of servers) {
            const tools = (server as any).discoveredTools || [];
            if (tools.length === 0) {
                lines.push(`- ${(server as any).name}: (no tools discovered yet)`);
                continue;
            }

            const toolNames = tools.map((t: any) => t.name).join(', ');
            lines.push(`- ${(server as any).name} (${tools.length} tools): ${toolNames}`);

            // Include brief descriptions for each tool
            for (const tool of tools.slice(0, 10)) { // Cap at 10 tools per server for token efficiency
                if (tool.description) {
                    lines.push(`    ${tool.name}: ${tool.description}`);
                }
            }
            if (tools.length > 10) {
                lines.push(`    ... and ${tools.length - 10} more tools`);
            }
        }

        return '\n\n' + lines.join('\n');
    } catch {
        return '';
    }
}
