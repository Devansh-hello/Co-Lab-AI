"use client";

import { useState, useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

/* ─── SVG path builder (curved) ──────────────────────────────────────── */
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

/* ─── Old-way diagram ─────────────────────────────────────────────────── */
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
    ["pm", "design"],
    ["design", "fe"],
    ["fe", "be"],
    ["be", "review"],
    ["review", "qa"],
    ["qa", "deploy"],
  ]

  const reworkEdges: Array<[string, string]> = [
    ["review", "fe"],
    ["qa", "be"],
    ["deploy", "design"],
    ["deploy", "fe"],
    ["be", "design"],
    ["deploy", "pm"],
  ]

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const dependencyCount = sequentialEdges.length + reworkEdges.length

  useGSAP(() => {
    if (!container.current) return
    
    // Animate sequential paths
    gsap.utils.toArray(".seq-path").forEach((p: any, i) => {
      const len = p.getTotalLength?.() || 1000
      gsap.fromTo(p, 
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 0.55, delay: i * 0.045, ease: "power1.out" }
      )
    })

    // Animate rework paths
    gsap.utils.toArray(".rework-path").forEach((p: any, i) => {
      gsap.fromTo(p, 
        { opacity: 0 },
        { opacity: 1, duration: 0.55, delay: 0.2 + i * 0.04 }
      )
    })

    // Animate nodes
    gsap.fromTo(".old-node", 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.15, stagger: 0.04 }
    )

    // Crossing lines text
    gsap.fromTo(".cross-text", { opacity: 0 }, { opacity: 1, delay: 0.8 })
  }, { scope: container })

  return (
    <svg ref={container} viewBox="0 0 540 400" className="w-full h-full">
      <defs>
        <filter id="old-glow">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {sequentialEdges.map(([fromId, toId], i) => {
        const f = nodeMap[fromId]
        const t = nodeMap[toId]
        const d = curvePath(f.x, f.y, t.x, t.y)
        return (
          <g key={i}>
            <path
              className="seq-path"
              d={d} fill="none"
              stroke="rgba(148,163,184,0.42)" strokeWidth={1.25}
            />
            <circle r="2.2" fill="rgba(203,213,225,0.9)">
              <animateMotion dur={`${3.2 + i * 0.25}s`} repeatCount="indefinite" path={d} />
            </circle>
          </g>
        )
      })}

      {reworkEdges.map(([fromId, toId], i) => {
        const f = nodeMap[fromId]
        const t = nodeMap[toId]
        const d = curvePath(f.x, f.y, t.x, t.y)
        return (
          <g key={`rework-${i}`}>
            <path
              className="rework-path"
              d={d} fill="none"
              stroke="rgba(100,116,139,0.35)" strokeWidth={1}
              strokeDasharray="4 5"
            />
            <circle r="1.9" fill="rgba(148,163,184,0.7)">
              <animateMotion dur={`${4 + i * 0.3}s`} repeatCount="indefinite" path={d} />
            </circle>
          </g>
        )
      })}

      {nodes.map((n) => (
        <g key={n.id} className="old-node" style={{ opacity: 0 }}>
          <rect
            x={n.x - n.width / 2}
            y={n.y - n.height / 2}
            width={n.width}
            height={n.height}
            rx={8}
            fill="rgba(12,12,12,0.94)"
            stroke="rgba(148,163,184,0.55)"
            strokeWidth={1}
          />
          <text
            x={n.x} y={n.y + 1}
            fill="#E5E7EB"
            fontSize={9.5}
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="500"
            letterSpacing="0.35"
            textAnchor="middle" dominantBaseline="middle"
          >
            {n.label}
          </text>
        </g>
      ))}

      <text
        className="cross-text"
        x={260} y={395} textAnchor="middle"
        fill="rgba(148,163,184,0.62)" fontSize={8.5}
        fontFamily="'JetBrains Mono', monospace"
        style={{ opacity: 0 }}
      >
        {dependencyCount} dependencies · sequential hand-offs
      </text>
    </svg>
  )
}

