'use client';

import { useRef, useEffect, useState } from "react"
import gsap from "gsap"

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  className?: string;
}

const SIZES: Record<LogoSize, { icon: number; brand: number; badge: number; gap: number }> = {
  sm: { icon: 22, brand: 16, badge: 8, gap: 6 },
  md: { icon: 26, brand: 19, badge: 9, gap: 7 },
  lg: { icon: 34, brand: 26, badge: 11, gap: 9 },
};

export function LogoMark({ size = 26, color = "#E6B33E" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 6L2 16L8 26" stroke={color} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M18 6L12 16L18 26" stroke={color} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" opacity="0.45" />
      <path d="M22 6L30 26" stroke={color} strokeWidth="3" strokeLinecap="square" />
    </svg>
  );
}

export function LogoMarkAnimated({ size = 16, color = "#E6B33E" }: { size?: number; color?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (!svgRef.current) return
    const paths = svgRef.current.querySelectorAll("path")

    paths.forEach((path, i) => {
      const len = path.getTotalLength?.() || 100
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 })
      gsap.to(path, { opacity: 1, duration: 0.1, delay: i * 0.25 })
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 0.5,
        delay: i * 0.25,
        ease: "power3.out",
      })
    })

    const timeout = setTimeout(() => {
      gsap.to(paths, {
        opacity: 0,
        duration: 0.25,
        stagger: 0.05,
        onComplete: () => setCycle(c => c + 1),
      })
    }, 2200)

    return () => { clearTimeout(timeout); gsap.killTweensOf(paths) }
  }, [cycle])

  return (
    <svg ref={svgRef} width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M8 6L2 16L8 26" stroke={color} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M18 6L12 16L18 26" stroke={color} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M22 6L30 26" stroke={color} strokeWidth="3" strokeLinecap="square" />
    </svg>
  )
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const s = SIZES[size];

  return (
    <span className={`inline-flex items-center select-none ${className}`} style={{ gap: s.gap }}>
      <LogoMark size={s.icon} />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: s.brand,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            color: 'white',
            textTransform: 'uppercase' as const,
          }}
        >
          CO-LAB
        </span>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: s.badge,
            letterSpacing: '0.1em',
            color: '#0A0A0A',
            backgroundColor: '#E6B33E',
            padding: `${Math.round(s.badge * 0.3)}px ${Math.round(s.badge * 0.6)}px`,
            borderRadius: 4,
            lineHeight: 1,
            textTransform: 'uppercase' as const,
          }}
        >
          AI
        </span>
      </span>
    </span>
  );
}
