"use client"

import { useRef, type FC } from "react"
import { RotateCcw, Save, ChevronRight } from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

interface CheckpointData {
  checkpointId: string
  phase: string
  label: string
}

interface CheckpointBarProps {
  checkpoints: CheckpointData[]
  onResumeCheckpoint: (checkpointId: string) => void
  isGenerating: boolean
}

const PHASE_ORDER = ["understanding", "planning", "building", "reviewing", "testing", "done"]

const PHASE_LABELS: Record<string, string> = {
  understanding: "Understand",
  planning: "Plan",
  building: "Build",
  reviewing: "Review",
  testing: "Test",
  done: "Done",
}

export const CheckpointBar: FC<CheckpointBarProps> = ({ checkpoints, onResumeCheckpoint, isGenerating }) => {
  const barRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!barRef.current) return
    gsap.fromTo(barRef.current,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    )
  }, { scope: barRef })

  if (checkpoints.length === 0) return null

  // Deduplicate checkpoints by phase — keep the latest per phase
  const latestByPhase = new Map<string, CheckpointData>()
  for (const cp of checkpoints) {
    latestByPhase.set(cp.phase, cp)
  }

  const orderedCheckpoints = PHASE_ORDER
    .filter(p => latestByPhase.has(p))
    .map(p => latestByPhase.get(p)!)

  const latestCheckpoint = orderedCheckpoints[orderedCheckpoints.length - 1]

  return (
    <div ref={barRef} className="w-full" style={{ opacity: 0 }}>
      <div
        className="overflow-hidden border border-white/[0.08] relative"
        style={{ backgroundColor: "#1A1A1A", borderRadius: "6px" }}
      >
        <div className="px-4 py-2.5 flex items-center justify-between">
          {/* Phase indicators */}
          <div className="flex items-center gap-1">
            <Save className="w-3.5 h-3.5 text-gold-500/60 mr-1.5" />
            {PHASE_ORDER.map((phase, i) => {
              const hasCheckpoint = latestByPhase.has(phase)
              const isLatest = latestCheckpoint?.phase === phase
              return (
                <div key={phase} className="flex items-center">
                  {i > 0 && <ChevronRight className="w-2.5 h-2.5 text-white/10 mx-0.5" />}
                  <button
                    disabled={!hasCheckpoint || isGenerating}
                    onClick={() => {
                      const cp = latestByPhase.get(phase)
                      if (cp) onResumeCheckpoint(cp.checkpointId)
                    }}
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-all ${
                      hasCheckpoint
                        ? isLatest
                          ? "text-gold-500 bg-gold-500/10 border border-gold-500/20"
                          : "text-white/50 hover:text-white/70 hover:bg-white/[0.04]"
                        : "text-white/15 cursor-default"
                    }`}
                  >
                    {PHASE_LABELS[phase] || phase}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Resume button */}
          {latestCheckpoint && !isGenerating && (
            <button
              onClick={() => onResumeCheckpoint(latestCheckpoint.checkpointId)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium text-gold-500 hover:bg-gold-500/10 transition-colors border border-gold-500/20"
            >
              <RotateCcw className="w-3 h-3" />
              Resume
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
