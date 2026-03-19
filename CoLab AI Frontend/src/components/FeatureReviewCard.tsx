import { useState } from "react"
import {
  Play,
  Square,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Layers,
  GitBranch,
  Send,
} from "lucide-react"

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
  onProceed: () => void
  onStop: () => void
  onClarify: (message: string) => void
}

export function FeatureReviewCard({ data, onProceed, onStop, onClarify }: FeatureReviewCardProps) {
  const [showClarify, setShowClarify] = useState(false)
  const [clarifyText, setClarifyText] = useState("")
  const [responded, setResponded] = useState(false)
  const [expandFrontend, setExpandFrontend] = useState(false)
  const [expandBackend, setExpandBackend] = useState(false)

  const handleProceed = () => {
    setResponded(true)
    onProceed()
  }

  const handleStop = () => {
    setResponded(true)
    onStop()
  }

  const handleClarify = () => {
    if (!clarifyText.trim()) return
    setResponded(true)
    onClarify(clarifyText.trim())
  }

  return (
    <div className="w-full max-w-2xl animate-spring-in">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white/90">Planned Features & Architecture</h3>
            <p className="text-[11px] text-white/40">Review the plan before I start building</p>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold uppercase tracking-wider">
            {data.intent}
          </span>
        </div>

        {/* Features */}
        <div className="px-5 py-4 space-y-4">
          {/* Feature list */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Features</span>
            <div className="mt-2 space-y-1.5">
              {data.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
                  <span className="text-xs text-white/70">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Architecture</span>
            <div className="mt-1.5 flex items-start gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <GitBranch className="w-3.5 h-3.5 text-white/25 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-white/50 leading-relaxed">{data.architecture}</span>
            </div>
          </div>

          {/* Frontend Tasks */}
          {data.frontendTasks.length > 0 && (
            <div>
              <button
                onClick={() => setExpandFrontend((s) => !s)}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-400/60 hover:text-emerald-400/80 transition-colors"
              >
                {expandFrontend ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                Frontend Tasks ({data.frontendTasks.length})
              </button>
              {expandFrontend && (
                <div className="mt-2 space-y-2 pl-1">
                  {data.frontendTasks.map((t, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10">
                      <p className="text-xs text-emerald-400/80 font-medium">{t.task}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">{t.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Backend Tasks */}
          {data.backendTasks.length > 0 && (
            <div>
              <button
                onClick={() => setExpandBackend((s) => !s)}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-blue-400/60 hover:text-blue-400/80 transition-colors"
              >
                {expandBackend ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                Backend Tasks ({data.backendTasks.length})
              </button>
              {expandBackend && (
                <div className="mt-2 space-y-2 pl-1">
                  {data.backendTasks.map((t, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg bg-blue-500/[0.04] border border-blue-500/10">
                      <p className="text-xs text-blue-400/80 font-medium">{t.task}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">{t.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {data.notes && (
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Notes</span>
              <p className="text-[11px] text-white/40 mt-1">{data.notes}</p>
            </div>
          )}

          {/* Clarification input */}
          {showClarify && (
            <div className="flex gap-2">
              <textarea
                value={clarifyText}
                onChange={(e) => setClarifyText(e.target.value)}
                placeholder="Tell me what to change or clarify..."
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white/80 placeholder:text-white/25 focus:outline-none focus:border-primary/30 resize-none"
                rows={2}
                autoFocus
              />
              <button
                onClick={handleClarify}
                disabled={!clarifyText.trim()}
                className="self-end px-3 py-2.5 rounded-xl bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25 transition-all disabled:opacity-30"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        {!responded ? (
          <div className="flex items-center gap-2 px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.01]">
            <button
              onClick={handleProceed}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold border border-primary/20 hover:border-primary/40 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              Proceed
            </button>
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-destructive/10 text-white/50 hover:text-destructive text-xs font-medium border border-white/[0.06] hover:border-destructive/30 transition-all"
            >
              <Square className="w-3 h-3" />
              Stop
            </button>
            <button
              onClick={() => setShowClarify((s) => !s)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/30 hover:text-white/50 text-xs transition-all ml-auto"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {showClarify ? "Hide" : "Other"}
            </button>
          </div>
        ) : (
          <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.01]">
            <span className="text-[11px] text-white/30 font-mono">Response sent</span>
          </div>
        )}
      </div>
    </div>
  )
}
