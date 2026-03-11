"use client"

import "../index.css"
import React from "react"
import { useParams, Navigate } from "react-router-dom"
import { MessageBox } from "../components/messageBox"
import { MessageCard, StreamingDropdown } from "../components/messageCard"
import { Sidebar } from "../components/sidebar"
import { useWebSocket } from "../hooks/useWebSocket"
import { Loader2, WifiOff, Sparkles, ClipboardList, Palette, Server, ShieldCheck, Zap } from "lucide-react"

// ─── Per-agent accent config ──────────────────────────────────

const AGENT_CONFIG: Record<string, {
  borderColor: string
  textColor: string
  bgColor: string
  glow: string
  icon: React.ReactNode
}> = {
  'Orchestrator Agent': {
    borderColor: 'border-t-primary',
    textColor: 'text-primary',
    bgColor: 'bg-primary/20',
    glow: 'shadow-gold-glow',
    icon: <ClipboardList className="w-4 h-4 text-primary" />,
  },
  'Frontend Agent': {
    borderColor: 'border-t-emerald-500',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    icon: <Palette className="w-4 h-4 text-emerald-400" />,
  },
  'Backend Agent': {
    borderColor: 'border-t-blue-500',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
    icon: <Server className="w-4 h-4 text-blue-400" />,
  },
  'Review Agent': {
    borderColor: 'border-t-purple-500',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    icon: <ShieldCheck className="w-4 h-4 text-purple-400" />,
  },
}

