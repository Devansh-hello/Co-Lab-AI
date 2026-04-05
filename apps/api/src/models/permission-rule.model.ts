/**
 * Permission Rule Model
 *
 * Stores user-configurable rules that control what agents can do.
 * Rules can be scoped to the user level (applies to all projects)
 * or the project level (overrides user-level for that project).
 *
 * Rule resources:
 *   - agent:*           - Control which agents can run
 *   - provider:*        - Control which AI providers can be used
 *   - budget:tokens     - Max token budget per pipeline
 *   - feature:*         - Feature toggles (e.g. feedback_loop)
 */

import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema({
    /** The resource being controlled (e.g. 'agent:frontend', 'provider:openai') */
    resource: {
        type: String,
        required: true,
        enum: [
            'agent:orchestrator', 'agent:frontend', 'agent:backend',
            'agent:review', 'agent:test', 'agent:feedback',
            'provider:openai', 'provider:anthropic', 'provider:gemini',
            'provider:openrouter', 'provider:glm',
            'budget:tokens',
            'feature:feedback_loop',
        ],
    },
    /** What to do: allow (auto-approve), deny (block), prompt (ask user) */
    action: {
        type: String,
        enum: ['allow', 'deny', 'prompt'],
        default: 'allow',
    },
    /** Numeric limit (used with budget:tokens) */
    limit: { type: Number, default: null },
    /** Future extensibility (org rules, conditions, etc.) */
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const permissionRuleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    /** null = user-wide rule set; ObjectId = project-specific override */
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "project", default: null },
    scope: { type: String, enum: ['user', 'project'], default: 'user' },
    rules: [ruleSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

/** One rule set per user per project (null projectId = user-level) */
permissionRuleSchema.index(
    { userId: 1, projectId: 1 },
    { unique: true }
);

export const PermissionRule = mongoose.model("permissionRule", permissionRuleSchema);
