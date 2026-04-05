/**
 * Context Budget Service
 *
 * Pre-flight token estimation and progressive context trimming.
 * Inspired by Vellum's 4-tier context overflow recovery:
 *   Tier 1: Reduce snapshot files (6 → 3)
 *   Tier 2: Compress API contract to compact format
 *   Tier 3: Drop plugin/MCP context
 *   Tier 4: Truncate conversation history
 *
 * Prevents silent failures when agent prompts exceed model context windows.
 */

// ─── Token Estimation ───────────────────────────────────────────

/** Rough token estimate: ~4 chars per token for English text/code */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/** Known context window sizes by model pattern */
const MODEL_CONTEXT_LIMITS: Record<string, number> = {
    'gpt-4': 128_000,
    'gpt-4o': 128_000,
    'gpt-5': 128_000,
    'claude': 200_000,
    'gemini': 1_000_000,
    'glm': 128_000,
    'llama': 128_000,
    'deepseek': 64_000,
    'default': 64_000,
};

/** Get the context limit for a model (conservative estimate) */
export function getContextLimit(model: string): number {
    const lower = model.toLowerCase();
    for (const [pattern, limit] of Object.entries(MODEL_CONTEXT_LIMITS)) {
        if (lower.includes(pattern)) return limit;
    }
    return MODEL_CONTEXT_LIMITS.default!;
}

// ─── Budget Target ──────────────────────────────────────────────

/**
 * Budget target: use at most 60% of context for input prompt,
 * leaving 40% for the model's output generation.
 */
const INPUT_BUDGET_RATIO = 0.6;

// ─── Context Trimming ───────────────────────────────────────────

export interface ContextComponents {
    systemPrompt: string;
    userPrompt: string;
    snapshotContext: string;
    apiContract: string;
    pluginContext: string;
    conversationHistory: string;
}

export interface TrimResult {
    components: ContextComponents;
    estimatedTokens: number;
    budgetLimit: number;
    tiersApplied: number[];
}

/**
 * Progressively trim context to fit within the model's budget.
 * Returns trimmed components and which tiers were applied.
 */
export function trimToFitBudget(
    components: ContextComponents,
    model: string,
    maxOutputTokens: number = 16000
): TrimResult {
    const contextLimit = getContextLimit(model);
    const budgetLimit = Math.floor(contextLimit * INPUT_BUDGET_RATIO);
    const tiersApplied: number[] = [];

    let current = { ...components };
    let tokens = totalTokens(current);

    // Already fits — no trimming needed
    if (tokens <= budgetLimit) {
        return { components: current, estimatedTokens: tokens, budgetLimit, tiersApplied };
    }

    // ── Tier 1: Reduce snapshot context ─────────────────────
    if (current.snapshotContext.length > 0) {
        tiersApplied.push(1);
        // Keep only first 3 files worth of context (roughly halve it)
        const lines = current.snapshotContext.split('\n');
        const fileStarts = lines.reduce<number[]>((acc, line, i) => {
            if (line.match(/^\s*"[^"]+\.(ts|tsx|js|jsx|css|json|html)/)) acc.push(i);
            return acc;
        }, []);

        if (fileStarts.length > 3) {
            // Truncate to 3rd file entry
            current.snapshotContext = lines.slice(0, fileStarts[3]).join('\n') + '\n  ...(truncated)"\n}';
        }

        tokens = totalTokens(current);
        if (tokens <= budgetLimit) {
            return { components: current, estimatedTokens: tokens, budgetLimit, tiersApplied };
        }
    }

    // ── Tier 2: Compress API contract ───────────────────────
    if (current.apiContract.length > 2000) {
        tiersApplied.push(2);
        // Replace full JSON contract with compact single-line format
        try {
            const parsed = JSON.parse(current.apiContract.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
            const endpoints = (parsed.endpoints || [])
                .map((e: any) => `${e.method} ${e.path}`)
                .join(', ');
            const models = Object.keys(parsed.models || {}).join(', ');
            const auth = parsed.auth?.scheme || 'none';
            current.apiContract = `\n\nAPI CONTRACT (compact): Auth: ${auth} | Models: ${models} | Endpoints: ${endpoints}`;
        } catch {
            // If parse fails, just truncate
            current.apiContract = current.apiContract.slice(0, 1000) + '\n...(truncated)';
        }

        tokens = totalTokens(current);
        if (tokens <= budgetLimit) {
            return { components: current, estimatedTokens: tokens, budgetLimit, tiersApplied };
        }
    }

    // ── Tier 3: Drop plugin/MCP context ─────────────────────
    if (current.pluginContext.length > 0) {
        tiersApplied.push(3);
        current.pluginContext = '';

        tokens = totalTokens(current);
        if (tokens <= budgetLimit) {
            return { components: current, estimatedTokens: tokens, budgetLimit, tiersApplied };
        }
    }

    // ── Tier 4: Truncate conversation history ───────────────
    if (current.conversationHistory.length > 0) {
        tiersApplied.push(4);
        // Keep only the last message
        const messages = current.conversationHistory.split('\n').filter(l => l.startsWith('1.') || l.startsWith('2.') || l.startsWith('3.'));
        current.conversationHistory = messages.length > 0
            ? messages[messages.length - 1]!
            : '';

        tokens = totalTokens(current);
        if (tokens <= budgetLimit) {
            return { components: current, estimatedTokens: tokens, budgetLimit, tiersApplied };
        }
    }

    // ── Last resort: hard truncate snapshot ──────────────────
    if (current.snapshotContext.length > 500) {
        current.snapshotContext = current.snapshotContext.slice(0, 500) + '\n...(truncated)';
    }

    tokens = totalTokens(current);
    return { components: current, estimatedTokens: tokens, budgetLimit, tiersApplied };
}

function totalTokens(c: ContextComponents): number {
    return estimateTokens(c.systemPrompt + c.userPrompt + c.snapshotContext + c.apiContract + c.pluginContext + c.conversationHistory);
}