/* ─── Co-Lab diagram ──────────────────────────────────────────────────── */
function ColabDiagram() {
  const container = useRef<SVGSVGElement>(null)

  const CX = 270

  const prompt  = { x: CX,  y: 38,  w: 136, h: 34 }
  const coord   = { x: CX,  y: 118, w: 150, h: 40 }
  const fe      = { x: 148, y: 240, w: 140, h: 34, label: "FRONTEND AGENT" }
  const be      = { x: 392, y: 240, w: 140, h: 34, label: "BACKEND AGENT" }
  const review  = { x: CX,  y: 338, w: 148, h: 36, label: "REVIEW AGENT" }
  const output  = { x: CX,  y: 418, w: 156, h: 36 }

  const parallelY = 212

  const coordBottom = coord.y + coord.h / 2
  const fanOffsetX  = 28
  const pathPromptCoord = smoothPath(prompt.x, prompt.y + prompt.h / 2, coord.x, coord.y - coord.h / 2)
  const pathCoordFe     = smoothPath(coord.x - fanOffsetX, coordBottom, fe.x, fe.y - fe.h / 2)
  const pathCoordBe     = smoothPath(coord.x + fanOffsetX, coordBottom, be.x, be.y - be.h / 2)

  const reviewTop    = review.y - review.h / 2
  const mergeOffsetX = 22
  const pathFeReview  = smoothPath(fe.x, fe.y + fe.h / 2, review.x - mergeOffsetX, reviewTop)
  const pathBeReview  = smoothPath(be.x, be.y + be.h / 2, review.x + mergeOffsetX, reviewTop)
  const pathReviewOut = smoothPath(review.x, review.y + review.h / 2, output.x, output.y - output.h / 2)

  const fbX    = fe.x - fe.w / 2 - 18
  const fbFrom = review.y
  const fbTo   = fe.y
  const feedbackArc = `M${fbX + 10},${fbFrom} C${fbX},${fbFrom} ${fbX},${fbTo} ${fbX + 10},${fbTo}`

  const LINE_GOLD    = "rgba(230,179,62,0.6)"
  const LINE_GOLD_LT = "rgba(230,179,62,0.35)"
  const DOT_GOLD     = "#E6B33E"
  const NODE_STROKE  = "rgba(230,179,62,0.45)"
  const NODE_ACCENT  = "rgba(230,179,62,0.7)"
  const TEXT_GOLD     = "#E6B33E"
  const TEXT_WHITE    = "rgba(255,255,255,0.88)"
  const TEXT_DIM      = "rgba(255,255,255,0.45)"
  const FB_COLOR      = "rgba(230,179,62,0.35)"

  useGSAP(() => {
    if (!container.current) return

    // helper to animate path length
    const animPath = (selector: string, duration: number, delay: number) => {
      const el = container.current?.querySelector(selector) as any
      if (!el) return
      const len = el.getTotalLength?.() || 1000
      gsap.fromTo(el,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration, delay, ease: "power1.out" }
      )
    }

    animPath(".edge-prompt", 0.5, 0)
    animPath(".edge-fe", 0.5, 0.2)
    animPath(".edge-be", 0.5, 0.25)
    animPath(".edge-rev-fe", 0.5, 0.5)
    animPath(".edge-rev-be", 0.5, 0.55)
    animPath(".edge-out", 0.5, 0.7)

    // Use opacity/dash array for feedback arc since it's already dashed
    gsap.fromTo(".edge-feedback", { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 1 })
    gsap.fromTo(".text-feedback", { opacity: 0 }, { opacity: 1, delay: 1.2 })

    // Animate nodes (y-offset and opacity)
    const animNode = (selector: string, delay: number, yStart = 8) => {
      gsap.fromTo(selector, 
        { opacity: 0, y: yStart }, 
        { opacity: 1, y: 0, duration: 0.4, delay, ease: "power1.out" }
      )
    }

    animNode(".node-prompt", 0)
    animNode(".node-coord", 0.08)
    animNode(".node-fe", 0.2, 10)
    animNode(".node-be", 0.24, 10)
    animNode(".node-rev", 0.4, 10)
    animNode(".node-out", 0.6)

    gsap.fromTo(".lbl-parallel", { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 0.5 })
    gsap.fromTo(".lbl-subrev", { opacity: 0 }, { opacity: 1, delay: 0.9 })
    gsap.fromTo(".lbl-footer", { opacity: 0 }, { opacity: 1, delay: 0.9 })

  }, { scope: container })

  return (
    <svg ref={container} viewBox="0 0 540 460" className="w-full h-full">
      <defs>
        <filter id="dot-glow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="node-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.4)" floodOpacity="0.4" />
        </filter>
        <marker id="fb-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,1 L6,3 L0,5" fill="none" stroke={FB_COLOR} strokeWidth="1" />
        </marker>
      </defs>

      <path className="edge-prompt" d={pathPromptCoord} fill="none" stroke={LINE_GOLD} strokeWidth={1.5} />
      <circle r="2.5" fill={DOT_GOLD} filter="url(#dot-glow)">
        <animateMotion dur="2.5s" repeatCount="indefinite" path={pathPromptCoord} />
      </circle>

      <path className="edge-fe" d={pathCoordFe} fill="none" stroke={LINE_GOLD} strokeWidth={1.4} />
      <circle r="2" fill={DOT_GOLD} opacity={0.9}>
        <animateMotion dur="2.5s" repeatCount="indefinite" path={pathCoordFe} />
      </circle>

      <path className="edge-be" d={pathCoordBe} fill="none" stroke={LINE_GOLD} strokeWidth={1.4} />
      <circle r="2" fill={DOT_GOLD} opacity={0.9}>
        <animateMotion dur="2.8s" repeatCount="indefinite" path={pathCoordBe} />
      </circle>

      <path className="edge-rev-fe" d={pathFeReview} fill="none" stroke={LINE_GOLD_LT} strokeWidth={1.4} />
      <circle r="2" fill={DOT_GOLD} opacity={0.8}>
        <animateMotion dur="2.6s" repeatCount="indefinite" path={pathFeReview} />
      </circle>

      <path className="edge-rev-be" d={pathBeReview} fill="none" stroke={LINE_GOLD_LT} strokeWidth={1.4} />
      <circle r="2" fill={DOT_GOLD} opacity={0.8}>
        <animateMotion dur="2.9s" repeatCount="indefinite" path={pathBeReview} />
      </circle>

      <path className="edge-out" d={pathReviewOut} fill="none" stroke={LINE_GOLD} strokeWidth={1.5} />
      <circle r="2.5" fill={DOT_GOLD} filter="url(#dot-glow)">
        <animateMotion dur="2.5s" repeatCount="indefinite" path={pathReviewOut} />
      </circle>

      <path className="edge-feedback" d={feedbackArc} fill="none"
        stroke={FB_COLOR} strokeWidth={1}
        strokeDasharray="5 4" markerEnd="url(#fb-arrow)" />
      <text className="text-feedback" x={fbX - 4} y={(fbFrom + fbTo) / 2}
        fill={TEXT_DIM} fontSize={7}
        fontFamily="'JetBrains Mono', monospace" fontWeight="500"
        textAnchor="middle" dominantBaseline="middle"
        style={{ writingMode: "vertical-rl" as const }}>
        FEEDBACK
      </text>

      {/* Pulse rings */}
      {[0, 1].map(i => (
        <circle key={`pulse-${i}`} cx={coord.x} cy={coord.y} r="20" fill="none"
          stroke="rgba(230,179,62,0.1)" strokeWidth={0.7}>
          <animate attributeName="r" values="26;50" dur="3.5s" begin={`${i * 1.5}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.25;0" dur="3.5s" begin={`${i * 1.5}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Nodes */}
      <g className="node-prompt" style={{ opacity: 0 }}>
        <rect x={prompt.x - prompt.w / 2} y={prompt.y - prompt.h / 2}
          width={prompt.w} height={prompt.h} rx={10}
          fill="rgba(12,12,12,0.95)" stroke={NODE_STROKE} strokeWidth={1.2}
          filter="url(#node-shadow)" />
        <text x={prompt.x} y={prompt.y + 1} fill={TEXT_GOLD} fontSize={10}
          fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="0.4"
          textAnchor="middle" dominantBaseline="middle">YOUR PROMPT</text>
      </g>

      <g className="node-coord" style={{ opacity: 0 }}>
        <rect x={coord.x - coord.w / 2} y={coord.y - coord.h / 2}
          width={coord.w} height={coord.h} rx={12}
          fill="rgba(12,12,12,0.96)" stroke={NODE_ACCENT} strokeWidth={1.5}
          filter="url(#node-shadow)" />
        <text x={coord.x} y={coord.y + 1} fill={TEXT_GOLD} fontSize={10}
          fontFamily="'JetBrains Mono', monospace" fontWeight="700" letterSpacing="0.4"
          textAnchor="middle" dominantBaseline="middle">ORCHESTRATOR</text>
      </g>

      <g className="lbl-parallel" style={{ opacity: 0 }}>
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

      <g className="node-fe" style={{ opacity: 0 }}>
        <rect x={fe.x - fe.w / 2} y={fe.y - fe.h / 2}
          width={fe.w} height={fe.h} rx={9}
          fill="rgba(12,12,12,0.95)" stroke={NODE_STROKE} strokeWidth={1.1}
          filter="url(#node-shadow)" />
        <circle cx={fe.x - fe.w / 2 + 12} cy={fe.y} r={2.5} fill={DOT_GOLD}>
          <animate attributeName="opacity" values="1;0.4;1" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <text x={fe.x + 6} y={fe.y + 1} fill={TEXT_WHITE} fontSize={8.5}
          fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="0.35"
          textAnchor="middle" dominantBaseline="middle">{fe.label}</text>
      </g>

      <g className="node-be" style={{ opacity: 0 }}>
        <rect x={be.x - be.w / 2} y={be.y - be.h / 2}
          width={be.w} height={be.h} rx={9}
          fill="rgba(12,12,12,0.95)" stroke={NODE_STROKE} strokeWidth={1.1}
          filter="url(#node-shadow)" />
        <circle cx={be.x - be.w / 2 + 12} cy={be.y} r={2.5} fill={DOT_GOLD}>
          <animate attributeName="opacity" values="1;0.4;1" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <text x={be.x + 6} y={be.y + 1} fill={TEXT_WHITE} fontSize={8.5}
          fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="0.35"
          textAnchor="middle" dominantBaseline="middle">{be.label}</text>
      </g>

      <g className="node-rev" style={{ opacity: 0 }}>
        <rect x={review.x - review.w / 2} y={review.y - review.h / 2}
          width={review.w} height={review.h} rx={10}
          fill="rgba(12,12,12,0.95)" stroke={NODE_ACCENT} strokeWidth={1.3}
          filter="url(#node-shadow)" />
        <circle cx={review.x - review.w / 2 + 12} cy={review.y} r={2.5} fill={DOT_GOLD}>
          <animate attributeName="opacity" values="1;0.4;1" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <text x={review.x + 6} y={review.y + 1} fill={TEXT_WHITE} fontSize={8.8}
          fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="0.35"
          textAnchor="middle" dominantBaseline="middle">{review.label}</text>
      </g>

      <text className="lbl-subrev" x={review.x + review.w / 2 + 10} y={review.y + 1}
        fill={TEXT_DIM} fontSize={7}
        fontFamily="'JetBrains Mono', monospace" fontWeight="500" letterSpacing="0.3"
        textAnchor="start" dominantBaseline="middle" style={{ opacity: 0 }}>
        review · test · score
      </text>

      <g className="node-out" style={{ opacity: 0 }}>
        <rect x={output.x - output.w / 2} y={output.y - output.h / 2}
          width={output.w} height={output.h} rx={10}
          fill="rgba(12,12,12,0.95)" stroke={NODE_STROKE} strokeWidth={1.2}
          filter="url(#node-shadow)" />
        <text x={output.x} y={output.y + 1} fill={TEXT_GOLD} fontSize={10}
          fontFamily="'JetBrains Mono', monospace" fontWeight="600" letterSpacing="0.35"
          textAnchor="middle" dominantBaseline="middle">PRODUCTION CODE</text>
      </g>

      <text className="lbl-footer" x={CX} y={452} textAnchor="middle"
        fill={TEXT_DIM} fontSize={7.5}
        fontFamily="'JetBrains Mono', monospace" style={{ opacity: 0 }}>
        1 prompt · 2 agents in parallel · quality gate · 1 output
      </text>
    </svg>
  )
}

/* ─── Main section ───────────────────────────────────────────────────── */
export function WorkflowSection() {
  const [active, setActive] = useState<"old" | "colab">("old")
  const isColab = active === "colab"
  const container = useRef<HTMLElement>(null)
  const leftContentRef = useRef<HTMLDivElement>(null)
  
  useGSAP(() => {
    if (!container.current) return
    
    // Header entry animation
    gsap.fromTo(".header-text",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.1 }
    )

  }, { scope: container })

  useGSAP(() => {
    if (!leftContentRef.current) return
    
    // Left text panel switch animation
    gsap.fromTo(leftContentRef.current,
      { opacity: 0, x: -12 },
      { opacity: 1, x: 0, duration: 0.2, ease: "power1.out" }
    )
  }, [active])

  return (
    <section ref={container} id="workflow" className="relative py-16 md:py-24 px-4 md:px-8">
      {/* Subtle gold glow behind the diagram area */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(230,179,62,0.04) 0%, transparent 60%)" }} />
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <p className="header-text text-[11px] font-label text-gold-500 tracking-[0.15em] uppercase font-bold text-center mb-3" style={{ opacity: 0 }}>
          Why Co-Lab
        </p>
        <h2 className="header-text text-[clamp(1.4rem,3vw,2.2rem)] font-display font-extrabold text-center text-foreground mb-8 tracking-[-0.03em]" style={{ opacity: 0 }}>
          A better way to build software
        </h2>

        {/* Toggle */}
        <div className="flex justify-center mb-10">
          <div className="relative flex p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
            <div
              className="absolute top-0.5 bottom-0.5 rounded-md transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
              style={{
                left: isColab ? "50%" : "2px",
                right: isColab ? "2px" : "50%",
                backgroundColor: isColab ? "rgba(230,179,62,1)" : "rgba(255,255,255,0.14)",
              }}
            />
            {(["old", "colab"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={[
                  "relative z-10 w-28 py-2 text-xs font-mono tracking-wide transition-colors duration-150 rounded-md cursor-pointer text-center",
                  active === tab
                    ? tab === "colab" ? "text-black font-semibold" : "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground/70",
                ].join(" ")}
              >
                {tab === "old" ? "Traditional" : "Co-Lab"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-12 items-center">

          {/* Left: text */}
          <div ref={leftContentRef}>
            {!isColab ? (
              <div className="space-y-5">
                <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-[-0.02em]">
                  Fragmented, slow, painful
                </h3>
                <p className="text-[14px] text-white/55 leading-relaxed normal-case max-w-md">
                  Traditional development chains hand-offs across silos. Requirements drift,
                  code reviews stall, and more time is spent coordinating than building.
                </p>
                <div className="space-y-3 pt-2">
                  {[
                    ["Sequential hand-offs", "Every step waits on the last"],
                    ["Context lost between teams", "Docs, Slack, Jira, repeat"],
                    ["Weeks to ship one feature", "3–6 week average cycle"],
                  ].map(([title, sub]) => (
                    <div key={title} className="flex items-start gap-3">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                      <div>
                        <span className="text-[13px] text-white/80 font-mono">{title}</span>
                        <p className="text-[12px] text-white/50 normal-case">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-[-0.02em]">
                  Orchestrated, fast,{" "}
                  <span className="text-gold-500">intelligent</span>
                </h3>
                <p className="text-[14px] text-white/55 leading-relaxed normal-case max-w-md">
                  One prompt dispatches an Orchestrator that plans tasks and fans out
                  Frontend &amp; Backend agents in parallel. A Review Agent quality-gates
                  the output — then delivers production-ready code.
                </p>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { val: "2×", sub: "Parallel Agents" },
                    { val: "0",  sub: "Hand-offs" },
                    { val: "A–F", sub: "Quality Gate" },
                  ].map(s => (
                    <div key={s.sub}
                      className="p-3 rounded-lg border border-gold-500/20 bg-gold-500/[0.05] text-center backdrop-blur-xl">
                      <div className="text-xl font-mono font-bold text-gold-500">{s.val}</div>
                      <div className="text-[10px] text-white/50 normal-case">{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: diagram */}
          <div className="relative">
            <div
              className={[
                "relative rounded-xl border transition-colors duration-300 overflow-hidden",
                isColab ? "border-gold-500/[0.15] backdrop-blur-xl" : "border-white/[0.08] backdrop-blur-xl",
              ].join(" ")}
              style={{
                background: "rgba(255,255,255,0.04)",
                boxShadow: isColab
                  ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 80px rgba(230,179,62,0.04), 0 4px 24px rgba(0,0,0,0.5)"
                  : "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.5)",
                aspectRatio: "5 / 4",
                padding: "16px",
              }}
            >
              <div className="w-full h-full">
                {isColab ? <ColabDiagram key="colab" /> : <OldDiagram key="old" />}
              </div>
            </div>

            {/* Background glow */}
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
    </section>
  )
}

