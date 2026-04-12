"use client"

import { useRef, type FC } from "react"
import {
  CheckCircle2,
  AlertTriangle,
  Zap,
  Lock,
  Puzzle,
  Code2,
  FlaskConical,
} from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

interface QualityScoreProps {
  grade: string
  metrics: Record<string, number>
  overall: number
  needsFeedback?: boolean
}

const GRADE_CONFIG: Record<string, { label: string }> = {
  A: { label: "Excellent" },
  B: { label: "Good" },
  C: { label: "Fair" },
  D: { label: "Poor" },
  F: { label: "Failing" },
}

const METRIC_CONFIG: Record<string, { icon: typeof CheckCircle2; label: string }> = {
  completeness:  { icon: CheckCircle2, label: "Completeness" },
  security:      { icon: Lock,         label: "Security" },
  compatibility: { icon: Puzzle,       label: "API Compat" },
  codeQuality:   { icon: Code2,        label: "Code Quality" },
  testCoverage:  { icon: FlaskConical, label: "Test Coverage" },
}

// ─── Animated SVG Ring Gauge ─────────────────────────────────
function RingGauge({ value, size = 88, stroke = 5 }: { value: number; size?: number; stroke?: number }) {
  const ringRef = useRef<SVGCircleElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r

  useGSAP(() => {
    if (!ringRef.current || !textRef.current) return
    const offset = circ - (value / 100) * circ

    gsap.fromTo(ringRef.current,
      { attr: { "stroke-dashoffset": circ } },
      { attr: { "stroke-dashoffset": offset }, duration: 0.8, ease: "power3.out" }
    )

    const obj = { v: 0 }
    gsap.to(obj, {
      v: value, duration: 0.8, ease: "power3.out",
      onUpdate: () => {
        if (textRef.current) textRef.current.textContent = Math.round(obj.v).toString()
      },
    })
  }, { dependencies: [value, circ] })

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke}
        />
        <circle
          ref={ringRef}
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--color-gold-500)" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px rgba(230,179,62,0.3))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span ref={textRef} className="text-[20px] font-black font-mono tabular-nums text-gold-500">0</span>
      </div>
    </div>
  )
}

// ─── Animated Metric Bar ─────────────────────────────────────
function MetricBar({ name, value, index }: { name: string; value: number; index: number }) {
  const cfg = METRIC_CONFIG[name]
  const barRef = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)
  if (!cfg) return null
  const Icon = cfg.icon

  const color = value >= 80 ? "var(--color-gold-500)" : value >= 60 ? "var(--color-gold-600)" : "#8B7020"
  const colorHex = value >= 80 ? "var(--color-gold-500)" : value >= 60 ? "var(--color-gold-600)" : "#8B7020"
  const isZero = value === 0

  useGSAP(() => {
    if (!barRef.current || !numRef.current) return
    const delay = 0.2 + index * 0.08

    gsap.fromTo(barRef.current,
      { width: "0%" },
      { width: `${Math.min(value, 100)}%`, duration: 0.5, delay, ease: "power2.out" }
    )

    const obj = { v: 0 }
    gsap.to(obj, {
      v: value, duration: 0.5, delay, ease: "power2.out",
      onUpdate: () => {
        if (numRef.current) numRef.current.textContent = Math.round(obj.v).toString()
      },
    })
  }, { dependencies: [value, index] })

  return (
    <div className="flex items-center gap-2.5 metric-row" style={{ opacity: 0 }}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isZero ? "rgba(255,255,255,0.2)" : color }} />
      <span className="text-[11px] text-white/50 w-[72px] flex-shrink-0 font-medium tracking-[-0.01em]">{cfg.label}</span>
      <div className="flex-1 h-[5px] bg-white/[0.04] rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full"
          style={{ width: 0, backgroundColor: isZero ? "rgba(255,255,255,0.08)" : colorHex, boxShadow: isZero ? "none" : `0 0 8px ${colorHex}30` }}
        />
      </div>
      <span ref={numRef} className={`text-[11px] font-mono w-7 text-right tabular-nums ${isZero ? "text-white/20" : ""}`} style={isZero ? undefined : { color }}>0</span>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────
export const QualityScoreCard: FC<QualityScoreProps> = ({ grade, metrics, overall, needsFeedback }) => {
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG.C
  const cardRef = useRef<HTMLDivElement>(null)
  const gradeRef = useRef<HTMLDivElement>(null)

  const metricValues = Object.values(metrics)
  const effectiveOverall = overall > 0
    ? overall
    : metricValues.length > 0
      ? Math.round(metricValues.reduce((a, b) => a + b, 0) / metricValues.length)
      : 0

  useGSAP(() => {
    if (!cardRef.current) return

    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.38, ease: "power2.out" }
    )

    const rows = cardRef.current.querySelectorAll(".metric-row")
    if (rows.length > 0) {
      gsap.fromTo(rows,
        { opacity: 0, x: -6 },
        { opacity: 1, x: 0, duration: 0.38, stagger: 0.05, delay: 0.12, ease: "power2.out" }
      )
    }

    if (gradeRef.current) {
      const tl = gsap.timeline()
      tl.fromTo(gradeRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1.04, opacity: 1, duration: 0.38, delay: 0.12, ease: "power2.out" }
      ).to(gradeRef.current,
        { scale: 1, duration: 0.15, ease: "power2.inOut" }
      )
    }
  }, { scope: cardRef })

  return (
    <div ref={cardRef} className="w-full" style={{ opacity: 0 }}>
      <div className="overflow-hidden border border-white/[0.08] relative" style={{ backgroundColor: "#1A1A1A", borderRadius: "6px" }}>
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(230,179,62,0.15), transparent)" }}
        />

        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-3">
          <Zap className="w-4 h-4 text-gold-500/60 flex-shrink-0" />
          <span className="text-[13px] font-semibold text-white/70 tracking-[-0.02em]">Quality Score</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/35">
            {cfg.label}
          </span>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-5 mb-5 relative">
            <RingGauge value={effectiveOverall} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <div
                  ref={gradeRef}
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm bg-gold-500/10 border border-gold-500/25 text-gold-500"
                  style={{ opacity: 0 }}
                >
                  {grade}
                </div>
                <div>
                  <span className="text-[15px] font-bold tracking-[-0.03em] text-white/80">
                    {effectiveOverall}/100
                  </span>
                  <p className="text-[11px] text-white/45 font-medium">{cfg.label}</p>
                </div>
              </div>

              {needsFeedback && (
                <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-md bg-gold-500/[0.06] border border-gold-500/15 w-fit">
                  <AlertTriangle className="w-3 h-3 text-gold-500/70 animate-pulse" />
                  <span className="text-[9px] text-gold-500/60 font-semibold tracking-wide uppercase font-mono">Auto-fixing</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            {Object.entries(metrics).map(([key, value], i) => (
              <MetricBar key={key} name={key} value={value} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
