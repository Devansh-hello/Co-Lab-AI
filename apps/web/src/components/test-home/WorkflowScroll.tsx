"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

/* ─── SVG path builder (curved) ──────────────────────────────── */
function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2
  const dx = Math.abs(x2 - x1)
  const dy = Math.abs(y2 - y1)
  const curve = Math.max(dx, dy) * 0.35
  if (dy > dx) {
    return `M${x1},${y1} C${x1},${y1 + curve} ${x2},${y2 - curve} ${x2},${y2}`
  }
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`
}

function smoothPath(x1: number, y1: number, x2: number, y2: number): string {
  const midY = (y1 + y2) / 2
  return `M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`
}

/* ─── Old-way diagram ────────────────────────────────────────── */
function OldDiagram() {
  const container = useRef<SVGSVGElement>(null)

  const nodes = [
    { id: "pm", label: "PM", x: 270, y: 42, width: 88, height: 30 },
    { id: "design", label: "Design", x: 120, y: 120, width: 106, height: 32 },
    { id: "fe", label: "Frontend", x: 420, y: 120, width: 122, height: 32 },
    { id: "be", label: "Backend", x: 420, y: 262, width: 122, height: 32 },
    { id: "review", label: "Code Review", x: 120, y: 262, width: 136, height: 32 },
    { id: "qa", label: "QA", x: 270, y: 346, width: 88, height: 30 },
    { id: "deploy", label: "Deploy", x: 270, y: 194, width: 104, height: 32 },
  ] as const

  const sequentialEdges: Array<[string, string]> = [
    ["pm", "design"], ["design", "fe"], ["fe", "be"],
    ["be", "review"], ["review", "qa"], ["qa", "deploy"],
  ]

  const reworkEdges: Array<[string, string]> = [
    ["review", "fe"], ["qa", "be"], ["deploy", "design"],
    ["deploy", "fe"], ["be", "design"], ["deploy", "pm"],
  ]

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const dependencyCount = sequentialEdges.length + reworkEdges.length

  useGSAP(() => {
    if (!container.current) return
    gsap.utils.toArray<SVGPathElement>(".wf-seq-path").forEach((p, i) => {
      const len = p.getTotalLength?.() || 1000
      gsap.fromTo(p,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 0.55, delay: i * 0.045, ease: "power1.out" }
      )
    })
    gsap.utils.toArray<SVGPathElement>(".wf-rework-path").forEach((p, i) => {
      gsap.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.55, delay: 0.2 + i * 0.04 })
    })
    gsap.fromTo(".wf-old-node", { opacity: 0 }, { opacity: 1, duration: 0.15, stagger: 0.04 })
    gsap.fromTo(".wf-cross-text", { opacity: 0 }, { opacity: 1, delay: 0.8 })
  }, { scope: container })

  return (
    <svg ref={container} viewBox="0 0 540 400" className="w-full h-full">
      <defs>
        <filter id="wf-old-glow">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {sequentialEdges.map(([fromId, toId], i) => {
        const f = nodeMap[fromId]; const t = nodeMap[toId]
        const d = curvePath(f.x, f.y, t.x, t.y)
        return (
          <g key={i}>
            <path className="wf-seq-path" d={d} fill="none" stroke="rgba(148,163,184,0.42)" strokeWidth={1.25} />
            <circle r="2.2" fill="rgba(203,213,225,0.9)">
              <animateMotion dur={`${3.2 + i * 0.25}s`} repeatCount="indefinite" path={d} />
            </circle>
          </g>
        )
      })}

      {reworkEdges.map(([fromId, toId], i) => {
        const f = nodeMap[fromId]; const t = nodeMap[toId]
        const d = curvePath(f.x, f.y, t.x, t.y)
        return (
          <g key={`rework-${i}`}>
            <path className="wf-rework-path" d={d} fill="none" stroke="rgba(100,116,139,0.35)" strokeWidth={1} strokeDasharray="4 5" />
            <circle r="1.9" fill="rgba(148,163,184,0.7)">
              <animateMotion dur={`${4 + i * 0.3}s`} repeatCount="indefinite" path={d} />
            </circle>
          </g>
        )
      })}

      {nodes.map((n) => (
        <g key={n.id} className="wf-old-node" style={{ opacity: 0 }}>
          <rect x={n.x - n.width / 2} y={n.y - n.height / 2} width={n.width} height={n.height} rx={8}
            fill="rgba(12,12,12,0.94)" stroke="rgba(148,163,184,0.55)" strokeWidth={1} />
          <text x={n.x} y={n.y + 1} fill="#E5E7EB" fontSize={9.5}
            fontFamily="'JetBrains Mono', monospace" fontWeight="500" letterSpacing="0.35"
            textAnchor="middle" dominantBaseline="middle">{n.label}</text>
        </g>
      ))}

      <text className="wf-cross-text" x={260} y={395} textAnchor="middle"
        fill="rgba(148,163,184,0.62)" fontSize={8.5}
        fontFamily="'JetBrains Mono', monospace" style={{ opacity: 0 }}>
        {dependencyCount} dependencies &middot; sequential hand-offs
      </text>
    </svg>
  )
}

/* ─── Co-Lab diagram ─────────────────────────────────────────── */
function ColabDiagram() {
  const container = useRef<SVGSVGElement>(null)

  const CX = 270
  const prompt = { x: CX, y: 38, w: 136, h: 34 }
  const coord  = { x: CX, y: 118, w: 150, h: 40 }
  const fe     = { x: 148, y: 240, w: 140, h: 34, label: "FRONTEND AGENT" }
  const be     = { x: 392, y: 240, w: 140, h: 34, label: "BACKEND AGENT" }
  const review = { x: CX, y: 338, w: 148, h: 36, label: "REVIEW AGENT" }
  const output = { x: CX, y: 418, w: 156, h: 36 }
  const parallelY = 212

  const coordBottom = coord.y + coord.h / 2
  const fanOffsetX = 28
  const pathPromptCoord = smoothPath(prompt.x, prompt.y + prompt.h / 2, coord.x, coord.y - coord.h / 2)
  const pathCoordFe = smoothPath(coord.x - fanOffsetX, coordBottom, fe.x, fe.y - fe.h / 2)
  const pathCoordBe = smoothPath(coord.x + fanOffsetX, coordBottom, be.x, be.y - be.h / 2)
  const reviewTop = review.y - review.h / 2
  const mergeOffsetX = 22
  const pathFeReview = smoothPath(fe.x, fe.y + fe.h / 2, review.x - mergeOffsetX, reviewTop)
  const pathBeReview = smoothPath(be.x, be.y + be.h / 2, review.x + mergeOffsetX, reviewTop)
  const pathReviewOut = smoothPath(review.x, review.y + review.h / 2, output.x, output.y - output.h / 2)

  const fbX = fe.x - fe.w / 2 - 18
  const fbFrom = review.y
  const fbTo = fe.y
  const feedbackArc = `M${fbX + 10},${fbFrom} C${fbX},${fbFrom} ${fbX},${fbTo} ${fbX + 10},${fbTo}`

  const LINE_GOLD = "rgba(230,179,62,0.6)"
  const LINE_GOLD_LT = "rgba(230,179,62,0.35)"
  const DOT_GOLD = "#E6B33E"
  const NODE_STROKE = "rgba(230,179,62,0.45)"
  const NODE_ACCENT = "rgba(230,179,62,0.7)"
  const TEXT_GOLD = "#E6B33E"
  const TEXT_WHITE = "rgba(255,255,255,0.88)"
  const TEXT_DIM = "rgba(255,255,255,0.45)"
  const FB_COLOR = "rgba(230,179,62,0.35)"

  useGSAP(() => {
    if (!container.current) return
    const animPath = (selector: string, duration: number, delay: number) => {
      const el = container.current?.querySelector(selector) as SVGPathElement | null
      if (!el) return
      const len = el.getTotalLength?.() || 1000
      gsap.fromTo(el,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration, delay, ease: "power1.out" }
      )
    }
    animPath(".wf-edge-prompt", 0.5, 0)
    animPath(".wf-edge-fe", 0.5, 0.2)
    animPath(".wf-edge-be", 0.5, 0.25)
    animPath(".wf-edge-rev-fe", 0.5, 0.5)
    animPath(".wf-edge-rev-be", 0.5, 0.55)
    animPath(".wf-edge-out", 0.5, 0.7)

    gsap.fromTo(".wf-edge-feedback", { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 1 })
    gsap.fromTo(".wf-text-feedback", { opacity: 0 }, { opacity: 1, delay: 1.2 })

    const animNode = (selector: string, delay: number, yStart = 8) => {
      gsap.fromTo(selector, { opacity: 0, y: yStart }, { opacity: 1, y: 0, duration: 0.4, delay, ease: "power1.out" })
    }
    animNode(".wf-node-prompt", 0)
    animNode(".wf-node-coord", 0.08)
    animNode(".wf-node-fe", 0.2, 10)
    animNode(".wf-node-be", 0.24, 10)
    animNode(".wf-node-rev", 0.4, 10)
    animNode(".wf-node-out", 0.6)

    gsap.fromTo(".wf-lbl-parallel", { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 0.5 })
    gsap.fromTo(".wf-lbl-subrev", { opacity: 0 }, { opacity: 1, delay: 0.9 })
    gsap.fromTo(".wf-lbl-footer", { opacity: 0 }, { opacity: 1, delay: 0.9 })
  }, { scope: container })

  return (
    <svg ref={container} viewBox="0 0 540 460" className="w-full h-full">
      <defs>
        <filter id="wf-dot-glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="wf-node-shadow"><feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.4)" floodOpacity="0.4" /></filter>
        <marker id="wf-fb-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,1 L6,3 L0,5" fill="none" stroke={FB_COLOR} strokeWidth="1" />
        </marker>
      </defs>

      <path className="wf-edge-prompt" d={pathPromptCoord} fill="none" stroke={LINE_GOLD} strokeWidth={1.5} />
      <circle r="2.5" fill={DOT_GOLD} filter="url(#wf-dot-glow)"><animateMotion dur="2.5s" repeatCount="indefinite" path={pathPromptCoord} /></circle>

      <path className="wf-edge-fe" d={pathCoordFe} fill="none" stroke={LINE_GOLD} strokeWidth={1.4} />
      <circle r="2" fill={DOT_GOLD} opacity={0.9}><animateMotion dur="2.5s" repeatCount="indefinite" path={pathCoordFe} /></circle>

      <path className="wf-edge-be" d={pathCoordBe} fill="none" stroke={LINE_GOLD} strokeWidth={1.4} />
      <circle r="2" fill={DOT_GOLD} opacity={0.9}><animateMotion dur="2.8s" repeatCount="indefinite" path={pathCoordBe} /></circle>

      <path className="wf-edge-rev-fe" d={pathFeReview} fill="none" stroke={LINE_GOLD_LT} strokeWidth={1.4} />
      <circle r="2" fill={DOT_GOLD} opacity={0.8}><animateMotion dur="2.6s" repeatCount="indefinite" path={pathFeReview} /></circle>

      <path className="wf-edge-rev-be" d={pathBeReview} fill="none" stroke={LINE_GOLD_LT} strokeWidth={1.4} />
      <circle r="2" fill={DOT_GOLD} opacity={0.8}><animateMotion dur="2.9s" repeatCount="indefinite" path={pathBeReview} /></circle>

      <path className="wf-edge-out" d={pathReviewOut} fill="none" stroke={LINE_GOLD} strokeWidth={1.5} />
      <circle r="2.5" fill={DOT_GOLD} filter="url(#wf-dot-glow)"><animateMotion dur="2.5s" repeatCount="indefinite" path={pathReviewOut} /></circle>

      <path className="wf-edge-feedback" d={feedbackArc} fill="none" stroke={FB_COLOR} strokeWidth={1} strokeDasharray="5 4" markerEnd="url(#wf-fb-arrow)" />
      <text className="wf-text-feedback" x={fbX - 4} y={(fbFrom + fbTo) / 2}
        fill={TEXT_DIM} fontSize={7} fontFamily="'JetBrains Mono', monospace" fontWeight="500"
        textAnchor="middle" dominantBaseline="middle" style={{ writingMode: "vertical-rl" as const }}>FEEDBACK</text>

      {[0, 1].map(i => (
        <circle key={`pulse-${i}`} cx={coord.x} cy={coord.y} r="20" fill="none" stroke="rgba(230,179,62,0.1)" strokeWidth={0.7}>
          <animate attributeName="r" values="26;50" dur="3.5s" begin={`${i * 1.5}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.25;0" dur="3.5s" begin={`${i * 1.5}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Nodes */}
      <g className="wf-node-prompt" style={{ opacity: 0 }}>
        <rect x={prompt.x - prompt.w / 2} y={prompt.y - prompt.h / 2} width={prompt.w} height={prompt.h} rx={10}
          fill="rgba(12,12,12,0.95)" stroke={NODE_STROKE} strokeWidth={1.2} filter="url(#wf-node-shadow)" />
        <text x={prompt.x} y={prompt.y + 1} fill={TEXT_GOLD} fontSize={10}
          fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="0.4"
          textAnchor="middle" dominantBaseline="middle">YOUR PROMPT</text>
      </g>

      <g className="wf-node-coord" style={{ opacity: 0 }}>
        <rect x={coord.x - coord.w / 2} y={coord.y - coord.h / 2} width={coord.w} height={coord.h} rx={12}
          fill="rgba(12,12,12,0.96)" stroke={NODE_ACCENT} strokeWidth={1.5} filter="url(#wf-node-shadow)" />
        <text x={coord.x} y={coord.y + 1} fill={TEXT_GOLD} fontSize={10}
          fontFamily="'JetBrains Mono', monospace" fontWeight="700" letterSpacing="0.4"
          textAnchor="middle" dominantBaseline="middle">ORCHESTRATOR</text>
      </g>

      <g className="wf-lbl-parallel" style={{ opacity: 0 }}>
        <line x1={fe.x - fe.w / 2} y1={parallelY} x2={be.x + be.w / 2} y2={parallelY}
          stroke="rgba(255,255,255,0.08)" strokeWidth={0.8} strokeDasharray="4 6" />
        <circle cx={fe.x} cy={parallelY} r={1.8} fill="rgba(230,179,62,0.4)" />
        <circle cx={be.x} cy={parallelY} r={1.8} fill="rgba(230,179,62,0.4)" />
        <rect x={CX - 66} y={parallelY - 10} width={132} height={20} rx={5}
          fill="rgba(5,5,5,0.95)" stroke="rgba(255,255,255,0.1)" strokeWidth={0.7} />
        <text x={CX} y={parallelY + 1} fill={TEXT_DIM} fontSize={7.5}
          fontFamily="'JetBrains Mono', monospace" fontWeight="500" letterSpacing="0.4"
          textAnchor="middle" dominantBaseline="middle">PARALLEL EXECUTION</text>
      </g>

      <g className="wf-node-fe" style={{ opacity: 0 }}>
        <rect x={fe.x - fe.w / 2} y={fe.y - fe.h / 2} width={fe.w} height={fe.h} rx={9}
          fill="rgba(12,12,12,0.95)" stroke={NODE_STROKE} strokeWidth={1.1} filter="url(#wf-node-shadow)" />
        <circle cx={fe.x - fe.w / 2 + 12} cy={fe.y} r={2.5} fill={DOT_GOLD}>
          <animate attributeName="opacity" values="1;0.4;1" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <text x={fe.x + 6} y={fe.y + 1} fill={TEXT_WHITE} fontSize={8.5}
          fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="0.35"
          textAnchor="middle" dominantBaseline="middle">{fe.label}</text>
      </g>

      <g className="wf-node-be" style={{ opacity: 0 }}>
        <rect x={be.x - be.w / 2} y={be.y - be.h / 2} width={be.w} height={be.h} rx={9}
          fill="rgba(12,12,12,0.95)" stroke={NODE_STROKE} strokeWidth={1.1} filter="url(#wf-node-shadow)" />
        <circle cx={be.x - be.w / 2 + 12} cy={be.y} r={2.5} fill={DOT_GOLD}>
          <animate attributeName="opacity" values="1;0.4;1" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <text x={be.x + 6} y={be.y + 1} fill={TEXT_WHITE} fontSize={8.5}
          fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="0.35"
          textAnchor="middle" dominantBaseline="middle">{be.label}</text>
      </g>

      <g className="wf-node-rev" style={{ opacity: 0 }}>
        <rect x={review.x - review.w / 2} y={review.y - review.h / 2} width={review.w} height={review.h} rx={10}
          fill="rgba(12,12,12,0.95)" stroke={NODE_ACCENT} strokeWidth={1.3} filter="url(#wf-node-shadow)" />
        <circle cx={review.x - review.w / 2 + 12} cy={review.y} r={2.5} fill={DOT_GOLD}>
          <animate attributeName="opacity" values="1;0.4;1" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <text x={review.x + 6} y={review.y + 1} fill={TEXT_WHITE} fontSize={8.8}
          fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="0.35"
          textAnchor="middle" dominantBaseline="middle">{review.label}</text>
      </g>

      <text className="wf-lbl-subrev" x={review.x + review.w / 2 + 10} y={review.y + 1}
        fill={TEXT_DIM} fontSize={7} fontFamily="'JetBrains Mono', monospace" fontWeight="500" letterSpacing="0.3"
        textAnchor="start" dominantBaseline="middle" style={{ opacity: 0 }}>review &middot; test &middot; score</text>

      <g className="wf-node-out" style={{ opacity: 0 }}>
        <rect x={output.x - output.w / 2} y={output.y - output.h / 2} width={output.w} height={output.h} rx={10}
          fill="rgba(12,12,12,0.95)" stroke={NODE_STROKE} strokeWidth={1.2} filter="url(#wf-node-shadow)" />
        <text x={output.x} y={output.y + 1} fill={TEXT_GOLD} fontSize={10}
          fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="0.35"
          textAnchor="middle" dominantBaseline="middle">PRODUCTION CODE</text>
      </g>

      <text className="wf-lbl-footer" x={CX} y={452} textAnchor="middle"
        fill={TEXT_DIM} fontSize={7.5} fontFamily="'JetBrains Mono', monospace" style={{ opacity: 0 }}>
        1 prompt &middot; 2 agents in parallel &middot; quality gate &middot; 1 output
      </text>
    </svg>
  )
}

