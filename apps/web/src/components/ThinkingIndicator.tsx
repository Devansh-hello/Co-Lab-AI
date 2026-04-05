'use client';

/**
 * Thinking Indicator
 *
 * A visually distinctive animation shown when the AI is processing/thinking.
 * Features an orbital dot animation with a gold accent glow, replacing
 * the generic "..." typing indicator with something that communicates
 * active cognitive work.
 *
 * Design: Three concentric rings with orbiting dots at different speeds,
 * gold → white opacity gradient, glass background.
 */

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface ThinkingIndicatorProps {
  agent?: string;
  message?: string;
  compact?: boolean;
}

export default function ThinkingIndicator({ agent, message, compact = false }: ThinkingIndicatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const orbit1 = useRef<HTMLDivElement>(null);
  const orbit2 = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (orbit1.current) {
      gsap.to(orbit1.current, { rotation: 360, duration: 3, repeat: -1, ease: 'none' });
    }
    if (orbit2.current) {
      gsap.to(orbit2.current, { rotation: -360, duration: 5, repeat: -1, ease: 'none' });
    }
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, []);

  if (compact) {
    return (
      <div ref={containerRef} className="inline-flex items-center gap-2 px-3 py-1.5">
        <div className="relative w-4 h-4">
          <div ref={orbit1} className="absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                 style={{ background: '#D4AF37' }} />
          </div>
          <div className="absolute inset-[2px]">
            <div ref={orbit2}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full"
                   style={{ background: 'rgba(212,175,55,0.5)' }} />
            </div>
          </div>
        </div>
        {message && (
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {message}
          </span>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef}
         className="flex items-center gap-4 px-4 py-2 rounded-lg"
         style={{
           background: 'rgba(212,175,55,0.03)',
           border: '1px solid rgba(212,175,55,0.06)',
           backdropFilter: 'blur(12px)',
         }}>
      {/* Orbital animation — 2 rings (subtle, not competing) */}
      <div className="relative w-8 h-8 shrink-0">
        {/* Center glow */}
        <div className="absolute inset-[10px] rounded-full"
             style={{
               background: 'rgba(212,175,55,0.25)',
               boxShadow: '0 0 8px rgba(212,175,55,0.15)',
             }} />

        {/* Orbit 1 — outer */}
        <div ref={orbit1} className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
               style={{ background: '#D4AF37' }} />
        </div>

        {/* Orbit 2 — inner, counter-rotating */}
        <div className="absolute inset-[6px]">
          <div ref={orbit2}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                 style={{ background: 'rgba(212,175,55,0.5)' }} />
          </div>
        </div>
      </div>

      {/* Text */}
      <div className="min-w-0">
        {agent && (
          <p className="text-xs font-mono uppercase tracking-wider mb-0.5"
             style={{ color: 'rgba(212,175,55,0.45)' }}>
            {agent}
          </p>
        )}
        <p className="text-sm truncate"
           style={{ color: 'rgba(255,255,255,0.45)' }}>
          {message || 'Processing...'}
        </p>
      </div>
    </div>
  );
}
