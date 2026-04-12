'use client';

/**
 * Agent Activity Panel
 *
 * A real-time mission control view showing exactly what the AI pipeline
 * is doing at any moment: files being created, tools being called,
 * plugins/MCP servers in use, thinking states, and search operations.
 *
 * Design: Dark glass panel with gold accent timeline, staggered GSAP
 * entrance animations, and breathing pulse indicators.
 */

import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  FileCode2, Brain, Search, Wrench, Plug, Server,
  CheckCircle2, Loader2, ChevronDown, ChevronUp,
  Sparkles, GitBranch, Shield, Zap, Clock,
  FileJson, FileText, FileCog, Package
} from 'lucide-react';
import type { WebSocketState } from '../hooks/useWebSocket';

// ─── Types ──────────────────────────────────────────────────────

export interface ActivityEvent {
  id: string;
  timestamp: Date;
  type: 'thinking' | 'file_create' | 'file_update' | 'tool_call' | 'plugin_use' |
        'mcp_call' | 'search' | 'api_call' | 'validation' | 'security_check' |
        'planning' | 'reviewing' | 'testing' | 'fixing';
  agent: string;
  title: string;
  detail?: string;
  status: 'active' | 'completed' | 'error';
  meta?: Record<string, any>;
}

interface AgentActivityPanelProps {
  wsState: WebSocketState;
  activities: ActivityEvent[];
  isExpanded?: boolean;
  onToggle?: () => void;
}

// ─── File icon resolver ─────────────────────────────────────────

function getFileIcon(filename: string) {
  if (filename.endsWith('.json')) return FileJson;
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return FileCode2;
  if (filename.endsWith('.css') || filename.endsWith('.html')) return FileText;
  if (filename.endsWith('.config.ts') || filename.endsWith('.config.js')) return FileCog;
  return FileCode2;
}

// ─── Activity type config ───────────────────────────────────────

/**
 * Activity colors reduced to 4 (from 14) following the 60-30-10 rule:
 *   - Gold (#E6B33E): thinking, planning, orchestration (primary AI work)
 *   - Emerald (#10b981): file creation, validation, completion (success)
 *   - Blue (#3b82f6): external calls — tools, plugins, MCP, search, API
 *   - Red (#ef4444): security checks, errors
 */
const ACTIVITY_CONFIG: Record<ActivityEvent['type'], {
  icon: React.ElementType;
  color: string;
  glow: string;
  label: string;
}> = {
  thinking:       { icon: Brain,        color: '#E6B33E', glow: 'rgba(230,179,62,0.12)',  label: 'Thinking' },
  planning:       { icon: GitBranch,    color: '#E6B33E', glow: 'rgba(230,179,62,0.12)',  label: 'Planning' },
  reviewing:      { icon: Search,       color: '#E6B33E', glow: 'rgba(230,179,62,0.12)',  label: 'Reviewing' },
  testing:        { icon: Sparkles,     color: '#E6B33E', glow: 'rgba(230,179,62,0.12)',  label: 'Testing' },
  file_create:    { icon: FileCode2,    color: '#10b981', glow: 'rgba(16,185,129,0.12)',  label: 'Creating' },
  file_update:    { icon: FileCode2,    color: '#10b981', glow: 'rgba(16,185,129,0.12)',  label: 'Updating' },
  validation:     { icon: Shield,       color: '#10b981', glow: 'rgba(16,185,129,0.12)',  label: 'Validating' },
  fixing:         { icon: Wrench,       color: '#10b981', glow: 'rgba(16,185,129,0.12)',  label: 'Fixing' },
  tool_call:      { icon: Wrench,       color: '#3b82f6', glow: 'rgba(59,130,246,0.12)',  label: 'Tool' },
  plugin_use:     { icon: Plug,         color: '#3b82f6', glow: 'rgba(59,130,246,0.12)',  label: 'Plugin' },
  mcp_call:       { icon: Server,       color: '#3b82f6', glow: 'rgba(59,130,246,0.12)',  label: 'MCP' },
  search:         { icon: Search,       color: '#3b82f6', glow: 'rgba(59,130,246,0.12)',  label: 'Search' },
  api_call:       { icon: Zap,          color: '#3b82f6', glow: 'rgba(59,130,246,0.12)',  label: 'API' },
  security_check: { icon: Shield,       color: '#ef4444', glow: 'rgba(239,68,68,0.12)',   label: 'Security' },
};

// ─── Main Component ─────────────────────────────────────────────

