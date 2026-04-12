"use client"

import { useRef, type FC } from "react"
import {
  CheckCircle2,
  Circle,
  Code2,
  Eye,
  Rocket,
  FileText,
  ChevronRight,
} from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

interface FeatureData {
  _id: string
  name: string
  description?: string
  status: string
  priority: string
  qualityScore?: { grade: string; overall: number }
}

interface FeatureTrackerProps {
  features: FeatureData[]
  summary: Record<string, number>
}

const STATUS_CONFIG: Record<string, { icon: typeof Circle; label: string; color: string }> = {
  planned:     { icon: Circle,       label: "Planned",     color: "rgba(255,255,255,0.3)" },
  architected: { icon: FileText,     label: "Architected", color: "#6B8AFF" },
  in_progress: { icon: Code2,        label: "Building",    color: "var(--color-gold-500)" },
  in_review:   { icon: Eye,          label: "In Review",   color: "#C084FC" },
  approved:    { icon: CheckCircle2, label: "Approved",    color: "#4ADE80" },
  deployed:    { icon: Rocket,       label: "Deployed",    color: "#22D3EE" },
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#EF4444",
  high: "#F59E0B",
  medium: "var(--color-gold-500)",
  low: "rgba(255,255,255,0.4)",
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.planned
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase"
      style={{ color: cfg.color, backgroundColor: `${cfg.color}15`, border: `1px solid ${cfg.color}20` }}
    >
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  )
}

function ProgressSegments({ summary }: { summary: Record<string, number> }) {
  const total = summary.total || 1
  const segments = [
    { key: "approved",    color: "#4ADE80" },
    { key: "deployed",    color: "#22D3EE" },
    { key: "in_review",   color: "#C084FC" },
    { key: "in_progress", color: "var(--color-gold-500)" },
    { key: "architected", color: "#6B8AFF" },
    { key: "planned",     color: "rgba(255,255,255,0.15)" },
  ]

  return (
    <div className="flex gap-0.5 h-[4px] rounded-full overflow-hidden bg-white/[0.04]">
      {segments.map(({ key, color }) => {
        const count = summary[key] || 0
        if (count === 0) return null
        return (
          <div
            key={key}
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(count / total) * 100}%`, backgroundColor: color }}
          />
        )
      })}
    </div>
  )
}

export const FeatureTrackerCard: FC<FeatureTrackerProps> = ({ features, summary }) => {
  const cardRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!cardRef.current) return
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    )
    const rows = cardRef.current.querySelectorAll(".feature-row")
    if (rows.length > 0) {
      gsap.fromTo(rows,
        { opacity: 0, x: -6 },
        { opacity: 1, x: 0, duration: 0.25, stagger: 0.04, delay: 0.1, ease: "power2.out" }
      )
    }
  }, { scope: cardRef })

  const completedCount = (summary.approved || 0) + (summary.deployed || 0)
  const total = summary.total || 0

  return (
    <div ref={cardRef} className="w-full" style={{ opacity: 0 }}>
      <div className="overflow-hidden border border-white/[0.08] relative" style={{ backgroundColor: "#1A1A1A", borderRadius: "6px" }}>
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(230,179,62,0.1), transparent)" }}
        />

        {/* Header */}
        <div className="px-4 pt-3.5 pb-3 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(230,179,62,0.1)" }}>
              <FileText className="w-3 h-3 text-gold-500" />
            </div>
            <span className="text-[13px] font-semibold text-white/90 tracking-[-0.01em]">Feature Tracker</span>
          </div>
          <span className="text-[11px] font-mono tabular-nums text-white/40">
            {completedCount}/{total}
          </span>
        </div>

        {/* Progress */}
        <div className="px-4 pt-2.5 pb-2">
          <ProgressSegments summary={summary} />
          <div className="flex gap-3 mt-2">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = summary[key] || 0
              if (count === 0) return null
              return (
                <span key={key} className="text-[9px] font-medium uppercase tracking-wide flex items-center gap-1" style={{ color: cfg.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                  {count}
                </span>
              )
            })}
          </div>
        </div>

        {/* Feature List */}
        <div className="px-3 pb-3 space-y-1">
          {features.slice(0, 10).map((feature) => (
            <div
              key={feature._id}
              className="feature-row flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-white/[0.02] transition-colors"
              style={{ opacity: 0 }}
            >
              <span
                className="w-1 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: PRIORITY_COLORS[feature.priority] || PRIORITY_COLORS.medium }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-white/80 font-medium truncate">{feature.name}</span>
                  {feature.qualityScore?.grade && (
                    <span className="text-[9px] font-mono text-gold-500/60">{feature.qualityScore.grade}</span>
                  )}
                </div>
                {feature.description && (
                  <p className="text-[10px] text-white/30 truncate mt-0.5">{feature.description}</p>
                )}
              </div>
              <StatusPill status={feature.status} />
              <ChevronRight className="w-3 h-3 text-white/15 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
