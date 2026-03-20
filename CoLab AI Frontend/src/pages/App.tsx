"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { useParams, useSearchParams, Navigate } from "react-router-dom"
import { MessageBox } from "../components/messageBox"
import { MessageCard, StreamingDropdown } from "../components/messageCard"
import { IDEModal } from "../components/IDEModal"
import { Sidebar } from "../components/sidebar"
import { ConfirmationCard } from "../components/ConfirmationCard"
import { FeatureReviewCard } from "../components/FeatureReviewCard"
import { useWebSocket } from "../hooks/useWebSocket"
import { api } from "../functions/send"
import {
  Loader2,
  WifiOff,
  Sparkles,
  Zap,
  Code2,
  RotateCcw,
  CheckCircle2,
  Circle,
} from "lucide-react"

// ── Agent status config ──────────────────────────────────────

const AGENT_STATUS: Record<string, { color: string; label: string }> = {
  "Orchestrator Agent": { color: "#D4AF37", label: "Orchestrator" },
  "Frontend Agent":     { color: "#10b981", label: "Frontend" },
  "Backend Agent":      { color: "#3b82f6", label: "Backend" },
  "Review Agent":       { color: "#a855f7", label: "Review" },
}

const PIPELINE_ORDER = ["Orchestrator Agent", "Frontend Agent", "Backend Agent", "Review Agent"]

// ── Pipeline Status Bar ──────────────────────────────────────