function App() {
  const { projectId } = useParams<{ projectId: string }>()
  const safeProjectId = projectId || ""
  const { messages, isLoading, wsState, sendMessage } = useWebSocket(safeProjectId)

  if (!projectId) {
    return <Navigate to="/projects" replace />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background bg-grainy">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  const hasActiveStream =
    (wsState.currentAgent === 'Frontend Agent' && wsState.streaming.frontendStream) ||
    (wsState.currentAgent === 'Backend Agent' && wsState.streaming.backendStream) ||
    (wsState.currentAgent === 'Review Agent' && wsState.streaming.reviewStream)

  const showBuildingCard = wsState.isGenerating && wsState.currentStatus && !hasActiveStream
  const agentCfg = wsState.currentAgent ? AGENT_CONFIG[wsState.currentAgent] : null

  const completedTokens =
    (wsState.tokenUsage.frontend?.totalTokens ?? 0) +
    (wsState.tokenUsage.backend?.totalTokens ?? 0) +
    (wsState.tokenUsage.review?.totalTokens ?? 0)
  const totalTokensDisplay = completedTokens + (wsState.tokenUsage.currentEstimate ?? 0)

  return (
    <div className="flex flex-row p-2 gap-2 h-screen w-screen bg-background bg-grainy overflow-hidden">
      <Sidebar />

      {/* ── Main Chat Area ─────────────────────────────── */}
      <div className="flex flex-col h-full flex-1 overflow-hidden gap-2 min-w-0">

        {/* Connection warning */}
        {!wsState.isConnected && (
          <div className="backdrop-blur-md bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded-xl text-center text-xs flex-shrink-0 flex items-center justify-center gap-2 animate-spring-in">
            <WifiOff className="w-3.5 h-3.5" />
            <span>{wsState.error || "Connecting to AI service..."}</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex flex-col overflow-y-auto overflow-x-hidden gap-3 flex-1 px-1 py-1">

          {messages.length === 0 && !wsState.isGenerating ? (
            /* ── Empty / Welcome state ──────────────── */
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center text-center max-w-lg p-10 rounded-2xl backdrop-blur-xl bg-white/3 border border-white/8 shadow-[0_8px_40px_rgba(0,0,0,0.5)] animate-spring-in">
                <div className="bg-primary/15 border border-primary/25 rounded-2xl p-4 mb-5 shadow-gold-glow shine-effect shine-gold">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2 tracking-wide">AI Project Generator</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Describe your project idea and I'll generate complete code, documentation, and deployment guides.
                </p>
                <p className="text-xs text-muted-foreground/70 bg-white/5 px-3 py-2 rounded-lg border border-white/8 font-mono">
                  "Create a todo app with user authentication"
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))}

              {wsState.streaming.frontendStream && (
                <StreamingDropdown
                  content={wsState.streaming.frontendStream}
                  agent="Frontend Agent"
                  isActive={wsState.streaming.activeAgent === 'Frontend Agent'}
                  tokenUsage={wsState.tokenUsage.frontend}
                  liveEstimate={wsState.streaming.activeAgent === 'Frontend Agent' ? wsState.tokenUsage.currentEstimate : undefined}
                />
              )}

              {wsState.streaming.backendStream && (
                <StreamingDropdown
                  content={wsState.streaming.backendStream}
                  agent="Backend Agent"
                  isActive={wsState.streaming.activeAgent === 'Backend Agent'}
                  tokenUsage={wsState.tokenUsage.backend}
                  liveEstimate={wsState.streaming.activeAgent === 'Backend Agent' ? wsState.tokenUsage.currentEstimate : undefined}
                />
              )}

              {wsState.streaming.reviewStream && (
                <StreamingDropdown
                  content={wsState.streaming.reviewStream}
                  agent="Review Agent"
                  isActive={wsState.streaming.activeAgent === 'Review Agent'}
                  tokenUsage={wsState.tokenUsage.review}
                  liveEstimate={wsState.streaming.activeAgent === 'Review Agent' ? wsState.tokenUsage.currentEstimate : undefined}
                />
              )}

              {/* Building card */}
              {showBuildingCard && (
                <div className="w-full flex justify-start animate-spring-in">
                  <div className={`backdrop-blur-md bg-card/50 border border-white/8 border-t-2 ${agentCfg?.borderColor ?? 'border-t-primary'} rounded-xl rounded-bl-sm px-4 py-3 min-w-[28%] max-w-[65%] ${agentCfg?.glow ?? 'shadow-gold-glow'}`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-lg ${agentCfg?.bgColor ?? 'bg-primary/20'}`}>
                          {agentCfg?.icon ?? <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                        </div>
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${agentCfg?.textColor ?? 'text-primary'}`}>
                          {wsState.currentAgent}
                        </span>
                        {wsState.currentProvider && (
                          <img
                            src={
                              wsState.currentProvider === 'gemini'
                                ? 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png'
                                : wsState.currentProvider === 'glm'
                                  ? 'https://cdn.z.ai/favicon.ico'
                                  : wsState.currentProvider === 'anthropic'
                                    ? 'https://www.anthropic.com/favicon.ico'
                                    : wsState.currentProvider === 'openai'
                                      ? 'https://cdn.openai.com/API/logo-assets/openai-logomark.png'
                                      : 'https://openrouter.ai/favicon.ico'
                            }
                            alt=""
                            className="w-3.5 h-3.5 rounded-sm ml-auto opacity-60"
                          />
                        )}
                      </div>
                      {wsState.currentModel && (
                        <span className="text-[10px] text-muted-foreground font-mono pl-7">
                          {wsState.currentModel}
                        </span>
                      )}
                      <div className="flex items-center gap-2 pl-0.5">
                        <Loader2 className="animate-spin h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-foreground">{wsState.currentStatus}</span>
                      </div>
                      {totalTokensDisplay > 0 && (
                        <div className="flex items-center gap-1.5 pt-1 border-t border-white/8">
                          <Zap className="w-3 h-3 text-primary/70" />
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ~{totalTokensDisplay.toLocaleString()} tokens
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Input bar ──────────────────────────────── */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          {wsState.isGenerating && totalTokensDisplay > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] font-mono animate-pulse">
              <Zap className="w-3 h-3" />
              <span>~{totalTokensDisplay.toLocaleString()} tokens</span>
              {completedTokens > 0 && wsState.tokenUsage.currentEstimate > 0 && (
                <span className="text-muted-foreground ml-1">
                  ({completedTokens.toLocaleString()} + {wsState.tokenUsage.currentEstimate.toLocaleString()} est.)
                </span>
              )}
            </div>
          )}
          <MessageBox onSendMessage={sendMessage} isGenerating={wsState.isGenerating} />
        </div>
      </div>
    </div>
  )
}

export default App
