"use client"

import { useRef, useEffect, useState } from "react"
import gsap from "gsap"

// ── Animated Logo Mark ──────────────────────────────────────
function AnimatedLogoMark({ size = 64, color = "#E6B33E" }: { size?: number; color?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const paths = svgRef.current.querySelectorAll("path")

    paths.forEach((path, i) => {
      const len = path.getTotalLength?.() || 100
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 0.8,
        delay: i * 0.15,
        ease: "power2.out",
      })
    })

    gsap.to(svgRef.current, {
      opacity: 0.5,
      scale: 0.95,
      duration: 1.2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: 1,
    })

    return () => { gsap.killTweensOf(svgRef.current); gsap.killTweensOf(paths) }
  }, [])

  return (
    <svg ref={svgRef} width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M8 6L2 16L8 26" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M18 6L12 16L18 26" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" opacity="0.45" />
      <path d="M22 6L30 26" stroke={color} strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  )
}

// ── Spin variant ──────────────────────────────────────────
function SpinLogoMark({ size = 64, color = "#E6B33E" }: { size?: number; color?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    gsap.to(svgRef.current, {
      rotation: 360,
      duration: 3,
      ease: "none",
      repeat: -1,
      transformOrigin: "center center",
    })
    return () => { gsap.killTweensOf(svgRef.current) }
  }, [])

  return (
    <svg ref={svgRef} width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M8 6L2 16L8 26" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M18 6L12 16L18 26" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" opacity="0.45" />
      <path d="M22 6L30 26" stroke={color} strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  )
}

// ── Stagger draw variant ──────────────────────────────────
function StaggerDrawLogo({ size = 64, color = "#E6B33E" }: { size?: number; color?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (!svgRef.current) return
    const paths = svgRef.current.querySelectorAll("path")

    const animate = () => {
      paths.forEach((path, i) => {
        const len = path.getTotalLength?.() || 100
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 })
        gsap.to(path, { opacity: 1, duration: 0.1, delay: i * 0.3 })
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 0.6,
          delay: i * 0.3,
          ease: "power3.out",
        })
      })

      // After drawing, hold, then fade out and restart
      gsap.delayedCall(2.5, () => {
        gsap.to(paths, {
          opacity: 0,
          duration: 0.3,
          stagger: 0.05,
          onComplete: () => setKey(k => k + 1),
        })
      })
    }

    animate()
    return () => { gsap.killTweensOf(paths) }
  }, [key])

  return (
    <svg ref={svgRef} width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M8 6L2 16L8 26" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M18 6L12 16L18 26" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M22 6L30 26" stroke={color} strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  )
}

// ── Glitch variant ──────────────────────────────────────
function GlitchLogoMark({ size = 64, color = "#E6B33E" }: { size?: number; color?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const paths = svgRef.current.querySelectorAll("path")

    const glitch = () => {
      paths.forEach((path) => {
        gsap.to(path, {
          x: (Math.random() - 0.5) * 3,
          y: (Math.random() - 0.5) * 2,
          duration: 0.05,
          ease: "none",
        })
      })
      gsap.delayedCall(0.05, () => {
        paths.forEach((path) => {
          gsap.to(path, { x: 0, y: 0, duration: 0.1 })
        })
      })
    }

    const interval = setInterval(() => {
      if (Math.random() > 0.6) glitch()
    }, 800)

    return () => { clearInterval(interval); gsap.killTweensOf(paths) }
  }, [])

  return (
    <svg ref={svgRef} width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M8 6L2 16L8 26" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M18 6L12 16L18 26" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" opacity="0.45" />
      <path d="M22 6L30 26" stroke={color} strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  )
}

