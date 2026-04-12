/**
 * Tool Executor Service
 *
 * Bridges agents and MCP tools. Provides:
 *   1. Tool resolution: finds which MCP server owns a tool
 *   2. Tool execution: calls the tool and returns results
 *   3. Agentic tool loop: agent requests tools → execute → feed results back
 *   4. Event emission: notifies frontend about tool usage in real-time
 *
 * The tool loop works as a pre-generation phase:
 *   - Agent receives tool descriptions + task
 *   - Agent decides which tools to call (if any)
 *   - System executes tools, collects results
 *   - Results are injected into the code generation prompt
 */

import { MCPServer } from "../models/index.js";
import { mcpManager } from "./mcp-client.js";
import { callAIGenerate } from "./ai-generate.js";
import { extractJSON } from "./json-parser.js";
import { resolveApiKey, type UserSettings } from "./user-settings.js";

// ─── Types ──────────────────────────────────────────────────────

export interface ToolCall {
    serverName: string;
    serverId: string;
    toolName: string;
    args: Record<string, any>;
}

export interface ToolResult {
    serverName: string;
    toolName: string;
    success: boolean;
    result: any;
    error?: string;
    durationMs: number;
}

export interface ToolCallEvent {
    type: 'tool_call';
    call: {
        serverName: string;
        toolName: string;
        args: Record<string, any>;
    };
    result: {
        success: boolean;
        preview: string;
        durationMs: number;
    };
    phase: 'frontend' | 'backend' | 'orchestrator';
}

// ─── Tool Resolution ────────────────────────────────────────────

interface ResolvedTool {
    serverId: string;
    serverName: string;
    toolName: string;
    description: string;
    inputSchema: Record<string, any>;
}

/**
 * Load all available tools for a user and return them as a flat list
 * with server references for execution routing.
 */
async function resolveUserTools(userId: string, projectId?: string): Promise<ResolvedTool[]> {
    const filter: any = {
        userId,
        enabled: true,
        $or: [
            { projectId: null },
            ...(projectId ? [{ projectId }] : []),
        ],
    };

    const servers = await MCPServer.find(filter).lean();
    const tools: ResolvedTool[] = [];

    for (const server of servers) {
        const s = server as any;
        const discoveredTools = s.discoveredTools || [];
        for (const tool of discoveredTools) {
            tools.push({
                serverId: s._id.toString(),
                serverName: s.name,
                toolName: tool.name,
                description: tool.description || '',
                inputSchema: tool.inputSchema || {},
            });
        }
    }

    return tools;
}

/**
 * Execute a single tool call via MCP.
 */
async function executeTool(
    serverId: string,
    serverName: string,
    toolName: string,
    args: Record<string, any>,
): Promise<ToolResult> {
    const start = Date.now();
    try {
        // Ensure connection is active
        const serverConfig = await MCPServer.findById(serverId);
        if (!serverConfig) {
            return { serverName, toolName, success: false, result: null, error: 'Server not found', durationMs: Date.now() - start };
        }

        await mcpManager.connect(serverConfig);
        const result = await mcpManager.callTool(serverId, toolName, args);

        return {
            serverName,
            toolName,
            success: true,
            result: result?.content || result,
            durationMs: Date.now() - start,
        };
    } catch (err: any) {
        return {
            serverName,
            toolName,
            success: false,
            result: null,
            error: err.message,
            durationMs: Date.now() - start,
        };
    }
}

// ─── Tool Planning Prompt ───────────────────────────────────────

function buildToolPlanningPrompt(tools: ResolvedTool[]): string {
    const toolDescriptions = tools.map(t =>
        `- ${t.serverName}/${t.toolName}: ${t.description}\n  Input: ${JSON.stringify(t.inputSchema).slice(0, 200)}`
    ).join('\n');

    return `You have access to the following tools via MCP servers. If any would help you write better code for this task, request them now. Return ONLY valid JSON.

AVAILABLE TOOLS:
${toolDescriptions}

If you want to use tools, return:
{"toolCalls": [{"serverName": "Name", "toolName": "tool_name", "args": {"param": "value"}}]}

If no tools are needed, return:
{"toolCalls": []}

GUIDELINES:
- Use Context7 to fetch current library documentation if the task uses specific frameworks
- Use Fetch to check API endpoints or download schemas
- Use Sequential Thinking for complex multi-step architectural decisions
- Use search tools to find current best practices
- Only request tools that will meaningfully improve the generated code
- Max 5 tool calls per phase`;
}

