"use client"

import { useState, useRef } from "react"
import { ChevronDown, Play, Database } from "lucide-react"
import { Button } from "./ui/button"
import { Collapse } from "./Collapse"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

interface TaskItem { task: string; details: string }

interface FeatureReviewData {
  intent: string
  projectMeta: { name: string; description: string }
  features: string[]
  frontendTasks: TaskItem[]
  backendTasks: TaskItem[]
  architecture: string
  techStack?: {
    frontend?: { framework?: string; styling?: string; libraries?: string[] }
    backend?: { runtime?: string; framework?: string; database?: string; libraries?: string[] }
  }
  notes?: string
}

interface FeatureReviewCardProps {
  data: FeatureReviewData
  onProceed: (hostDb?: boolean) => void
  onStop: () => void
  onClarify: (message: string) => void
  readOnly?: boolean
}

export function FeatureReviewCard({ data, onProceed, onStop, readOnly }: FeatureReviewCardProps) {
  const [responded, setResponded] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [expandFrontend, setExpandFrontend] = useState(false)
  const [expandBackend, setExpandBackend] = useState(false)
  const [hostDb, setHostDb] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const needsDb = !!(data.techStack?.backend?.database)
  const handleProceed = () => { setResponded(true); onProceed(hostDb) }
  const isCompleted = readOnly || responded

  useGSAP(() => {
    if (!cardRef.current) return
    const items = cardRef.current.querySelectorAll(".reveal")
    if (items.length > 0) {
      gsap.fromTo(items,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, delay: 0.08, ease: "power2.out" }
      )
    }
  }, { scope: cardRef })

  return (
    <div ref={cardRef} className="w-full animate-spring-in">
      <div
        className="overflow-hidden border border-white/[0.08]"
        style={{ backgroundColor: "#1A1A1A", borderRadius: "6px" }}
      >
        {/* Header */}
        <div className="reveal p-5" style={{ opacity: 0 }}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-[17px] font-bold text-white/90 tracking-[-0.03em] font-display">
                {data.projectMeta?.name || "Project Plan"}
              </h3>
              <p className="text-[12px] text-white/35 mt-1 leading-relaxed">{data.projectMeta?.description}</p>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded bg-gold-500/12 text-gold-500 font-semibold uppercase tracking-widest border border-gold-500/10 flex-shrink-0 mt-1">
              {data.intent}
            </span>
          </div>

          {/* Features as chips */}
          <div className="flex flex-wrap gap-1.5">
            {data.features.map((f, i) => (
              <span
                key={i}
                className="reveal inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-white/55 bg-white/[0.04]"
                style={{ opacity: 0, borderRadius: "4px" }}
              >
                <span className="w-1 h-1 rounded-full bg-gold-500/50 flex-shrink-0" />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Show details toggle */}
        <div className="reveal px-5 pb-4" style={{ opacity: 0 }}>
          <button
            onClick={() => setShowDetails(s => !s)}
            className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/50 transition-colors cursor-pointer"
          >
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showDetails ? "rotate-180" : ""}`} />
            {showDetails ? "Hide details" : "Show architecture & tasks"}
          </button>

          <Collapse open={showDetails}>
            <div className="mt-3 space-y-4">
              {/* Architecture */}
              <div className="border-l-2 border-gold-500/20 pl-3.5">
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1">Architecture</span>
                <p className="text-[12px] text-white/40 leading-[1.7]">{data.architecture}</p>
              </div>

              {/* Tasks — accordion with vertical connector */}
              <div>
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-2">Tasks</span>
                <div className="flex flex-col">
                  {[
                    { key: "frontend" as const, label: "Frontend", tasks: data.frontendTasks, expanded: expandFrontend, toggle: () => setExpandFrontend(s => !s), dotColor: "#34d399", isLast: data.backendTasks.length === 0 },
                    ...(data.backendTasks.length > 0 ? [{ key: "backend" as const, label: "Backend", tasks: data.backendTasks, expanded: expandBackend, toggle: () => setExpandBackend(s => !s), dotColor: "#60a5fa", isLast: true }] : []),
                  ].filter(g => g.tasks.length > 0).map((group) => (
                    <div key={group.key} className="pb-2">
                      {/* Header: dot + button in one row */}
                      <button
                        onClick={group.toggle}
                        className="accordion-trigger w-full flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-150"
                        style={{
                          borderRadius: "8px",
                          border: group.expanded ? "1px solid rgba(255,255,255,0.10)" : "1px solid transparent",
                          backgroundColor: group.expanded ? "rgba(255,255,255,0.05)" : "transparent",
                        }}
                      >
                        <div className="w-2 h-2 flex-shrink-0" style={{ borderRadius: "50%", border: `1.5px solid ${group.dotColor}50`, backgroundColor: `${group.dotColor}20` }} />
                        <span className="text-[13px] font-semibold flex-1 text-left transition-colors" style={{ color: group.expanded ? `${group.dotColor}cc` : "rgba(255,255,255,0.40)" }}>
                          {group.label}
                        </span>
                        <span className="text-[10px] tabular-nums" style={{ color: "rgba(255,255,255,0.20)" }}>{group.tasks.length}</span>
                        <ChevronDown
                          className="w-3.5 h-3.5 transition-transform duration-200"
                          style={{
                            color: group.expanded ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.15)",
                            transform: group.expanded ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        />
                      </button>

                      {/* Expanded content with connector line */}
                      <Collapse open={group.expanded}>
                        <div className="ml-[18px] mt-0">
                          <div className="w-px h-3" style={{ backgroundColor: "rgba(255,255,255,0.10)" }} />
                          <div className="overflow-hidden" style={{ borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                            {group.tasks.map((t, i) => (
                              <div key={i} className="px-4 py-3" style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.05)" } : undefined}>
                                <p className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.60)" }}>{t.task}</p>
                                {t.details && <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.25)" }}>{t.details}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </Collapse>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {data.notes && (
                <p className="text-[11px] text-white/25 leading-[1.7]">{data.notes}</p>
              )}
            </div>
          </Collapse>
        </div>

        {/* Footer */}
        {!isCompleted && (
          <div className="reveal flex items-center justify-between px-5 py-3 border-t border-white/[0.05]" style={{ opacity: 0 }}>
            {needsDb ? (
              <button onClick={() => setHostDb(h => !h)} className="flex items-center gap-2 group cursor-pointer">
                <Database className="w-3.5 h-3.5 text-white/15" />
                <span className="text-[11px] text-white/30">Host database on our server</span>
                <div className={`relative w-8 h-[18px] rounded-full transition-all duration-200 flex-shrink-0 ${hostDb ? "bg-emerald-500/30" : "bg-white/[0.06]"}`}>
                  <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all duration-200 ${hostDb ? "left-[14px] bg-emerald-400" : "left-[2px] bg-white/30"}`} />
                </div>
              </button>
            ) : <div />}
            <Button size="sm" onClick={handleProceed} className="h-8 px-5 bg-gold-500 hover:bg-gold-400 text-black border-0 font-semibold text-[12px] gap-1.5">
              <Play className="w-3 h-3" />
              Proceed to build
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
