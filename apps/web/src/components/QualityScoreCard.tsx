import { useRef, useEffect, type FC } from "react"
import {
  CheckCircle2,
  AlertTriangle,
  Zap,
  Lock,
  Puzzle,
  Code2,
  FlaskConical,
} from "lucide-react"
import { animate, stagger, createTimeline } from "animejs"

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

  useEffect(() => {
    if (!ringRef.current || !textRef.current) return
    const offset = circ - (value / 100) * circ

    animate(ringRef.current, {
      strokeDashoffset: [circ, offset],
      duration: 1400,
      ease: "outExpo",
    })

    const obj = { v: 0 }
    animate(obj, {
      v: value,
      duration: 1400,
      ease: "outExpo",
      onUpdate: () => {
        if (textRef.current) textRef.current.textContent = Math.round(obj.v).toString()
      },
    })
  }, [value, circ])

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
          fill="none" stroke="#D4AF37" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px rgba(212,175,55,0.3))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span ref={textRef} className="text-[20px] font-black font-mono tabular-nums text-[#D4AF37]">0</span>
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

  // Gold shades based on value
  const color = value >= 80 ? "#D4AF37" : value >= 60 ? "#AA8C2C" : "#8B7020"
  const isZero = value === 0

  useEffect(() => {
    if (!barRef.current || !numRef.current) return
    const delay = 400 + index * 120

    animate(barRef.current, {
      width: [`0%`, `${Math.min(value, 100)}%`],
      duration: 900,
      delay,
      ease: "outQuart",
    })

    const obj = { v: 0 }
    animate(obj, {
      v: value,
      duration: 900,
      delay,
      ease: "outQuart",
      onUpdate: () => {
        if (numRef.current) numRef.current.textContent = Math.round(obj.v).toString()
      },
    })
  }, [value, index])

  return (
    <div className="flex items-center gap-2.5 metric-row" style={{ opacity: 0 }}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isZero ? "rgba(255,255,255,0.2)" : color + "80" }} />
      <span className="text-[11px] text-white/40 w-[72px] flex-shrink-0 font-medium tracking-[-0.01em]">{cfg.label}</span>
      <div className="flex-1 h-[5px] bg-white/[0.04] rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full"
          style={{ width: 0, backgroundColor: isZero ? "rgba(255,255,255,0.08)" : color, boxShadow: isZero ? "none" : `0 0 8px ${color}30` }}
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

  // Compute effective overall: if server sends 0 but metrics exist, derive from metrics
  const metricValues = Object.values(metrics)
  const effectiveOverall = overall > 0
    ? overall
    : metricValues.length > 0
      ? Math.round(metricValues.reduce((a, b) => a + b, 0) / metricValues.length)
      : 0

  useEffect(() => {
    if (!cardRef.current) return

    animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 500,
      ease: "outExpo",
    })

    const rows = cardRef.current.querySelectorAll(".metric-row")
    if (rows.length > 0) {
      animate(rows, {
        opacity: [0, 1],
        translateX: [-8, 0],
        duration: 400,
        delay: stagger(80, { start: 300 }),
        ease: "outQuart",
      })
    }

    if (gradeRef.current) {
      const tl = createTimeline()
      tl.add(gradeRef.current, {
        scale: [0, 1.2],
        opacity: [0, 1],
        duration: 450,
        delay: 200,
        ease: "outBack(2.5)",
      })
      tl.add(gradeRef.current, {
        scale: [1.2, 1],
        duration: 250,
        ease: "inOutQuad",
      })
    }
  }, [])

  return (
    <div ref={cardRef} className="w-full max-w-3xl" style={{ opacity: 0 }}>
      <div className="rounded-2xl border border-white/[0.08] bg-[#161616] overflow-hidden shadow-elevation-1 relative">
        {/* Subtle gold glow */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.15), transparent)" }}
        />

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-3">
          <Zap className="w-4 h-4 text-[#D4AF37]/60 flex-shrink-0" />
          <span className="text-[13px] font-semibold text-white/70 tracking-[-0.02em]">Quality Score</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/35">
            {cfg.label}
          </span>
        </div>

        {/* Body: Ring gauge + grade + metrics */}
        <div className="p-5">
          <div className="flex items-center gap-5 mb-5 relative">
            <RingGauge value={effectiveOverall} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <div
                  ref={gradeRef}
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37]"
                  style={{ opacity: 0 }}
                >
                  {grade}
                </div>
                <div>
                  <span className="text-[15px] font-bold tracking-[-0.03em] text-white/80">
                    {effectiveOverall}/100
                  </span>
                  <p className="text-[11px] text-white/30 font-medium">{cfg.label}</p>
                </div>
              </div>

              {needsFeedback && (
                <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-md bg-[#D4AF37]/[0.06] border border-[#D4AF37]/15 w-fit">
                  <AlertTriangle className="w-3 h-3 text-[#D4AF37]/70 animate-pulse" />
                  <span className="text-[9px] text-[#D4AF37]/60 font-semibold tracking-wide uppercase font-mono">Auto-fixing</span>
                </div>
              )}
            </div>
          </div>

          {/* Metrics breakdown */}
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
