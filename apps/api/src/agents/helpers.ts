/**
 * Agent Helper Utilities
 *
 * Shared functions used by multiple agents:
 *   - Trajectory reduction: compress context to reduce input tokens (AgentDiet-inspired)
 *   - Plan validation: verify orchestrator output consistency
 *   - NPM lookup: check package existence
 */

// ─── Trajectory Reduction ───────────────────────────────────────
// Inspired by AgentDiet (FSE 2026): remove useless, redundant, and
// expired content from agent context to reduce input tokens by 40-60%.

/**
 * Summarize an API contract into a single compact line.
 * Used by review/test agents that don't need full endpoint details.
 */
export function buildCompactContract(apiContract: any): string {
    if (!apiContract) return '';
    const endpoints = (apiContract.endpoints || [])
        .map((e: any) => `${e.method} ${e.path}`)
        .join(', ');
    const models = Object.keys(apiContract.models || {}).join(', ');
    const auth = apiContract.auth?.scheme || 'none';
    return `Auth: ${auth} | Models: ${models} | Endpoints: ${endpoints}`;
}

/**
 * Build a numbered task list for one side (frontend/backend).
 */
export function buildMinimalTaskContext(taskFile: any, side: 'frontend' | 'backend'): string {
    const tasks = side === 'frontend' ? taskFile.frontendTasks : taskFile.backendTasks;
    if (!tasks?.length) return '';
    return tasks.map((t: any, i: number) => `${i + 1}. ${t.task}: ${t.details}`).join('\n');
}

/**
 * Select only the snapshot files relevant to the current tasks + entry points.
 * Caps at 6 files to keep context lean.
 */
export function compressSnapshotForAgent(
    snapshot: any,
    side: 'frontend' | 'backend',
    taskFile: any
): string {
    const code = side === 'frontend' ? snapshot?.frontendCode : snapshot?.backendCode;
    if (!code || typeof code !== 'object') return '';

    const tasks = side === 'frontend' ? taskFile.frontendTasks : taskFile.backendTasks;
    const taskText = (tasks || []).map((t: any) => `${t.task} ${t.details}`).join(' ').toLowerCase();

    /* Always include entry point files */
    const entryPatterns = side === 'frontend'
        ? ['app.', 'index.', 'main.']
        : ['server.', 'index.', 'app.', 'db.', '.env'];

    const relevant = Object.entries(code).filter(([name]) => {
        const lower = name.toLowerCase();
        if (entryPatterns.some(p => lower.includes(p))) return true;
        const baseName = name.split('/').pop()?.replace(/\.[^.]+$/, '').toLowerCase() || '';
        return taskText.includes(baseName);
    }).slice(0, 6);

    const codeContext = relevant.length > 0
        ? `\n\nEXISTING CODE (modify, don't rewrite):\n${JSON.stringify(Object.fromEntries(relevant), null, 2)}`
        : '';

    /* Inject project memory if available (with staleness filtering) */
    const memory = snapshot?.projectMemory;
    let memoryContext = '';
    if (memory) {
        const parts: string[] = [];
        const preferred = filterStaleItems(memory.preferredPatterns, 90);
        const rejected = filterStaleItems(memory.rejectedApproaches, 30);
        const feedback = filterStaleItems(memory.qualityFeedback, 7);

        if (preferred.length > 0) {
            parts.push('Preferred patterns: ' + preferred.join('; '));
        }
        if (rejected.length > 0) {
            parts.push('Rejected approaches (DO NOT use): ' + rejected.join('; '));
        }
        if (feedback.length > 0) {
            parts.push('Previous review findings (ensure these are fixed): ' + feedback.join('; '));
        }
        if (parts.length > 0) {
            memoryContext = '\n\nPROJECT MEMORY (decisions from previous iterations):\n' + parts.join('\n');
        }
    }

    return codeContext + memoryContext;
}

// ─── Memory Staleness ──────────────────────────────────────────
// Inspired by Vellum's staleness model: each item type has a base
// lifetime. Reinforced items (mentioned across multiple iterations)
// age slower.