// ── Bounce variant ──────────────────────────────────────
function BounceLogoMark({ size = 64, color = "#E6B33E" }: { size?: number; color?: string }) {
  const p1 = useRef<SVGPathElement>(null)
  const p2 = useRef<SVGPathElement>(null)
  const p3 = useRef<SVGPathElement>(null)

  useEffect(() => {
    const paths = [p1.current, p2.current, p3.current].filter(Boolean)
    paths.forEach((path, i) => {
      gsap.to(path, {
        y: -3,
        duration: 0.4,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true,
        delay: i * 0.15,
      })
    })
    return () => { paths.forEach(p => gsap.killTweensOf(p)) }
  }, [])

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path ref={p1} d="M8 6L2 16L8 26" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
      <path ref={p2} d="M18 6L12 16L18 26" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" opacity="0.45" />
      <path ref={p3} d="M22 6L30 26" stroke={color} strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  )
}

function LogoMark({ size = 28, color = "#E6B33E" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M8 6L2 16L8 26" stroke={color} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M18 6L12 16L18 26" stroke={color} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" opacity="0.45" />
      <path d="M22 6L30 26" stroke={color} strokeWidth="3" strokeLinecap="square" />
    </svg>
  )
}

function LogoMark2({ size = 28, color = "#E6B33E" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Hexagonal C shape */}
      <path d="M20 4L8 4L2 16L8 28L20 28" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
      {/* Inner dot */}
      <circle cx="18" cy="16" r="3" fill={color} />
    </svg>
  )
}

function LogoMark3({ size = 28, color = "#E6B33E" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Stacked layers — represents collaboration */}
      <rect x="4" y="6" width="18" height="12" rx="1" stroke={color} strokeWidth="2" opacity="0.3" />
      <rect x="10" y="14" width="18" height="12" rx="1" stroke={color} strokeWidth="2" />
    </svg>
  )
}

function LogoMark4({ size = 28, color = "#E6B33E" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Abstract C+L monogram */}
      <path d="M22 6H10L4 16L10 26H16" stroke={color} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M22 26V6" stroke={color} strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  )
}

function LogoMark5({ size = 28, color = "#E6B33E" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Neural network / connected nodes */}
      <circle cx="6" cy="8" r="2.5" fill={color} opacity="0.5" />
      <circle cx="6" cy="24" r="2.5" fill={color} opacity="0.5" />
      <circle cx="16" cy="16" r="3" fill={color} />
      <circle cx="26" cy="8" r="2.5" fill={color} opacity="0.5" />
      <circle cx="26" cy="24" r="2.5" fill={color} opacity="0.5" />
      <line x1="6" y1="8" x2="16" y2="16" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <line x1="6" y1="24" x2="16" y2="16" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <line x1="16" y1="16" x2="26" y2="8" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <line x1="16" y1="16" x2="26" y2="24" stroke={color} strokeWidth="1.5" opacity="0.3" />
    </svg>
  )
}

function LogoMark6({ size = 28, color = "#E6B33E" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Diamond / gem shape */}
      <path d="M16 2L30 16L16 30L2 16Z" stroke={color} strokeWidth="2" strokeLinejoin="miter" />
      <path d="M16 8L24 16L16 24L8 16Z" fill={color} opacity="0.2" />
    </svg>
  )
}

const GOLD = "#E6B33E"

