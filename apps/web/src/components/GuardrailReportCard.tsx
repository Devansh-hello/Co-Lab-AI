"use client"

import { useRef, type FC } from "react"
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, ChevronDown } from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { useState } from "react"

interface GuardrailResult {
  name: string
  pass: boolean
  score: number
  reason: string
  severity: string
}

interface GuardrailReportProps {
  side: "frontend" | "backend"
  report: {
    passed: boolean
    results: GuardrailResult[]
    overallScore: number
    criticalFailures: string[]
  }
}

const SEVERITY_CONFIG: Record<string, { icon: typeof Info; color: string }> = {
  critical: { icon: ShieldAlert,   color: "#EF4444" },
  warning:  { icon: AlertTriangle, color: "#F59E0B" },
  info:     { icon: Info,          color: "rgba(255,255,255,0.4)" },
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#4ADE80" : score >= 60 ? "var(--color-gold-500)" : "#EF4444"
  return (
    <span
      className="text-[11px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded"
      style={{ color, backgroundColor: `${color}12`, border: `1px solid ${color}20` }}
    >
      {score}
    </span>
  )
}

export const GuardrailReportCard: FC<GuardrailReportProps> = ({ side, report }) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(!report.passed)

  useGSAP(() => {
    if (!cardRef.current) return
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
    )
  }, { scope: cardRef })

  const Icon = report.passed ? ShieldCheck : ShieldAlert
  const statusColor = report.passed ? "#4ADE80" : "#EF4444"
  const label = side === "frontend" ? "Frontend" : "Backend"

  return (
    <div ref={cardRef} className="w-full" style={{ opacity: 0 }}>
      <div className="overflow-hidden border border-white/[0.08] relative" style={{ backgroundColor: "#1A1A1A", borderRadius: "6px" }}>
        {/* Header */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color: statusColor }} />
            <span className="text-[12px] font-semibold text-white/80">{label} Guardrails</span>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide"
              style={{ color: statusColor, backgroundColor: `${statusColor}12` }}
            >
              {report.passed ? "Passed" : "Failed"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ScoreBadge score={report.overallScore} />
            <ChevronDown
              className="w-3.5 h-3.5 text-white/30 transition-transform duration-200"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
            />
          </div>
        </button>

        {/* Results */}
        {expanded && (
          <div className="px-4 pb-3 space-y-1.5 border-t border-white/[0.04]">
            {report.results.map((result, i) => {
              const sevCfg = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.info
              const SevIcon = sevCfg.icon
              return (
                <div
                  key={i}
                  className="flex items-start gap-2 py-1.5"
                >
                  <SevIcon
                    className="w-3 h-3 flex-shrink-0 mt-0.5"
                    style={{ color: result.pass ? "#4ADE80" : sevCfg.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-white/70">{result.name}</span>
                      <ScoreBadge score={result.score} />
                    </div>
                    <p className="text-[10px] text-white/35 mt-0.5 leading-relaxed">{result.reason}</p>
                  </div>
                </div>
              )
            })}

            {report.criticalFailures.length > 0 && (
              <div className="mt-2 p-2 rounded" style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
                <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wide">Critical Failures</span>
                {report.criticalFailures.map((f, i) => (
                  <p key={i} className="text-[10px] text-red-300/60 mt-1">{f}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