// ─── Agentic Tool Loop ──────────────────────────────────────────

/**
 * Run the tool planning and execution loop for an agent phase.
 *
 * 1. Asks the AI which tools to call given the task
 * 2. Executes requested tools
 * 3. Returns collected results as context for code generation
 *
 * @param phase - Which agent phase is requesting tools
 * @param taskDescription - Summary of what the agent needs to do
 * @param userSettings - User's API keys and model preferences
 * @param userId - User ID for loading their MCP servers
 * @param projectId - Project ID for project-scoped servers
 * @param onToolCall - Callback for each tool call (for WebSocket events)
 */
export async function runToolLoop(
    phase: 'frontend' | 'backend' | 'orchestrator',
    taskDescription: string,
    userSettings: UserSettings,
    userId: string,
    projectId?: string,
    onToolCall?: (event: ToolCallEvent) => void,
): Promise<string> {
    // 1. Load available tools
    const tools = await resolveUserTools(userId, projectId);
    if (tools.length === 0) return '';

    // 2. Ask AI which tools to use
    const planPrompt = buildToolPlanningPrompt(tools);
    const provider = userSettings.agentModels.orchestrator.provider;
    const model = userSettings.agentModels.orchestrator.model;
    const key = resolveApiKey(provider, userSettings.apiKeys);

    let planResponse: string;
    try {
        planResponse = await callAIGenerate(
            provider, model,
            planPrompt,
            `TASK (${phase}):\n${taskDescription}`,
            2000,
            key || undefined,
        );
    } catch {
        return '';
    }

    // 3. Parse tool calls
    let planned: { toolCalls: Array<{ serverName: string; toolName: string; args: Record<string, any> }> };
    try {
        planned = extractJSON(planResponse.trim()) as any;
        if (!planned?.toolCalls || !Array.isArray(planned.toolCalls)) return '';
    } catch {
        return '';
    }

    if (planned.toolCalls.length === 0) return '';

    // 4. Execute tools (max 5, sequentially for safety)
    const results: ToolResult[] = [];
    for (const call of planned.toolCalls.slice(0, 5)) {
        // Resolve the server ID from server name
        const tool = tools.find(t =>
            t.serverName.toLowerCase() === call.serverName.toLowerCase() &&
            t.toolName === call.toolName
        );

        if (!tool) {
            results.push({
                serverName: call.serverName,
                toolName: call.toolName,
                success: false,
                result: null,
                error: `Tool ${call.serverName}/${call.toolName} not found`,
                durationMs: 0,
            });
            continue;
        }

        const result = await executeTool(tool.serverId, tool.serverName, call.toolName, call.args);
        results.push(result);

        // Emit event for frontend
        if (onToolCall) {
            const preview = result.success
                ? truncate(JSON.stringify(result.result), 500)
                : `Error: ${result.error}`;

            onToolCall({
                type: 'tool_call',
                call: { serverName: tool.serverName, toolName: call.toolName, args: call.args },
                result: { success: result.success, preview, durationMs: result.durationMs },
                phase,
            });
        }
    }

    // 5. Format results as context for code generation
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length === 0) return '';

    const contextLines = [
        `\nTOOL RESULTS (${successfulResults.length} tools executed for ${phase}):`,
    ];

    for (const r of successfulResults) {
        const resultStr = typeof r.result === 'string' ? r.result : JSON.stringify(r.result);
        contextLines.push(`\n--- ${r.serverName}/${r.toolName} ---`);
        contextLines.push(truncate(resultStr, 3000));
    }

    return contextLines.join('\n');
}

// ─── Helpers ────────────────────────────────────────────────────

function truncate(str: string, max: number): string {
    if (str.length <= max) return str;
    return str.slice(0, max) + `\n... (truncated, ${str.length - max} chars omitted)`;
}
