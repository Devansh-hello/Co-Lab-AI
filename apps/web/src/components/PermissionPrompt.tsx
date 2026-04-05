/**
 * Permission Prompt
 *
 * Inline card displayed when the pipeline pauses to ask the user
 * for permission before running an agent or using a provider.
 * Shows the resource being requested and Allow/Deny/Always buttons.
 */

'use client';

import type { PendingPermission } from '../hooks/useWebSocket';

interface PermissionPromptProps {
  permission: PendingPermission;
  onRespond: (requestId: string, decision: 'allow' | 'deny' | 'allow_always') => void;
}

const RESOURCE_LABELS: Record<string, string> = {
  'agent:orchestrator': 'Orchestrator Agent',
  'agent:frontend': 'Frontend Agent',
  'agent:backend': 'Backend Agent',
  'agent:review': 'Review Agent',
  'agent:test': 'Test Agent',
  'agent:feedback': 'Feedback Agent',
  'provider:openai': 'OpenAI',
  'provider:anthropic': 'Anthropic',
  'provider:gemini': 'Google Gemini',
  'provider:openrouter': 'OpenRouter',
  'provider:glm': 'GLM (ZhipuAI)',
};

export default function PermissionPrompt({ permission, onRespond }: PermissionPromptProps) {
  const label = RESOURCE_LABELS[permission.resource] || permission.resource;

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L1 14h14L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M8 6v3M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-white/90">Permission Required</h3>
      </div>

      <p className="mb-1 text-xs text-white/50 uppercase tracking-wider font-mono">
        {label}
      </p>
      <p className="mb-4 text-sm text-white/70">
        {permission.message}
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => onRespond(permission.requestId, 'allow')}
          className="flex-1 rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30"
        >
          Allow Once
        </button>
        <button
          onClick={() => onRespond(permission.requestId, 'allow_always')}
          className="flex-1 rounded-lg bg-blue-500/20 px-3 py-2 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/30"
        >
          Always Allow
        </button>
        <button
          onClick={() => onRespond(permission.requestId, 'deny')}
          className="flex-1 rounded-lg bg-red-500/20 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30"
        >
          Deny
        </button>
      </div>
    </div>
  );
}