const variants = [
  {
    id: "v1-geometric",
    label: "Geometric Uppercase",
    description: "Sharp, angular — inspired by Anthropic",
    mark: LogoMark,
    render: () => (
      <span className="inline-flex items-center gap-2">
        <LogoMark size={32} />
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 22, letterSpacing: "-0.05em", color: GOLD, textTransform: "uppercase" as const }}>
          CO-LAB
        </span>
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 600, fontSize: 13, letterSpacing: "0.08em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" as const }}>
          AI
        </span>
      </span>
    ),
  },
  {
    id: "v1b-geometric-tight",
    label: "Geometric Tight",
    description: "Same mark — tighter spacing, bolder weight, no gap",
    mark: LogoMark,
    render: () => (
      <span className="inline-flex items-center gap-1.5">
        <LogoMark size={28} />
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 900, fontSize: 20, letterSpacing: "-0.07em", color: GOLD, textTransform: "uppercase" as const }}>
          COLAB
        </span>
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 500, fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.20)", textTransform: "uppercase" as const, marginTop: -6, alignSelf: "flex-start" as const }}>
          AI
        </span>
      </span>
    ),
  },
  {
    id: "v1c-geometric-inter",
    label: "Geometric + Inter",
    description: "Same mark — Inter font, medium weight, wider tracking",
    mark: LogoMark,
    render: () => (
      <span className="inline-flex items-center gap-2">
        <LogoMark size={30} />
        <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 19, letterSpacing: "0.02em", color: GOLD, textTransform: "uppercase" as const }}>
          CO-LAB
        </span>
        <span style={{ fontFamily: "'Inter'", fontWeight: 400, fontSize: 11, letterSpacing: "0.12em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" as const }}>
          AI
        </span>
      </span>
    ),
  },
  {
    id: "v1d-geometric-manrope",
    label: "Geometric + Manrope",
    description: "Same mark — Manrope, rounded terminals, softer tech",
    mark: LogoMark,
    render: () => (
      <span className="inline-flex items-center gap-2">
        <LogoMark size={30} />
        <span style={{ fontFamily: "'Manrope'", fontWeight: 800, fontSize: 21, letterSpacing: "-0.04em", color: GOLD, textTransform: "uppercase" as const }}>
          CO-LAB
        </span>
        <span style={{ fontFamily: "'Manrope'", fontWeight: 600, fontSize: 12, letterSpacing: "0.06em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" as const }}>
          AI
        </span>
      </span>
    ),
  },
  {
    id: "v1e-geometric-mono",
    label: "Geometric + JetBrains Mono",
    description: "Same mark — monospace font, dev tool energy",
    mark: LogoMark,
    render: () => (
      <span className="inline-flex items-center gap-2.5">
        <LogoMark size={28} />
        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: 18, letterSpacing: "0em", color: GOLD, textTransform: "uppercase" as const }}>
          CO-LAB
        </span>
        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 400, fontSize: 11, letterSpacing: "0.08em", color: "rgba(255,255,255,0.18)", textTransform: "uppercase" as const }}>
          AI
        </span>
      </span>
    ),
  },
  {
    id: "v1f-geometric-lowercase",
    label: "Geometric Lowercase",
    description: "Same mark — lowercase, friendlier but still sharp",
    mark: LogoMark,
    render: () => (
      <span className="inline-flex items-center gap-2">
        <LogoMark size={28} />
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em", color: GOLD }}>
          co-lab
        </span>
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 500, fontSize: 13, letterSpacing: "0.06em", color: "rgba(255,255,255,0.18)" }}>
          ai
        </span>
      </span>
    ),
  },
  {
    id: "v1g-geometric-split",
    label: "Geometric Split Color",
    description: "Same mark — 'co' in white, 'lab' in gold",
    mark: LogoMark,
    render: () => (
      <span className="inline-flex items-center gap-2">
        <LogoMark size={30} />
        <span>
          <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 22, letterSpacing: "-0.05em", color: "rgba(255,255,255,0.85)", textTransform: "uppercase" as const }}>CO-</span>
          <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 22, letterSpacing: "-0.05em", color: GOLD, textTransform: "uppercase" as const }}>LAB</span>
        </span>
        <span style={{ fontFamily: "'Inter'", fontWeight: 500, fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.15)", textTransform: "uppercase" as const, border: "1px solid rgba(255,255,255,0.08)", padding: "2px 5px", borderRadius: 3 }}>
          AI
        </span>
      </span>
    ),
  },
  {
    id: "v1h-geometric-badge",
    label: "Geometric + Gold Badge",
    description: "Same mark — AI inside a gold pill badge",
    mark: LogoMark,
    render: () => (
      <span className="inline-flex items-center gap-2">
        <LogoMark size={28} />
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 20, letterSpacing: "-0.05em", color: "white", textTransform: "uppercase" as const }}>
          CO-LAB
        </span>
        <span style={{ fontFamily: "'Inter'", fontWeight: 700, fontSize: 9, letterSpacing: "0.1em", color: "#0A0A0A", backgroundColor: GOLD, padding: "3px 6px", borderRadius: 4, textTransform: "uppercase" as const }}>
          AI
        </span>
      </span>
    ),
  },
  {
    id: "v2-mono-brutal",
    label: "Monospace Brutal",
    description: "Terminal / hacker aesthetic — raw and technical",
    mark: LogoMark,
    render: () => (
      <span className="inline-flex items-center gap-2.5">
        <LogoMark size={28} />
        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", color: GOLD }}>
          co-lab
        </span>
        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 500, fontSize: 12, letterSpacing: "0.1em", color: "rgba(255,255,255,0.20)" }}>
          .ai
        </span>
      </span>
    ),
  },
  {
    id: "v3-hex-clean",
    label: "Hexagonal Clean",
    description: "Geometric mark + clean sans — modern SaaS",
    mark: LogoMark2,
    render: () => (
      <span className="inline-flex items-center gap-2">
        <LogoMark2 size={30} />
        <span style={{ fontFamily: "'Manrope'", fontWeight: 800, fontSize: 21, letterSpacing: "-0.03em", color: "white" }}>
          co-lab
        </span>
        <span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 21, letterSpacing: "-0.03em", color: GOLD }}>
          AI
        </span>
      </span>
    ),
  },
  {
    id: "v4-stacked",
    label: "Stacked Layers",
    description: "Overlapping shapes — collaboration concept",
    mark: LogoMark3,
    render: () => (
      <span className="inline-flex items-center gap-2">
        <LogoMark3 size={28} />
        <span>
          <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 700, fontSize: 20, letterSpacing: "-0.04em", color: GOLD }}>
            CoLab
          </span>
          <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 400, fontSize: 20, letterSpacing: "-0.04em", color: "rgba(255,255,255,0.35)" }}>
            {" "}AI
          </span>
        </span>
      </span>
    ),
  },
  {
    id: "v5-monogram",
    label: "CL Monogram",
    description: "Abstract C+L letterform — minimal and bold",
    mark: LogoMark4,
    render: () => (
      <span className="inline-flex items-center gap-2.5">
        <LogoMark4 size={30} />
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 20, letterSpacing: "-0.06em", color: "white", textTransform: "uppercase" as const }}>
          Co-Lab
        </span>
        <span style={{ fontFamily: "'Inter'", fontWeight: 500, fontSize: 11, letterSpacing: "0.12em", color: GOLD, textTransform: "uppercase" as const, border: `1px solid ${GOLD}40`, padding: "2px 6px", borderRadius: 3 }}>
          AI
        </span>
      </span>
    ),
  },
  {
    id: "v6-neural",
    label: "Neural Network",
    description: "Connected nodes — AI/ML concept",
    mark: LogoMark5,
    render: () => (
      <span className="inline-flex items-center gap-2">
        <LogoMark5 size={32} />
        <span style={{ fontFamily: "'Manrope'", fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em", color: GOLD }}>
          co-lab
        </span>
        <span style={{ fontFamily: "'Manrope'", fontWeight: 300, fontSize: 22, letterSpacing: "-0.04em", color: "rgba(255,255,255,0.20)" }}>
          ai
        </span>
      </span>
    ),
  },
  {
    id: "v7-diamond",
    label: "Diamond Edge",
    description: "Sharp gem shape — premium and precise",
    mark: LogoMark6,
    render: () => (
      <span className="inline-flex items-center gap-2.5">
        <LogoMark6 size={28} />
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 18, letterSpacing: "0.06em", color: GOLD, textTransform: "uppercase" as const }}>
          CO·LAB
        </span>
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 600, fontSize: 11, letterSpacing: "0.15em", color: "rgba(255,255,255,0.18)", textTransform: "uppercase" as const }}>
          AI
        </span>
      </span>
    ),
  },
  {
    id: "v8-grok-style",
    label: "Grok Bold",
    description: "Thick, confident — inspired by xAI Grok",
    mark: LogoMark,
    render: () => (
      <span className="inline-flex items-baseline gap-1">
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 900, fontSize: 26, letterSpacing: "-0.06em", color: "white" }}>
          co
        </span>
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 900, fontSize: 26, letterSpacing: "-0.06em", color: GOLD }}>
          lab
        </span>
      </span>
    ),
  },
  {
    id: "v9-wordmark-only",
    label: "Pure Wordmark",
    description: "No icon — typography does all the work",
    mark: null,
    render: () => (
      <span className="inline-flex items-baseline">
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 24, letterSpacing: "-0.05em", color: GOLD }}>
          C
        </span>
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 24, letterSpacing: "-0.05em", color: "rgba(255,255,255,0.70)" }}>
          o-
        </span>
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 24, letterSpacing: "-0.05em", color: GOLD }}>
          L
        </span>
        <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 24, letterSpacing: "-0.05em", color: "rgba(255,255,255,0.70)" }}>
          ab
        </span>
        <span style={{ fontFamily: "'Inter'", fontWeight: 400, fontSize: 12, letterSpacing: "0.1em", color: "rgba(255,255,255,0.20)", marginLeft: 6 }}>
          AI
        </span>
      </span>
    ),
  },
  {
    id: "v10-slash",
    label: "Slash Separator",
    description: "Code-inspired path separator",
    mark: null,
    render: () => (
      <span className="inline-flex items-baseline gap-0.5">
        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em", color: GOLD }}>
          co
        </span>
        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 300, fontSize: 26, color: "rgba(255,255,255,0.15)", margin: "0 1px" }}>
          /
        </span>
        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em", color: "rgba(255,255,255,0.75)" }}>
          lab
        </span>
        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 400, fontSize: 11, letterSpacing: "0.08em", color: GOLD, marginLeft: 4, opacity: 0.6 }}>
          AI
        </span>
      </span>
    ),
  },
]

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 md:p-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 font-display tracking-tight">Logo Variants</h1>
        <p className="text-white/40 text-sm mb-12">Explore different typography and mark combinations for Co-Lab AI</p>

        {/* ── Animation Showcase ── */}
        <div className="mb-16">
          <h2 className="text-lg font-semibold text-white/70 mb-2 tracking-tight">Animations</h2>
          <p className="text-[12px] text-white/30 mb-8">Loading and micro-interaction animations for the logomark</p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Draw & Pulse", description: "Loading screen", el: <AnimatedLogoMark size={48} /> },
              { label: "Stagger Draw", description: "Sequential reveal", el: <StaggerDrawLogo size={48} /> },
              { label: "Spin", description: "Processing", el: <SpinLogoMark size={48} /> },
              { label: "Glitch", description: "Error / edge", el: <GlitchLogoMark size={48} /> },
              { label: "Bounce", description: "Waiting", el: <BounceLogoMark size={48} /> },
            ].map((anim) => (
              <div
                key={anim.label}
                className="flex flex-col items-center gap-4 py-8 px-4 border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                style={{ borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.02)" }}
              >
                <div className="h-16 flex items-center justify-center">
                  {anim.el}
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-semibold text-white/50">{anim.label}</p>
                  <p className="text-[10px] text-white/25">{anim.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Logo Variants ── */}
        <h2 className="text-lg font-semibold text-white/70 mb-2 tracking-tight">Typography Variants</h2>
        <p className="text-[12px] text-white/30 mb-6">Different font and layout combinations</p>

        <div className="space-y-1">
          {variants.map((v) => (
            <div
              key={v.id}
              className="group flex items-center gap-8 px-8 py-8 transition-colors hover:bg-white/[0.03]"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              {/* Logo render */}
              <div className="w-[340px] flex-shrink-0 flex items-center">
                {v.render()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] font-semibold text-white/60 mb-0.5">{v.label}</h3>
                <p className="text-[11px] text-white/25">{v.description}</p>
              </div>

              {/* Dark + light preview */}
              <div className="flex gap-2 flex-shrink-0">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {v.mark && <v.mark size={24} />}
                  {!v.mark && <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 14, color: GOLD }}>CL</span>}
                </div>
                <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)" }}>
                  {v.mark && <v.mark size={24} color="#1A1A1A" />}
                  {!v.mark && <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 14, color: "#1A1A1A" }}>CL</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
