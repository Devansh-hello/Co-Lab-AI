"use client"

import { useRef, useState, type FC } from "react"
import { Wrench, CheckCircle2, XCircle, ChevronDown, Clock, Zap } from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

interface ToolCallCardProps {
  serverName: string
  toolName: string
  args: Record<string, any>
  success: boolean
  preview: string
  durationMs: number
  phase: string
}

/** Icon colors based on known server names */
const SERVER_COLORS: Record<string, string> = {
  context7: "#6366f1",
  github: "#f0f0f0",
  filesystem: "#f59e0b",
  fetch: "#06b6d4",
  "sequential thinking": "#8b5cf6",
  playwright: "#2dd4bf",
  "chrome devtools": "#fbbf24",
  postgresql: "#336791",
  mongodb: "#4db33d",
  supabase: "#3ecf8e",
  exa: "#4f46e5",
  "exa search": "#4f46e5",
  firecrawl: "#ef4444",
}

function getServerColor(name: string): string {
  return SERVER_COLORS[name.toLowerCase()] || "var(--color-gold-500)"
}

export const ToolCallCard: FC<ToolCallCardProps> = ({
  serverName, toolName, args, success, preview, durationMs, phase,
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const color = getServerColor(serverName)

  useGSAP(() => {
    if (!cardRef.current) return
    gsap.fromTo(cardRef.current,
      { opacity: 0, x: -8, scale: 0.98 },
      { opacity: 1, x: 0, scale: 1, duration: 0.25, ease: "power2.out" }
    )
  }, { scope: cardRef })

  const argsPreview = Object.entries(args)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v.slice(0, 40) : JSON.stringify(v).slice(0, 40)}`)
    .join(', ')

  return (
    <div ref={cardRef} className="w-full" style={{ opacity: 0 }}>
      <div
        className="overflow-hidden border relative"
        style={{
          backgroundColor: "#141414",
          borderColor: `${color}20`,
          borderRadius: "6px",
          borderLeftWidth: "3px",
          borderLeftColor: color,
        }}
      >
        {/* Header */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white/[0.02] transition-colors"
        >
          <Wrench className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />

          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <span className="text-[11px] font-semibold" style={{ color }}>
              {serverName}
            </span>
            <span className="text-[10px] text-white/25">/</span>
            <span className="text-[11px] font-medium text-white/60 font-mono">{toolName}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Duration */}
            <span className="flex items-center gap-0.5 text-[9px] text-white/25 font-mono">
              <Clock className="w-2.5 h-2.5" />
              {durationMs}ms
            </span>

            {/* Status */}
            {success ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/70" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-red-400/70" />
            )}

            <ChevronDown
              className="w-3 h-3 text-white/20 transition-transform duration-200"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
            />
          </div>
        </button>

        {/* Expanded: args + result preview */}
        {expanded && (
          <div className="px-3 pb-2.5 space-y-2 border-t border-white/[0.04]">
            {/* Args */}
            {argsPreview && (
              <div className="mt-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/15 block mb-1">Arguments</span>
                <div className="bg-[#0a0a0a] rounded px-2 py-1.5 border border-white/[0.06]">
                  <code className="text-[10px] text-white/40 font-mono break-all">{argsPreview}</code>
                </div>
              </div>
            )}

            {/* Result preview */}
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/15 block mb-1">
                {success ? "Result" : "Error"}
              </span>
              <div
                className="rounded px-2 py-1.5 border max-h-[120px] overflow-y-auto chat-scroll"
                style={{
                  backgroundColor: success ? "#0a0a0a" : "rgba(239,68,68,0.04)",
                  borderColor: success ? "rgba(255,255,255,0.06)" : "rgba(239,68,68,0.12)",
                }}
              >
                <pre className={`text-[10px] font-mono whitespace-pre-wrap break-all leading-relaxed ${
                  success ? "text-white/35" : "text-red-300/50"
                }`}>
                  {preview}
                </pre>
              </div>
            </div>

            {/* Phase badge */}
            <div className="flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-white/15" />
              <span className="text-[9px] text-white/15 uppercase tracking-wide">
                Used during {phase} generation
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** Compact inline version for the pipeline status area */
export const ToolCallPill: FC<{ serverName: string; toolName: string; success: boolean; durationMs: number }> = ({
  serverName, toolName, success, durationMs,
}) => {
  const color = getServerColor(serverName)
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
      style={{ color, backgroundColor: `${color}10`, border: `1px solid ${color}18` }}
    >
      <Wrench className="w-2.5 h-2.5" />
      {toolName}
      <span className="text-white/20 font-mono">{durationMs}ms</span>
      {success ? (
        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400/50" />
      ) : (
        <XCircle className="w-2.5 h-2.5 text-red-400/50" />
      )}
    </span>
  )
}
