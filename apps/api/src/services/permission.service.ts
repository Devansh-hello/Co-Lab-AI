/**
 * Permission Service
 *
 * Evaluates permission rules for pipeline operations. Supports
 * user-level and project-level rules with project overriding user.
 *
 * Default rules: all agents/providers allowed, feedback loop on,
 * 500k token budget. Created lazily on first pipeline run.
 */

import { PermissionRule } from "../models/index.js";

// ─── Types ──────────────────────────────────────────────────────

export interface PermissionCheck {
    allowed: boolean;
    action: 'allow' | 'deny' | 'prompt';
    limit?: number;
}

interface Rule {
    resource: string;
    action: 'allow' | 'deny' | 'prompt';
    limit?: number | null;
    metadata?: any;
}

// ─── Default Rules ──────────────────────────────────────────────

const DEFAULT_RULES: Rule[] = [
    { resource: 'agent:orchestrator', action: 'allow' },
    { resource: 'agent:frontend', action: 'allow' },
    { resource: 'agent:backend', action: 'allow' },
    { resource: 'agent:review', action: 'allow' },
    { resource: 'agent:test', action: 'allow' },
    { resource: 'agent:feedback', action: 'allow' },
    { resource: 'provider:openai', action: 'allow' },
    { resource: 'provider:anthropic', action: 'allow' },
    { resource: 'provider:gemini', action: 'allow' },
    { resource: 'provider:openrouter', action: 'allow' },
    { resource: 'provider:glm', action: 'allow' },
    { resource: 'budget:tokens', action: 'allow', limit: 500_000 },
    { resource: 'feature:feedback_loop', action: 'allow' },
];

// ─── Core Functions ─────────────────────────────────────────────

/**
 * Create default permission rules for a user if none exist.
 */
export async function ensureDefaultRules(userId: string): Promise<void> {
    const existing = await PermissionRule.findOne({ userId, projectId: null });
    if (existing) return;

    await PermissionRule.create({
        userId,
        projectId: null,
        scope: 'user',
        rules: DEFAULT_RULES,
    });
}

/**
 * Get the effective rules for a user+project combination.
 * Project rules override user rules for the same resource.
 */
export async function getEffectiveRules(userId: string, projectId?: string): Promise<Rule[]> {
    const [userRuleSet, projectRuleSet] = await Promise.all([
        PermissionRule.findOne({ userId, projectId: null }).lean(),
        projectId ? PermissionRule.findOne({ userId, projectId }).lean() : null,
    ]);

    const userRules: Rule[] = (userRuleSet as any)?.rules || DEFAULT_RULES;
    const projectRules: Rule[] = (projectRuleSet as any)?.rules || [];

    // Build a map — project rules override user rules
    const ruleMap = new Map<string, Rule>();
    for (const rule of userRules) {
        ruleMap.set(rule.resource, rule);
    }
    for (const rule of projectRules) {
        ruleMap.set(rule.resource, rule);
    }

    return Array.from(ruleMap.values());
}

/**
 * Check permission for a specific resource.
 */
export function checkPermission(rules: Rule[], resource: string): PermissionCheck {
    const rule = rules.find(r => r.resource === resource);
    if (!rule) {
        // No rule = default allow
        return { allowed: true, action: 'allow' };
    }
    return {
        allowed: rule.action === 'allow',
        action: rule.action,
        ...(rule.limit != null && { limit: rule.limit }),
    };
}

/**
 * Check if a specific agent is allowed to run.
 */
export async function checkAgentPermission(
    userId: string,
    projectId: string,
    agentName: string,
): Promise<PermissionCheck> {
    const rules = await getEffectiveRules(userId, projectId);
    const resource = `agent:${agentName.toLowerCase().replace(' agent', '')}`;
    return checkPermission(rules, resource);
}

/**
 * Check if a specific AI provider is allowed.
 */
export async function checkProviderPermission(
    userId: string,
    projectId: string,
    providerName: string,
): Promise<PermissionCheck> {
    const rules = await getEffectiveRules(userId, projectId);
    return checkPermission(rules, `provider:${providerName}`);
}

/**
 * Check token budget.
 */
export async function checkTokenBudget(
    userId: string,
    projectId: string,
): Promise<{ allowed: boolean; limit: number }> {
    const rules = await getEffectiveRules(userId, projectId);
    const check = checkPermission(rules, 'budget:tokens');
    return {
        allowed: check.allowed,
        limit: check.limit ?? 500_000,
    };
}

/**
 * Check if the feedback loop feature is allowed.
 */
export async function checkFeedbackLoop(
    userId: string,
    projectId: string,
): Promise<PermissionCheck> {
    const rules = await getEffectiveRules(userId, projectId);
    return checkPermission(rules, 'feature:feedback_loop');
}

/**
 * Update a specific rule's action (used by "allow_always" from permission prompts).
 */
export async function updatePermissionRule(
    userId: string,
    projectId: string | undefined,
    resource: string,
    action: 'allow' | 'deny' | 'prompt',
): Promise<void> {
    const scope = projectId ? 'project' : 'user';
    const filter = { userId, projectId: projectId || null };

    const doc = await PermissionRule.findOne(filter);
    if (!doc) {
        // Create with just this rule
        await PermissionRule.create({
            ...filter,
            scope,
            rules: [{ resource, action }],
        });
        return;
    }

    // Update existing rule or add new one
    const rules = (doc as any).rules || [];
    const idx = rules.findIndex((r: any) => r.resource === resource);
    if (idx >= 0) {
        rules[idx].action = action;
    } else {
        rules.push({ resource, action });
    }

    (doc as any).rules = rules;
    (doc as any).updatedAt = new Date();
    await doc.save();
}