export default function AgentActivityPanel({
  wsState,
  activities,
  isExpanded = true,
  onToggle,
}: AgentActivityPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(!isExpanded);

  // Auto-scroll timeline to latest event
  useEffect(() => {
    if (timelineRef.current && !collapsed) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [activities, collapsed]);

  // Entrance animation — matches --duration-slow (0.3s)
  useGSAP(() => {
    if (!panelRef.current) return;
    gsap.fromTo(panelRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out' }
    );
  }, []);

  const activeEvents = activities.filter(a => a.status === 'active');
  const completedCount = activities.filter(a => a.status === 'completed').length;

  // Extract files being created from activities
  const fileActivities = activities.filter(a =>
    a.type === 'file_create' || a.type === 'file_update'
  );

  const toggle = () => {
    setCollapsed(prev => !prev);
    onToggle?.();
  };

  if (!wsState.isGenerating && activities.length === 0) return null;

  return (
    <div
      ref={panelRef}
      className="rounded-lg border border-white/[0.06] overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)' }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/[0.03] active:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2">
          {/* Breathing pulse indicator */}
          {wsState.isGenerating && (
            <div className="relative flex items-center justify-center w-4 h-4">
              <div
                className="absolute inset-0 rounded-full animate-agent-pulse"
                style={{ background: 'rgba(230,179,62,0.3)' }}
              />
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: '#E6B33E' }}
              />
            </div>
          )}
          {!wsState.isGenerating && activities.length > 0 && (
            <CheckCircle2 size={14} className="text-emerald-400" />
          )}

          <span className="text-xs font-medium tracking-wide uppercase"
                style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-sans)' }}>
            Agent Activity
          </span>

          {/* Active count badge */}
          {activeEvents.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-xs font-mono"
                  style={{
                    background: 'rgba(230,179,62,0.1)',
                    color: '#E6B33E',
                  }}>
              {activeEvents.length} active
            </span>
          )}

          {/* Completed count */}
          {completedCount > 0 && (
            <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {completedCount} done
            </span>
          )}
        </div>

        {collapsed ? <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    : <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />}
      </button>

      {/* ── Collapsed summary bar ────────────────────────────── */}
      {collapsed && activeEvents.length > 0 && (
        <div className="px-4 pb-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {activeEvents.slice(0, 4).map(evt => {
            const config = ACTIVITY_CONFIG[evt.type];
            const Icon = config.icon;
            return (
              <div key={evt.id}
                   className="flex items-center gap-1.5 px-2 py-1 rounded shrink-0"
                   style={{ background: config.glow }}>
                <Icon size={12} style={{ color: config.color }} />
                <span className="text-xs font-mono truncate max-w-[120px]"
                      style={{ color: config.color }}>
                  {evt.title}
                </span>
              </div>
            );
          })}
          {activeEvents.length > 4 && (
            <span className="text-xs font-mono shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
              +{activeEvents.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* ── Expanded timeline ────────────────────────────────── */}
      {!collapsed && (
        <div
          ref={timelineRef}
          className="max-h-[320px] overflow-y-auto scrollbar-thin px-4 pb-3"
        >
          {/* Active status bar */}
          {wsState.currentAgent && wsState.isGenerating && (
            <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg"
                 style={{
                   background: 'rgba(230,179,62,0.04)',
                   border: '1px solid rgba(230,179,62,0.08)',
                 }}>
              <Loader2 size={13} className="animate-spin" style={{ color: '#E6B33E' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {wsState.currentAgent}
                </p>
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {wsState.currentStatus}
                  {wsState.currentModel && ` · ${wsState.currentModel}`}
                </p>
              </div>
              {wsState.tokenUsage.currentEstimate > 0 && (
                <span className="text-xs font-mono shrink-0" style={{ color: 'rgba(255,255,255,0.18)' }}>
                  ~{Math.round(wsState.tokenUsage.currentEstimate / 1000)}k tok
                </span>
              )}
            </div>
          )}

          {/* Timeline events */}
          <div className="relative">
            {/* Vertical timeline line */}
            {activities.length > 0 && (
              <div className="absolute left-[9px] top-2 bottom-2 w-px"
                   style={{ background: 'rgba(255,255,255,0.06)' }} />
            )}

            {activities.map((evt, i) => (
              <ActivityEventRow key={evt.id} event={evt} index={i} isLast={i === activities.length - 1} />
            ))}

            {activities.length === 0 && wsState.isGenerating && (
              <div className="py-6 text-center">
                <Loader2 size={16} className="animate-spin mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.2)' }} />
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Waiting for activity...
                </p>
              </div>
            )}
          </div>

          {/* File creation tracker */}
          {fileActivities.length > 0 && (
            <FileTracker files={fileActivities} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Activity Event Row ─────────────────────────────────────────

function ActivityEventRow({
  event,
  index,
  isLast,
}: {
  event: ActivityEvent;
  index: number;
  isLast: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const config = ACTIVITY_CONFIG[event.type];
  const Icon = config.icon;

  useGSAP(() => {
    if (!rowRef.current) return;
    gsap.fromTo(rowRef.current,
      { opacity: 0, x: -8 },
      { opacity: 1, x: 0, duration: 0.38, delay: Math.min(index * 0.05, 0.35), ease: 'power2.out' }
    );
  }, []);

  const isActive = event.status === 'active';
  const isError = event.status === 'error';
  const age = getRelativeTime(event.timestamp);

  return (
    <div ref={rowRef} className="relative flex items-start gap-2 py-1 group rounded hover:bg-white/[0.02] transition-colors">
      {/* Timeline dot */}
      <div className="relative z-10 mt-1.5 flex items-center justify-center w-4 h-4 shrink-0">
        {isActive ? (
          <>
            <div className="absolute inset-0 rounded-full animate-agent-pulse"
                 style={{ background: config.glow }} />
            <div className="w-2 h-2 rounded-full" style={{ background: config.color }} />
          </>
        ) : (
          <div className="w-2 h-2 rounded-full"
               style={{
                 background: isError ? '#ef4444' : config.color,
                 opacity: isError ? 1 : 0.4,
               }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon size={12}
                style={{ color: isActive ? config.color : 'rgba(255,255,255,0.3)' }}
                className={isActive ? 'animate-pulse' : ''} />

          <span className="text-xs font-medium truncate"
                style={{ color: isActive ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.45)' }}>
            {event.title}
          </span>

          {/* Agent badge */}
          <span className="text-xs font-mono uppercase tracking-wider shrink-0"
                style={{ color: 'rgba(255,255,255,0.18)' }}>
            {event.agent}
          </span>

          {/* Timestamp — revealed on hover */}
          <span className="text-xs font-mono shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'rgba(255,255,255,0.18)' }}>
            {age}
          </span>
        </div>

        {/* Detail line */}
        {event.detail && (
          <p className="mt-0.5 text-xs font-mono truncate pl-5"
             style={{ color: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.18)' }}>
            {event.detail}
          </p>
        )}
      </div>

      {/* Status indicator */}
      <div className="mt-1.5 shrink-0">
        {isActive && <Loader2 size={12} className="animate-spin" style={{ color: config.color }} />}
        {event.status === 'completed' && <CheckCircle2 size={12} style={{ color: 'rgba(255,255,255,0.18)' }} />}
        {isError && <span className="text-xs text-red-400">err</span>}
      </div>
    </div>
  );
}

// ─── File Creation Tracker ──────────────────────────────────────

function FileTracker({ files }: { files: ActivityEvent[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(containerRef.current,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out' }
    );
  }, []);

  // Group files by directory
  const grouped = files.reduce<Record<string, ActivityEvent[]>>((acc, f) => {
    const dir = f.title.includes('/') ? f.title.split('/').slice(0, -1).join('/') : '.';
    (acc[dir] ||= []).push(f);
    return acc;
  }, {});

  return (
    <div ref={containerRef} className="mt-2 pt-2 border-t border-white/[0.04]">
      <div className="flex items-center gap-2 mb-2">
        <Package size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
        <span className="text-xs font-mono uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
          Files ({files.length})
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1">
        {Object.entries(grouped).map(([dir, dirFiles]) => (
          <div key={dir}>
            {dir !== '.' && (
              <p className="text-xs font-mono mb-0.5 truncate"
                 style={{ color: 'rgba(255,255,255,0.18)' }}>
                {dir}/
              </p>
            )}
            {dirFiles.map(f => {
              const fileName = f.title.split('/').pop() || f.title;
              const FileIcon = getFileIcon(fileName);
              const isActive = f.status === 'active';
              return (
                <div key={f.id} className="flex items-center gap-1.5 py-0.5 pl-2">
                  <FileIcon size={12}
                    style={{ color: isActive ? '#10b981' : 'rgba(255,255,255,0.18)' }} />
                  <span className="text-xs font-mono truncate"
                        style={{ color: isActive ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.3)' }}>
                    {fileName}
                  </span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}
