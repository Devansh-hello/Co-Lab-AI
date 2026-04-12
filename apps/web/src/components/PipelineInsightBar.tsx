'use client';

/**
 * Pipeline Insight Bar
 *
 * A compact, always-visible bar shown during pipeline execution.
 * Displays: current agent, active model/provider, token count,
 * elapsed time, and a segmented progress visualization.
 *
 * Design: Thin glass strip with segmented progress dots that
 * fill from left to right as pipeline phases complete.
 * Gold accent for active phase, dim for upcoming, emerald for done.
 */

import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Loader2, Cpu, Clock, Coins } from 'lucide-react';
import type { WebSocketState, FlowStage } from '../hooks/useWebSocket';

interface PipelineInsightBarProps {
  wsState: WebSocketState;
}

// ─── Phase definitions ──────────────────────────────────────────

const PHASES = [
  { key: 'understanding',  label: 'Understand', short: 'U' },
  { key: 'planning',       label: 'Plan',       short: 'P' },
  { key: 'generating',     label: 'Build',      short: 'B' },
  { key: 'reviewing',      label: 'Review',     short: 'R' },
  { key: 'testing',        label: 'Test',       short: 'T' },
] as const;

function getPhaseIndex(stage: FlowStage): number {
  switch (stage) {
    case 'understanding':
    case 'waiting_understanding':
    case 'qa':
      return 0;
    case 'planning':
    case 'waiting_plan_review':
      return 1;
    case 'generating':
      return 2;
    case 'reviewing':
      return 3;
    case 'testing':
    case 'feedback':
      return 4;
    case 'completed':
      return 5;
    default:
      return -1;
  }
}

// ─── Main Component ─────────────────────────────────────────────

export default function PipelineInsightBar({ wsState }: PipelineInsightBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  // Track elapsed time
  useEffect(() => {
    if (wsState.isGenerating) {
      if (!startRef.current) startRef.current = Date.now();
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current!) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      startRef.current = null;
      setElapsed(0);
    }
  }, [wsState.isGenerating]);

  // Entrance animation
  useGSAP(() => {
    if (!barRef.current || !wsState.isGenerating) return;
    gsap.fromTo(barRef.current,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
    );
  }, [wsState.isGenerating]);

  if (!wsState.isGenerating && wsState.flowStage === 'idle') return null;

  const phaseIndex = getPhaseIndex(wsState.flowStage);
  const totalTokens = Object.values(wsState.tokenUsage)
    .filter((v): v is number => typeof v === 'number')
    .reduce((a, b) => a + b, 0);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div
      ref={barRef}
      className="flex items-center gap-4 px-4 py-2 rounded-lg mx-4 mt-2"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Phase progress dots — 24px on 8px grid */}
      <div className="flex items-center gap-1">
        {PHASES.map((phase, i) => {
          const isDone = i < phaseIndex;
          const isActive = i === phaseIndex;

          return (
            <div key={phase.key} className="flex items-center gap-1">
              <div
                className="relative flex items-center justify-center"
                title={phase.label}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold
                    ${isActive ? 'animate-agent-pulse' : ''}`}
                  style={{
                    background: isDone ? 'rgba(16,185,129,0.15)'
                      : isActive ? 'rgba(230,179,62,0.15)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isDone ? 'rgba(16,185,129,0.3)' : isActive ? 'rgba(230,179,62,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    color: isDone ? '#10b981'
                      : isActive ? '#E6B33E'
                      : 'rgba(255,255,255,0.18)',
                  }}
                >
                  {phase.short}
                </div>
              </div>
              {/* Connector line */}
              {i < PHASES.length - 1 && (
                <div className="w-4 h-px"
                     style={{
                       background: isDone ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)',
                     }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Active agent + model */}
      {wsState.currentAgent && (
        <div className="flex items-center gap-2 min-w-0">
          <Loader2 size={12} className="animate-spin shrink-0" style={{ color: '#E6B33E' }} />
          <span className="text-xs font-medium truncate"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
            {wsState.currentAgent}
          </span>
          {wsState.currentModel && (
            <span className="flex items-center gap-1 text-xs font-mono shrink-0"
                  style={{ color: 'rgba(255,255,255,0.18)' }}>
              <Cpu size={10} />
              {wsState.currentModel.split('/').pop()}
            </span>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Metrics */}
      <div className="flex items-center gap-4 shrink-0">
        {totalTokens > 0 && (
          <span className="flex items-center gap-1 text-xs font-mono"
                style={{ color: 'rgba(255,255,255,0.18)' }}>
            <Coins size={12} />
            {totalTokens > 1000 ? `${Math.round(totalTokens / 1000)}k` : totalTokens}
          </span>
        )}
        {elapsed > 0 && (
          <span className="flex items-center gap-1 text-xs font-mono"
                style={{ color: 'rgba(255,255,255,0.18)' }}>
            <Clock size={12} />
            {formatTime(elapsed)}
          </span>
        )}
      </div>
    </div>
  );
}