function PipelineStatusBar({ currentAgent, completedAgents, currentStatus, tokenCount }: {
  currentAgent?: string
  completedAgents: string[]
  currentStatus: string
  tokenCount: number
}) {
  return (
    <div className="flex items-center gap-3 w-full max-w-3xl px-1 animate-spring-in">
      {/* Agent pills */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {PIPELINE_ORDER.map(agent => {
          const cfg = AGENT_STATUS[agent]
          const isActive = currentAgent === agent
          const isCompleted = completedAgents.includes(agent)
          const isIdle = !isActive && !isCompleted

          return (
            <div
              key={agent}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap
                ${isActive
                  ? "bg-white/[0.06] border border-white/[0.10]"
                  : isCompleted
                    ? "bg-white/[0.03] border border-white/[0.05]"
                    : "opacity-30"
                }`}
            >
              {isActive ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin flex-shrink-0" style={{ color: cfg.color }} />
              ) : isCompleted ? (
                <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0" style={{ color: cfg.color }} />
              ) : (
                <Circle className="w-2 h-2 flex-shrink-0 text-white/15" />
              )}
              <span style={{ color: isIdle ? undefined : cfg.color }} className={isIdle ? "text-white/20" : ""}>
                {cfg.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Status text + tokens */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {currentStatus && (
          <span className="text-[10px] text-white/25 truncate max-w-[160px]">{currentStatus}</span>
        )}
        {tokenCount > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-white/20 font-mono">
            <Zap className="w-2.5 h-2.5 text-primary/40" />
            ~{tokenCount.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────

function App() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const safeProjectId = projectId || ""
  const {
    messages,
    isLoading,
    wsState,
    sendMessage,
    sendConfirmation,
    sendProceed,
  } = useWebSocket(safeProjectId)

  const [previewOpen, setPreviewOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const autoStarted = useRef(false)

  // Auto-send project description on first visit after creation
  useEffect(() => {
    if (autoStarted.current) return
    if (!searchParams.get("autostart")) return
    if (isLoading || !wsState.isConnected) return
    if (messages.length > 0) return

    autoStarted.current = true
    setSearchParams({}, { replace: true })

    api.get(`/project`).then(res => {
      const projects = res.data
      const project = Array.isArray(projects) ? projects.find((p: any) => p._id === projectId) : null
      if (project?.description) {
        sendMessage(project.description, "openrouter", "openai/gpt-oss-120b:free")
      }
    }).catch(() => {})
  }, [searchParams, setSearchParams, isLoading, wsState.isConnected, messages.length, projectId, sendMessage])

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, wsState.currentStatus])

  // Latest frontend files for IDE
  const latestFrontendFiles = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.type === "frontend" && m.data && typeof m.data === "object") {
        const files = Object.entries(m.data).filter(([, v]) => typeof v === "string") as [string, string][]
        if (files.length > 0) return files
      }
    }
    return null
  }, [messages])

  // Find last user message for retry
  const lastUserMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === "user") return messages[i].content
    }
    return null
  }, [messages])

  const canRetry = !wsState.isGenerating && lastUserMessage && messages.length > 0

  const handleRetry = () => {
    if (lastUserMessage) {
      sendMessage(lastUserMessage, "openrouter", "openai/gpt-oss-120b:free")
    }
  }

  if (!projectId) {
    return <Navigate to="/projects" replace />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <Loader2 className="animate-spin h-6 w-6 text-white/20" />
      </div>
    )
  }

  const completedTokens =
    (wsState.tokenUsage.frontend?.totalTokens ?? 0) +
    (wsState.tokenUsage.backend?.totalTokens ?? 0) +
    (wsState.tokenUsage.review?.totalTokens ?? 0)
  const totalTokensDisplay = completedTokens + (wsState.tokenUsage.currentEstimate ?? 0)

  const showPipeline = wsState.isGenerating && (wsState.currentAgent || wsState.completedAgents.length > 0)

  return (
    <>
      {previewOpen && latestFrontendFiles && (
        <IDEModal
          files={latestFrontendFiles}
          title="Frontend IDE"
          onClose={() => setPreviewOpen(false)}
        />
      )}

      <div className="flex flex-row h-screen w-screen bg-background overflow-hidden">
        <Sidebar />

        {/* ── Main Chat Area ───────────────────────────────── */}
        <div className="flex flex-col h-full flex-1 overflow-hidden min-w-0">

          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.05] flex-shrink-0">
            <div className="flex items-center gap-2">
              {!wsState.isConnected && (
                <div className="flex items-center gap-1.5 text-destructive text-[11px]">
                  <WifiOff className="w-3 h-3" />
                  <span>{wsState.error || "Reconnecting..."}</span>
                </div>
              )}
              {wsState.isGenerating && totalTokensDisplay > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/30 text-[10px] font-mono">
                  <Zap className="w-3 h-3 text-primary/50" />
                  <span>~{totalTokensDisplay.toLocaleString()} tokens</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => latestFrontendFiles && setPreviewOpen(true)}
                disabled={!latestFrontendFiles}
                title={latestFrontendFiles ? "Open IDE" : "Generate a project first"}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                  latestFrontendFiles
                    ? "text-emerald-400/80 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12] border-emerald-500/15 hover:border-emerald-500/30"
                    : "text-white/15 bg-transparent border-white/[0.04] cursor-not-allowed"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                IDE
              </button>
            </div>
          </div>

          {/* ── Chat Column ────────────────────────────────── */}
          <div className="flex flex-col flex-1 overflow-hidden min-w-0">

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex flex-col overflow-y-auto overflow-x-hidden gap-4 flex-1 px-6 py-4 pb-8 chat-scroll"
            >
              {messages.length === 0 && !wsState.isGenerating ? (
                /* ── Welcome state ──────────────────── */
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center text-center max-w-md p-8 animate-spring-in">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5">
                      <Sparkles className="w-5 h-5 text-primary/60" />
                    </div>
                    <h3 className="text-base font-semibold text-white/80 mb-2">
                      What would you like to build?
                    </h3>
                    <p className="text-xs text-white/30 mb-5 leading-relaxed max-w-sm">
                      Describe your project idea and the AI agents will generate complete code with frontend, backend, and documentation.
                    </p>
                    <div className="text-[11px] text-white/20 bg-white/[0.02] px-4 py-2.5 rounded-xl border border-white/[0.04] font-mono">
                      "Create a todo app with user authentication"
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    if (message.type === "confirmation" && message.data) {
                      return (
                        <ConfirmationCard
                          key={message.id}
                          projectInfo={message.data}
                          onConfirm={(input) => sendConfirmation(true, input)}
                          onReject={() => sendConfirmation(false)}
                        />
                      )
                    }

                    if (message.type === "feature_review" && message.data) {
                      return (
                        <FeatureReviewCard
                          key={message.id}
                          data={message.data}
                          onProceed={() => sendProceed(true)}
                          onStop={() => sendProceed(false)}
                          onClarify={(text) => sendProceed(false, text)}
                        />
                      )
                    }

                    // Skip orchestrator messages — FeatureReviewCard covers this
                    if (message.type === "orchestrator") return null

                    return <MessageCard key={message.id} message={message} allMessages={messages} />
                  })}

                  {/* Streaming dropdowns */}
                  {wsState.streaming.frontendStream && (
                    <StreamingDropdown
                      content={wsState.streaming.frontendStream}
                      agent="Frontend Agent"
                      isActive={wsState.streaming.activeAgent === "Frontend Agent"}
                      tokenUsage={wsState.tokenUsage.frontend}
                      liveEstimate={
                        wsState.streaming.activeAgent === "Frontend Agent"
                          ? wsState.tokenUsage.currentEstimate
                          : undefined
                      }
                    />
                  )}

                  {wsState.streaming.backendStream && (
                    <StreamingDropdown
                      content={wsState.streaming.backendStream}
                      agent="Backend Agent"
                      isActive={wsState.streaming.activeAgent === "Backend Agent"}
                      tokenUsage={wsState.tokenUsage.backend}
                      liveEstimate={
                        wsState.streaming.activeAgent === "Backend Agent"
                          ? wsState.tokenUsage.currentEstimate
                          : undefined
                      }
                    />
                  )}

                  {wsState.streaming.reviewStream && (
                    <StreamingDropdown
                      content={wsState.streaming.reviewStream}
                      agent="Review Agent"
                      isActive={wsState.streaming.activeAgent === "Review Agent"}
                      tokenUsage={wsState.tokenUsage.review}
                      liveEstimate={
                        wsState.streaming.activeAgent === "Review Agent"
                          ? wsState.tokenUsage.currentEstimate
                          : undefined
                      }
                    />
                  )}

                  {/* Status indicator (when no pipeline agents visible) */}
                  {wsState.isGenerating && wsState.currentStatus && !wsState.currentAgent && wsState.flowStage !== 'waiting_confirmation' && wsState.flowStage !== 'waiting_review' && (
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] max-w-md animate-spring-in">
                      <Loader2 className="animate-spin h-3.5 w-3.5 text-white/25 flex-shrink-0" />
                      <span className="text-xs text-white/40">{wsState.currentStatus}</span>
                    </div>
                  )}

                  {/* Retry button */}
                  {canRetry && (
                    <div className="flex justify-center">
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.10] text-white/30 hover:text-white/50 text-[11px] font-medium transition-all"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Retry
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Pipeline status + Input bar ────────────── */}
            <div className="flex flex-col items-center gap-2 px-6 py-3 flex-shrink-0 border-t border-white/[0.03]">
              {/* Pipeline status bar (above input) */}
              {showPipeline && (
                <PipelineStatusBar
                  currentAgent={wsState.currentAgent}
                  completedAgents={wsState.completedAgents}
                  currentStatus={wsState.currentStatus}
                  tokenCount={totalTokensDisplay}
                />
              )}

              <div className="flex items-center gap-2 w-full max-w-3xl">
                <MessageBox onSendMessage={sendMessage} isGenerating={wsState.isGenerating} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
