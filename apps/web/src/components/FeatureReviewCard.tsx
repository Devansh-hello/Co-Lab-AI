"use client"

import { useState, useRef } from "react"
import {
  ChevronRight,
  GitBranch,
  Play,
  Square,
  Database,
} from "lucide-react"
import { Button } from "./ui/button"
import { Collapse } from "./Collapse"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

interface TaskItem {
  task: string
  details: string
}

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
  const [expandFrontend, setExpandFrontend] = useState(false)
  const [expandBackend, setExpandBackend] = useState(false)
  const [hostDb, setHostDb] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const needsDb = !!(data.techStack?.backend?.database)

  const handleProceed = () => { setResponded(true); onProceed(hostDb) }
  const handleStop = () => { setResponded(true); onStop() }

  const isCompleted = readOnly || responded

  // Stagger feature list items on mount
  useGSAP(() => {
    if (!cardRef.current) return
    const items = cardRef.current.querySelectorAll(".feature-item")
    if (items.length > 0) {
      gsap.fromTo(items,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.25, stagger: 0.06, delay: 0.1, ease: "power2.out" }
      )
    }
  }, { scope: cardRef })

  return (
    <div ref={cardRef} className="w-full max-w-3xl animate-spring-in">
      <div className="rounded-2xl border border-white/[0.10] bg-[var(--surface-raised)] overflow-hidden shadow-elevation-1">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white/80">{data.projectMeta?.name || "Project Plan"}</h3>
            <p className="text-[11px] text-white/45 mt-0.5">{data.projectMeta?.description}</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-white/40 font-medium uppercase tracking-wider">
            {data.intent}
          </span>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* Features as stepper */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-2 block">Features</span>
            {data.features.map((f, i) => (
              <div key={i} className="feature-item flex items-start gap-3" style={{ opacity: 0 }}>
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full border border-white/15 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  </div>
                  {i < data.features.length - 1 && <div className="w-px h-4 bg-white/10" />}
                </div>
                <span className="text-sm text-white/70 -mt-0.5">{f}</span>
              </div>
            ))}
          </div>

          {/* Architecture */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1.5 block">Architecture</span>
            <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <GitBranch className="w-3.5 h-3.5 text-white/20 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-white/50 leading-relaxed">{data.architecture}</span>
            </div>
          </div>

          {/* Frontend Tasks */}
          {data.frontendTasks.length > 0 && (
            <div>
              <button
                onClick={() => setExpandFrontend(s => !s)}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-400/50 hover:text-emerald-400/70 transition-colors"
              >
                <ChevronRight className={`w-3 h-3 chevron-rotate ${expandFrontend ? "open" : ""}`} />
                Frontend Tasks ({data.frontendTasks.length})
              </button>
              <Collapse open={expandFrontend}>
                <div className="mt-2 space-y-1.5 pl-1">
                  {data.frontendTasks.map((t, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg bg-emerald-500/[0.03] border border-emerald-500/10">
                      <p className="text-xs text-emerald-400/70 font-medium">{t.task}</p>
                      <p className="text-[11px] text-white/45 mt-0.5">{t.details}</p>
                    </div>
                  ))}
                </div>
              </Collapse>
            </div>
          )}

          {/* Backend Tasks */}
          {data.backendTasks.length > 0 && (
            <div>
              <button
                onClick={() => setExpandBackend(s => !s)}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-blue-400/50 hover:text-blue-400/70 transition-colors"
              >
                <ChevronRight className={`w-3 h-3 chevron-rotate ${expandBackend ? "open" : ""}`} />
                Backend Tasks ({data.backendTasks.length})
              </button>
              <Collapse open={expandBackend}>
                <div className="mt-2 space-y-1.5 pl-1">
                  {data.backendTasks.map((t, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg bg-blue-500/[0.03] border border-blue-500/10">
                      <p className="text-xs text-blue-400/70 font-medium">{t.task}</p>
                      <p className="text-[11px] text-white/45 mt-0.5">{t.details}</p>
                    </div>
                  ))}
                </div>
              </Collapse>
            </div>
          )}

          {data.notes && (
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Notes</span>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">{data.notes}</p>
            </div>
          )}
        </div>

        {/* Database hosting toggle */}
        {!isCompleted && needsDb && (
          <div className="flex items-center gap-3 px-5 py-3 border-t border-white/[0.06]">
            <Database className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[12px] font-medium text-white/50">Host database on our server</p>
              <p className="text-[10px] text-white/40">Free 250MB SQLite database for preview & testing</p>
            </div>
            <button
              onClick={() => setHostDb(h => !h)}
              className={`relative w-10 h-5.5 rounded-full transition-all duration-200 flex-shrink-0 ${
                hostDb ? "bg-emerald-500/30" : "bg-white/[0.06]"
              }`}
            >
              <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full transition-all duration-200 shadow-sm ${
                hostDb ? "left-[18px] bg-emerald-400" : "left-0.5 bg-white/30"
              }`} />
            </button>
          </div>
        )}

        {/* Actions */}
        {!isCompleted && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/[0.06]">
            <Button
              variant="outline"
              size="sm"
              onClick={handleStop}
              className="text-xs h-8 px-4 border-white/10 text-white/40 hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10"
            >
              <Square className="w-3 h-3 mr-1.5" />
              Stop
            </Button>
            <Button size="sm" onClick={handleProceed} className="text-xs h-8 px-4 bg-gold-500 hover:bg-gold-400 text-black border-0">
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Proceed to build
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
