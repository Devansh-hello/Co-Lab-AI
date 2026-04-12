"use client"

import { useRef, useState, type FC } from "react"
import { FileText, Target, Users, CheckSquare, AlertCircle, ChevronDown, Rocket } from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

interface PRDFeature {
  name: string
  description: string
  priority: "P0" | "P1" | "P2"
  userStories: string[]
  acceptanceCriteria: string[]
}

interface PRDCardProps {
  prd: {
    projectName: string
    vision: string
    targetUsers: string
    features: PRDFeature[]
    technicalConstraints: string[]
    successMetrics: string[]
    outOfScope: string[]
    mvpDefinition: string
  }
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  P0: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", label: "MVP" },
  P1: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", label: "Important" },
  P2: { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.4)", label: "Nice to have" },
}

function SectionHeader({ icon: Icon, title }: { icon: typeof FileText; title: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <Icon className="w-3 h-3 text-gold-500/50" />
      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">{title}</span>
    </div>
  )
}

export const PRDCard: FC<PRDCardProps> = ({ prd }) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)

  useGSAP(() => {
    if (!cardRef.current) return
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
    )
    const sections = cardRef.current.querySelectorAll(".prd-section")
    if (sections.length > 0) {
      gsap.fromTo(sections,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.25, stagger: 0.05, delay: 0.15, ease: "power2.out" }
      )
    }
  }, { scope: cardRef })

  const p0Features = prd.features.filter(f => f.priority === "P0")
  const otherFeatures = prd.features.filter(f => f.priority !== "P0")

  return (
    <div ref={cardRef} className="w-full" style={{ opacity: 0 }}>
      <div className="overflow-hidden border border-white/[0.08] relative" style={{ backgroundColor: "#1A1A1A", borderRadius: "6px" }}>
        <div
          className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(230,179,62,0.15), transparent)" }}
        />

        {/* Header */}
        <div className="px-4 pt-3.5 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(230,179,62,0.1)" }}>
              <FileText className="w-3 h-3 text-gold-500" />
            </div>
            <span className="text-[13px] font-semibold text-white/90 tracking-[-0.01em]">Product Requirements</span>
            <span className="text-[10px] font-mono text-gold-500/50">{prd.features.length} features</span>
          </div>
          <p className="text-[12px] text-white/50 leading-relaxed pl-7">{prd.vision}</p>
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Target Users */}
          <div className="prd-section" style={{ opacity: 0 }}>
            <SectionHeader icon={Users} title="Target Users" />
            <p className="text-[11px] text-white/50 pl-4">{prd.targetUsers}</p>
          </div>

          {/* MVP Features */}
          <div className="prd-section" style={{ opacity: 0 }}>
            <SectionHeader icon={Rocket} title="MVP Features" />
            <div className="space-y-1.5 pl-4">
              {p0Features.map((feature, i) => (
                <div key={i} className="py-1.5 px-2 rounded" style={{ backgroundColor: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.08)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-red-400 px-1 py-0 rounded" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>P0</span>
                    <span className="text-[11px] font-medium text-white/75">{feature.name}</span>
                  </div>
                  <p className="text-[10px] text-white/35 mt-0.5">{feature.description}</p>
                  {feature.acceptanceCriteria.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {feature.acceptanceCriteria.slice(0, 3).map((ac, j) => (
                        <div key={j} className="flex items-start gap-1.5">
                          <CheckSquare className="w-2.5 h-2.5 text-white/20 flex-shrink-0 mt-0.5" />
                          <span className="text-[9px] text-white/30">{ac}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* MVP Definition */}
          {prd.mvpDefinition && (
            <div className="prd-section" style={{ opacity: 0 }}>
              <SectionHeader icon={Target} title="MVP Definition" />
              <p className="text-[11px] text-white/50 pl-4 italic">{prd.mvpDefinition}</p>
            </div>
          )}

          {/* Expand for more */}
          {(otherFeatures.length > 0 || prd.technicalConstraints.length > 0) && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-[10px] text-gold-500/60 hover:text-gold-500 transition-colors pl-4"
            >
              <ChevronDown
                className="w-3 h-3 transition-transform duration-200"
                style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
              />
              {expanded ? "Show less" : `Show ${otherFeatures.length} more features & constraints`}
            </button>
          )}

          {expanded && (
            <>
              {otherFeatures.length > 0 && (
                <div className="prd-section space-y-1 pl-4">
                  {otherFeatures.map((feature, i) => {
                    const pCfg = PRIORITY_COLORS[feature.priority] || PRIORITY_COLORS.P2
                    return (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <span className="text-[9px] font-bold px-1 py-0 rounded" style={{ color: pCfg.text, backgroundColor: pCfg.bg }}>{feature.priority}</span>
                        <span className="text-[11px] text-white/60">{feature.name}</span>
                        <span className="text-[9px] text-white/25">{feature.description}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {prd.technicalConstraints.length > 0 && (
                <div className="prd-section" style={{ opacity: expanded ? 1 : 0 }}>
                  <SectionHeader icon={AlertCircle} title="Constraints" />
                  <div className="space-y-0.5 pl-4">
                    {prd.technicalConstraints.map((c, i) => (
                      <p key={i} className="text-[10px] text-white/35">{c}</p>
                    ))}
                  </div>
                </div>
              )}

              {prd.outOfScope.length > 0 && (
                <div className="prd-section" style={{ opacity: expanded ? 1 : 0 }}>
                  <SectionHeader icon={AlertCircle} title="Out of Scope" />
                  <div className="space-y-0.5 pl-4">
                    {prd.outOfScope.map((s, i) => (
                      <p key={i} className="text-[10px] text-white/30 line-through decoration-white/10">{s}</p>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
