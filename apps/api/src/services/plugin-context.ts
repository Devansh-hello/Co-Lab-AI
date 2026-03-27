/**
 * Plugin Context Service
 *
 * Builds a text context block describing the user's enabled plugins.
 * This context is injected into agent prompts so they can leverage
 * the user's connected services (e.g. generate Supabase code if
 * the Supabase plugin is enabled).
 */

import { UserPlugin } from "../models/index.js";

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

/**
 * Build a plugin context string for the given user's enabled plugins.
 * Returns an empty string if no plugins are enabled.
 */
export async function getPluginContext(userId: string): Promise<string> {
    try {
        const enabledPlugins = await UserPlugin.find({ userId, enabled: true }).lean();
        if (enabledPlugins.length === 0) return '';

        const lines: string[] = ['ACTIVE PLUGINS (user has these services connected — leverage them):'];
        for (const p of enabledPlugins) {
            const info = PLUGIN_INFO[p.pluginId];
            if (info) {
                lines.push(`- ${info.name}: ${info.integration}`);
            }
        }
        return '\n\n' + lines.join('\n');
    } catch {
        return '';
    }
}