/**
 * Filter memory items by staleness.
 * Items older than baseDays (extended by reinforcement) are dropped.
 * Supports both old format (plain strings) and new format (objects with timestamps).
 */
function filterStaleItems(
    items: any[] | undefined,
    baseDays: number
): string[] {
    if (!items || items.length === 0) return [];

    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    return items
        .map(item => {
            // Handle old format (plain strings) — never expire
            if (typeof item === 'string') return item;

            // Handle new format (objects with timestamps)
            const value = item.value || item;
            const createdAt = item.createdAt ? new Date(item.createdAt).getTime() : 0;
            const reinforcements = item.reinforcements || 1;

            // Effective lifetime = baseDays * sqrt(reinforcements)
            // Items reinforced 4 times last 2x as long
            const effectiveDays = baseDays * Math.sqrt(reinforcements);
            const ageMs = now - createdAt;

            if (createdAt > 0 && ageMs > effectiveDays * msPerDay) {
                return null; // Stale — drop
            }

            return typeof value === 'string' ? value : JSON.stringify(value);
        })
        .filter((v): v is string => v !== null)
        .slice(-10); // Cap at 10 most recent
}

// ─── Orchestrator Plan Validation ───────────────────────────────
// Inspired by checkpoint architecture paper (arXiv 2026): validate
// plan consistency before sending to code agents.

/**
 * Check that the orchestrator's plan is internally consistent:
 *   - Every endpoint has a corresponding task
 *   - Auth scheme has auth tasks
 *   - Both frontend and backend tasks exist if endpoints are defined
 */
export function validateOrchestratorPlan(plan: any): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const endpoints = plan.apiContract?.endpoints || [];
    const frontendTasks = plan.frontendTasks || [];
    const backendTasks = plan.backendTasks || [];
    const allTaskText = [...frontendTasks, ...backendTasks]
        .map((t: any) => `${t.task} ${t.details}`).join(' ').toLowerCase();

    /* Check: every endpoint should be referenced in at least one task */
    for (const ep of endpoints) {
        const path = (ep.path || '').toLowerCase();
        const resource = path.split('/').filter(Boolean).pop() || '';
        if (resource && !allTaskText.includes(resource) && !allTaskText.includes(path)) {
            issues.push(`Endpoint ${ep.method} ${ep.path} has no corresponding task`);
        }
    }

    /* Check: auth scheme defined but no auth tasks */
    if (plan.apiContract?.auth?.scheme && plan.apiContract.auth.scheme !== 'none') {
        const hasAuthTask = allTaskText.includes('auth') || allTaskText.includes('login') || allTaskText.includes('jwt');
        if (!hasAuthTask) {
            issues.push('Auth scheme defined but no auth-related tasks assigned');
        }
    }

    /* Check: endpoints exist but no frontend tasks to consume them */
    if (endpoints.length > 0 && frontendTasks.length === 0) {
        issues.push('API endpoints defined but no frontend tasks to consume them');
    }

    /* Check: endpoints exist but no backend tasks to implement them */
    if (endpoints.length > 0 && backendTasks.length === 0) {
        issues.push('API endpoints defined but no backend tasks to implement them');
    }

    return { valid: issues.length === 0, issues: issues.slice(0, 5) };
}

// ─── NPM Package Lookup ────────────────────────────────────────
// Lightweight tool: checks if a package exists on the npm registry.

/**
 * Look up an npm package by name. Returns basic metadata or null if not found.
 * Times out after 3 seconds to avoid blocking the pipeline.
 */
export async function npmLookup(
    packageName: string
): Promise<{ name: string; description: string; version: string } | null> {
    try {
        const res = await fetch(
            `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`,
            {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(3000),
            }
        );
        if (!res.ok) return null;
        const data = await res.json() as any;
        return { name: data.name, description: data.description || '', version: data.version || '' };
    } catch {
        return null;
    }
}
