/**
 * Plugin Context Service
 *
 * Builds a text context block describing the user's enabled plugins.
 * This context is injected into agent prompts so they can leverage
 * the user's connected services (e.g. generate Supabase code if
 * the Supabase plugin is enabled).
 */

import { UserPlugin } from "../models/index.js";
import { getMCPToolContext } from "./mcp-tool-context.js";

/** Plugin metadata: display name and integration instructions for agents */
const PLUGIN_INFO: Record<string, { name: string; integration: string }> = {
    'supabase': {
        name: 'Supabase',
        integration: 'Use @supabase/supabase-js. Initialize with the user\'s project URL and anon key. Use Supabase Auth for authentication, Supabase Database for data, and Supabase Storage for files.',
    },
    'postgresql': {
        name: 'PostgreSQL',
        integration: 'Use pg or Prisma. Connect via the user\'s connection string. Create proper migrations and type-safe queries.',
    },
    'mongodb': {
        name: 'MongoDB',
        integration: 'Use mongoose. Connect via the user\'s connection URI. Define typed schemas with validation.',
    },
    'github': {
        name: 'GitHub',
        integration: 'The user has GitHub connected. You can reference GitHub APIs for features like OAuth login, repo creation, or webhook handling.',
    },
    'vercel': {
        name: 'Vercel',
        integration: 'User has Vercel connected. Optimize for Vercel deployment: use Next.js conventions, serverless functions, and edge runtime where appropriate.',
    },
    'cloudflare': {
        name: 'Cloudflare',
        integration: 'User has Cloudflare connected. Consider Cloudflare Workers for serverless, R2 for storage, and D1 for edge database.',
    },
    'firebase': {
        name: 'Firebase',
        integration: 'Use firebase and firebase-admin SDKs. Use Firebase Auth, Firestore, and Cloud Storage.',
    },
    'context7': {
        name: 'Context7',
        integration: 'Up-to-date library documentation is available. Use the latest API patterns and best practices.',
    },
    'playwright': {
        name: 'Playwright',
        integration: 'E2E testing is available. Consider adding test files for critical user flows.',
    },
    'exa': {
        name: 'Exa Search',
        integration: 'AI search is available for real-time data fetching. Use Exa API for search-powered features.',
    },
    'zapier': {
        name: 'Zapier',
        integration: 'Workflow automation is available. Consider webhook endpoints that Zapier can trigger.',
    },
};

/** Keywords that activate each plugin's context injection */
const PLUGIN_ACTIVATION_KEYWORDS: Record<string, string[]> = {
    'supabase': ['supabase', 'database', 'auth', 'storage', 'realtime', 'row level security', 'rls'],
    'postgresql': ['postgres', 'postgresql', 'sql', 'database', 'prisma', 'migration'],
    'mongodb': ['mongo', 'mongodb', 'mongoose', 'nosql', 'database', 'collection'],
    'github': ['github', 'git', 'repo', 'repository', 'oauth', 'webhook', 'issue', 'pull request'],
    'vercel': ['vercel', 'deploy', 'deployment', 'serverless', 'edge', 'hosting'],
    'cloudflare': ['cloudflare', 'worker', 'workers', 'r2', 'd1', 'edge', 'cdn'],
    'firebase': ['firebase', 'firestore', 'cloud function', 'fcm', 'push notification'],
    'context7': ['documentation', 'docs', 'api reference', 'library'],
    'playwright': ['test', 'testing', 'e2e', 'end-to-end', 'browser test', 'playwright'],
    'exa': ['search', 'real-time data', 'web search', 'exa'],
    'zapier': ['zapier', 'automation', 'webhook', 'workflow', 'integration'],
};

/**
 * Build a plugin context string for the given user's enabled plugins.
 * Uses conditional injection: only includes plugins relevant to the task.
 *
 * @param taskHint - Optional text (user message or task description) used to
 *                   determine which plugins are relevant. If omitted, all
 *                   enabled plugins are included (backward compatible).
 */
export async function getPluginContext(userId: string, projectId?: string, taskHint?: string): Promise<string> {
    try {
        const taskLower = taskHint?.toLowerCase() || '';

        // Legacy plugin context (hardcoded plugins) — conditionally injected
        let legacyContext = '';
        const enabledPlugins = await UserPlugin.find({ userId, enabled: true }).lean();
        if (enabledPlugins.length > 0) {
            const relevantPlugins = enabledPlugins.filter(p => {
                // If no task hint, include all (backward compatible)
                if (!taskHint) return true;
                const keywords = PLUGIN_ACTIVATION_KEYWORDS[p.pluginId] || [];
                return keywords.some(kw => taskLower.includes(kw));
            });

            if (relevantPlugins.length > 0) {
                const lines: string[] = ['ACTIVE PLUGINS (user has these services connected — leverage them):'];
                for (const p of relevantPlugins) {
                    const info = PLUGIN_INFO[p.pluginId];
                    if (info) {
                        lines.push(`- ${info.name}: ${info.integration}`);
                    }
                }
                legacyContext = '\n\n' + lines.join('\n');
            }
        }

        // MCP tool context (dynamic tool servers)
        const mcpContext = await getMCPToolContext(userId, projectId);

        return legacyContext + mcpContext;
    } catch {
        return '';
    }
}
