"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, MessageSquare, Sparkles } from "lucide-react"

interface ProjectInfo {
  name: string
  description: string
  techStack?: {
    frontend?: { framework?: string; styling?: string; libraries?: string[] }
    backend?: { runtime?: string; framework?: string; database?: string; libraries?: string[] }
  }
}

interface ConfirmationCardProps {
  projectInfo: ProjectInfo
  onConfirm: (additionalInput?: string) => void
  onReject: () => void
}

export function ConfirmationCard({ projectInfo, onConfirm, onReject }: ConfirmationCardProps) {
  const [showInput, setShowInput] = useState(false)
  const [input, setInput] = useState("")
  const [responded, setResponded] = useState(false)

  const handleConfirm = () => {
    setResponded(true)
    onConfirm(input.trim() || undefined)
  }

  const handleReject = () => {
    setResponded(true)
    onReject()
  }

  return (
    <div className="w-full max-w-2xl animate-spring-in">
      <div className="rounded-2xl border border-white/[0.10] bg-[var(--surface-raised)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/25 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-gold-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Project Analysis</h3>
            <p className="text-[11px] text-white/40">I've analyzed your requirements</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Project</span>
            <p className="text-sm text-white/80 mt-1">{projectInfo.name}</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Description</span>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">{projectInfo.description}</p>
          </div>

          {projectInfo.techStack && (
            <div className="flex gap-4">
              {projectInfo.techStack.frontend && (
                <div className="flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/60">Frontend</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {[
                      projectInfo.techStack.frontend.framework,
                      projectInfo.techStack.frontend.styling,
                      ...(projectInfo.techStack.frontend.libraries || []),
                    ]
                      .filter(Boolean)
                      .map((t, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/15"
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              {projectInfo.techStack.backend && (
                <div className="flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400/60">Backend</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {[
                      projectInfo.techStack.backend.runtime,
                      projectInfo.techStack.backend.framework,
                      projectInfo.techStack.backend.database,
                      ...(projectInfo.techStack.backend.libraries || []),
                    ]
                      .filter(Boolean)
                      .map((t, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400/80 border border-blue-500/15"
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-white/50 pt-1">
            Would you like me to proceed with building this project?
          </p>

          {/* Optional input */}
          {showInput && (
            <div className="pt-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe additional requirements or clarifications..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white/80 placeholder:text-white/25 focus:outline-none focus:border-gold-500/30 resize-none"
                rows={3}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {!responded ? (
          <div className="flex items-center gap-2 px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.01]">
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-500/15 hover:bg-gold-500/25 text-gold-500 text-xs font-semibold border border-gold-500/20 hover:border-gold-500/40 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Yes, proceed
            </button>
            <button
              onClick={handleReject}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white/70 text-xs font-medium border border-white/[0.06] transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              No, stop
            </button>
            <button
              onClick={() => setShowInput((s) => !s)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/30 hover:text-white/50 text-xs transition-all ml-auto"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {showInput ? "Hide" : "Add details"}
            </button>
          </div>
        ) : (
          <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.01]">
            <span className="text-[11px] text-white/40 font-mono">Response sent</span>
          </div>
        )}
      </div>
    </div>
  )
}
