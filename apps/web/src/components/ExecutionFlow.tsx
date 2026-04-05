"use client"

import React, { useState, useCallback, useRef } from "react"
import {
  ClipboardList,
  Palette,
  Server,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Circle,
} from "lucide-react"

type NodeStatus = "idle" | "active" | "completed"

interface NodeConfig {
  id: string
  label: string
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>
  color: string
  row: number
  col: number
}

const NODE_DEFS: NodeConfig[] = [
  { id: "orchestrator", label: "Orchestrator", icon: ClipboardList, color: "var(--color-gold-500)", row: 0, col: 1 },
  { id: "frontend", label: "Frontend", icon: Palette, color: "#10b981", row: 1, col: 0 },
  { id: "backend", label: "Backend", icon: Server, color: "#3b82f6", row: 1, col: 2 },
  { id: "review", label: "Review", icon: ShieldCheck, color: "#a855f7", row: 2, col: 1 },
]

const CONNECTIONS: [string, string][] = [
  ["orchestrator", "frontend"],
  ["orchestrator", "backend"],
  ["frontend", "review"],
  ["backend", "review"],
]

const AGENT_TO_NODE: Record<string, string> = {
  "Orchestrator Agent": "orchestrator",
  "Frontend Agent": "frontend",
  "Backend Agent": "backend",
  "Review Agent": "review",
}

interface ExecutionFlowProps {
  currentAgent?: string
  completedAgents: string[]
  isGenerating: boolean
}

export function ExecutionFlow({ currentAgent, completedAgents, isGenerating }: ExecutionFlowProps) {
  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({})
  const dragState = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null)

  const getStatus = useCallback(
    (nodeId: string): NodeStatus => {
      if (currentAgent && AGENT_TO_NODE[currentAgent] === nodeId) return "active"
      if (completedAgents.some((a) => AGENT_TO_NODE[a] === nodeId)) return "completed"
      return "idle"
    },
    [currentAgent, completedAgents]
  )

  const cellW = 120
  const cellH = 90
  const padX = 20
  const padY = 16
  const nodeW = 80
  const nodeH = 72

  const getPos = (cfg: NodeConfig) => ({
    x: padX + cfg.col * cellW + (cellW - nodeW) / 2 + (offsets[cfg.id]?.x ?? 0),
    y: padY + cfg.row * cellH + (cellH - nodeH) / 2 + (offsets[cfg.id]?.y ?? 0),
  })

  const getCenterPos = (cfg: NodeConfig) => {
    const p = getPos(cfg)
    return { cx: p.x + nodeW / 2, cy: p.y + nodeH / 2 }
  }

  const nodeMap = Object.fromEntries(NODE_DEFS.map((n) => [n.id, n]))

  // Pointer-based drag handlers
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    dragState.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: offsets[id]?.x ?? 0,
      origY: offsets[id]?.y ?? 0,
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return
    const { id, startX, startY, origX, origY } = dragState.current
    setOffsets(prev => ({
      ...prev,
      [id]: { x: origX + e.clientX - startX, y: origY + e.clientY - startY },
    }))
  }

  const handlePointerUp = () => {
    dragState.current = null
  }

  return (
    <div className="relative w-full select-none" style={{ height: 3 * cellH + padY * 2 }}>
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        {CONNECTIONS.map(([fromId, toId]) => {
          const from = nodeMap[fromId]
          const to = nodeMap[toId]
          if (!from || !to) return null

          const fromStatus = getStatus(fromId)
          const toStatus = getStatus(toId)
          const active = fromStatus !== "idle" && toStatus !== "idle"
          const partial = fromStatus !== "idle" || toStatus !== "idle"
          const c1 = getCenterPos(from)
          const c2 = getCenterPos(to)

          return (
            <line
              key={`${fromId}-${toId}`}
              x1={c1.cx} y1={c1.cy} x2={c2.cx} y2={c2.cy}
              stroke={active ? from.color : partial ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)"}
              strokeWidth={active ? 2 : 1}
              strokeDasharray={active ? undefined : "6 4"}
              opacity={active ? 0.5 : 0.4}
              className="transition-[stroke,stroke-width,opacity] duration-300"
            />
          )
        })}
      </svg>

      {/* Nodes */}
      {NODE_DEFS.map((cfg) => {
        const status = getStatus(cfg.id)
        const basePos = {
          x: padX + cfg.col * cellW + (cellW - nodeW) / 2,
          y: padY + cfg.row * cellH + (cellH - nodeH) / 2,
        }

        return (
          <div
            key={cfg.id}
            onPointerDown={(e) => handlePointerDown(e, cfg.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`absolute flex flex-col items-center justify-center gap-1 rounded-xl border cursor-grab active:cursor-grabbing transition-[background,border-color,opacity] duration-200 touch-none
              ${status === "active"
                ? "bg-white/[0.06] border-white/15"
                : status === "completed"
                  ? "bg-white/[0.04] border-white/10"
                  : "bg-white/[0.02] border-white/[0.04]"
              }`}
            style={{
              width: nodeW,
              height: nodeH,
              left: basePos.x + (offsets[cfg.id]?.x ?? 0),
              top: basePos.y + (offsets[cfg.id]?.y ?? 0),
              zIndex: status === "active" ? 3 : status === "completed" ? 2 : 1,
              boxShadow:
                status === "active"
                  ? `0 0 24px ${cfg.color}30, 0 0 48px ${cfg.color}15, inset 0 0 12px ${cfg.color}08`
                  : status === "completed"
                    ? `0 0 8px ${cfg.color}15`
                    : "none",
              opacity: status === "idle" ? 0.35 : 1,
            }}
          >
            {status === "active" ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: cfg.color }} />
            ) : status === "completed" ? (
              <CheckCircle2 className="w-5 h-5" style={{ color: cfg.color }} />
            ) : (
              <Circle className="w-4 h-4" style={{ color: "rgba(255,255,255,0.15)" }} />
            )}
            <span
              className="text-[10px] font-semibold tracking-wide"
              style={{
                color:
                  status === "active"
                    ? cfg.color
                    : status === "completed"
                      ? "rgba(255,255,255,0.6)"
                      : "rgba(255,255,255,0.2)",
              }}
            >
              {cfg.label}
            </span>

            {/* Pulse ring for active — CSS animation, no JS */}
            {status === "active" && (
              <div
                className="absolute inset-0 rounded-xl border animate-pulse"
                style={{ borderColor: cfg.color, opacity: 0.3 }}
              />
            )}
          </div>
        )
      })}

      {isGenerating && currentAgent && (
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <span className="text-[10px] text-white/30 font-mono">
            drag nodes to rearrange
          </span>
        </div>
      )}
    </div>
  )
}
