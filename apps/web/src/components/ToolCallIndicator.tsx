'use client';

/**
 * Tool Call Indicator
 *
 * Compact inline pill that shows when a tool, plugin, or MCP server
 * is being used during pipeline execution. Designed to appear in the
 * chat message flow alongside agent status messages.
 *
 * Visual: glass pill with colored dot + label + breathing animation.
 */

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Wrench, Plug, Server, Loader2 } from 'lucide-react';

interface ToolCallIndicatorProps {
  type: 'tool' | 'plugin' | 'mcp';
  name: string;
  detail?: string;
  status?: 'active' | 'completed';
}

const TYPE_CONFIG = {
  tool:   { icon: Wrench, color: '#a855f7', label: 'Tool' },
  plugin: { icon: Plug,   color: '#f59e0b', label: 'Plugin' },
  mcp:    { icon: Server, color: '#06b6d4', label: 'MCP' },
} as const;

export default function ToolCallIndicator({ type, name, detail, status = 'active' }: ToolCallIndicatorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;
  const isActive = status === 'active';

  useGSAP(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { opacity: 0, scale: 0.95, y: 4 },
      { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'power2.out' }
    );
  }, []);

  return (
    <div
      ref={ref}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{
        background: `${config.color}08`,
        border: `1px solid ${config.color}15`,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Type badge */}
      <span className="text-xs font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: `${config.color}15`,
              color: config.color,
            }}>
        {config.label}
      </span>

      {/* Icon */}
      <Icon size={13} style={{ color: isActive ? config.color : 'rgba(255,255,255,0.3)' }} />

      {/* Name */}
      <span className="text-xs font-medium"
            style={{ color: isActive ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.3)' }}>
        {name}
      </span>

      {/* Detail (dimmed) */}
      {detail && (
        <span className="text-xs font-mono"
              style={{ color: 'rgba(255,255,255,0.18)' }}>
          {detail}
        </span>
      )}

      {/* Status */}
      {isActive && (
        <Loader2 size={12} className="animate-spin" style={{ color: config.color }} />
      )}
    </div>
  );
}