/* ─── Main WorkflowScroll section ────────────────────────────── */
export function WorkflowScroll() {
  const sectionRef = useRef<HTMLElement>(null)
  const oldRef = useRef<HTMLDivElement>(null)
  const colabRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<"both" | "colab">("both")

  // IntersectionObserver to detect scroll depth
  const setupObservers = useCallback(() => {
    if (!sectionRef.current) return

    // Sentinel at 20% — show both diagrams
    const earlyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setPhase("both")
          }
        })
      },
      { threshold: 0.15 }
    )

    // Sentinel at 60% — fade old, highlight colab
    const deepObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setPhase("colab")
          }
        })
      },
      { threshold: 0.5 }
    )

    earlyObserver.observe(sectionRef.current)
    deepObserver.observe(sectionRef.current)

    return () => {
      earlyObserver.disconnect()
      deepObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const cleanup = setupObservers()
    return cleanup
  }, [setupObservers])

  // GSAP transitions when phase changes
  useEffect(() => {
    if (!oldRef.current || !colabRef.current) return

    if (phase === "colab") {
      gsap.to(oldRef.current, { opacity: 0.3, scale: 0.95, duration: 0.6, ease: "power2.out" })
      gsap.to(colabRef.current, { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" })
    } else {
      gsap.to(oldRef.current, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" })
      gsap.to(colabRef.current, { opacity: 0.7, scale: 0.97, duration: 0.5, ease: "power2.out" })
    }
  }, [phase])

  const isColab = phase === "colab"

  return (
    <section
      ref={sectionRef}
      id="workflow"
      className="relative py-16 md:py-24 px-4 md:px-8 overflow-hidden"
    >
      {/* Subtle gold glow */}
      <div
        className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(230,179,62,0.04) 0%, transparent 60%)" }}
      />

      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <p className="text-[11px] font-mono text-gold-500/60 tracking-[0.15em] uppercase font-bold text-center mb-3">
          Why Co-Lab
        </p>
        <h2 className="text-[clamp(1.4rem,3vw,2.2rem)] font-black text-center text-foreground mb-12 tracking-[-0.03em]">
          A better way to build software
        </h2>

        {/* Side-by-side diagrams */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Old Way */}
          <div>
            <h3 className="text-[13px] font-mono text-white/50 uppercase tracking-wider text-center mb-4">
              Traditional Way
            </h3>
            <div
              ref={oldRef}
              className="relative rounded-xl border border-white/[0.06] bg-[#1A1A1A] overflow-hidden transition-shadow duration-500"
              style={{
                aspectRatio: "5 / 4",
                padding: "16px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
              }}
            >
              <div className="w-full h-full">
                <OldDiagram />
              </div>
            </div>
          </div>

          {/* Co-Lab Way */}
          <div>
            <h3 className="text-[13px] font-mono text-gold-500/70 uppercase tracking-wider text-center mb-4">
              Co-Lab Way
            </h3>
            <div
              ref={colabRef}
              className="relative rounded-xl border overflow-hidden transition-all duration-500"
              style={{
                aspectRatio: "5 / 4",
                padding: "16px",
                borderColor: isColab ? "rgba(230,179,62,0.15)" : "rgba(255,255,255,0.06)",
                backgroundColor: "#1A1A1A",
                boxShadow: isColab
                  ? "0 0 80px rgba(230,179,62,0.04), 0 4px 24px rgba(0,0,0,0.5)"
                  : "0 4px 24px rgba(0,0,0,0.5)",
                opacity: 0.7,
              }}
            >
              <div className="w-full h-full">
                <ColabDiagram />
              </div>
              {/* Gold glow behind on colab phase */}
              <div
                className="absolute inset-0 -z-10 rounded-xl transition-opacity duration-500"
                style={{
                  opacity: isColab ? 1 : 0,
                  background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(230,179,62,0.06), transparent)",
                  filter: "blur(30px)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Comparison summary row */}
        <div className="grid md:grid-cols-2 gap-4 mt-8 max-w-3xl mx-auto">
          <div
            className="text-center py-3 px-4 rounded-lg border border-white/[0.06] bg-white/[0.02] transition-opacity duration-500"
            style={{ opacity: isColab ? 0.4 : 0.8 }}
          >
            <span className="text-[12px] font-mono text-white/40">
              12 dependencies &middot; sequential hand-offs &middot; weeks
            </span>
          </div>
          <div
            className="text-center py-3 px-4 rounded-lg border transition-all duration-500"
            style={{
              borderColor: isColab ? "rgba(230,179,62,0.2)" : "rgba(255,255,255,0.06)",
              backgroundColor: isColab ? "rgba(230,179,62,0.05)" : "rgba(255,255,255,0.02)",
              opacity: isColab ? 1 : 0.6,
            }}
          >
            <span className="text-[12px] font-mono text-gold-500">
              1 prompt &middot; parallel agents &middot; minutes
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
