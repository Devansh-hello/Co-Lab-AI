"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import gsap from "gsap"
import { usePathname, useRouter, useSearchParams, useParams } from "next/navigation"
import { MessageBox } from "../components/messageBox"
import { MessageCard, StreamingDropdown, type BubbleGroupPos } from "../components/messageCard"
import { Sidebar } from "../components/sidebar"
import { MobileSidebar } from "../components/MobileSidebar"
import { UnderstandingCard } from "../components/UnderstandingCard"
import { ClarifyingQuestion } from "../components/ClarifyingQuestion"
import { FeatureReviewCard } from "../components/FeatureReviewCard"
import { EnvSetupCard, EnvButton } from "../components/EnvSetupCard"
import { Collapse } from "../components/Collapse"
import { BGPattern } from "../components/ui/bg-pattern"
import { useWebSocket } from "../hooks/useWebSocket"
import { QAPromptBox } from "../components/QAPromptBox"
import { PipelineReportCard } from "../components/PipelineReportCard"
import { FeatureTrackerCard } from "../components/FeatureTrackerCard"
import { GuardrailReportCard } from "../components/GuardrailReportCard"
import { CheckpointBar } from "../components/CheckpointBar"
import { PRDCard } from "../components/PRDCard"
import { ToolCallCard, ToolCallPill } from "../components/ToolCallCard"
import MainLoadingScreen from "../components/MainLoadingScreen"
import {
  WifiOff,
  Sparkles,
  Zap,
  Code2,
  RotateCcw,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronDown,
  Check,
  Menu,
  Shield,
} from "lucide-react"

// ── Agent status config ──────────────────────────────────────

const AGENT_STATUS: Record<string, { color: string; label: string }> = {
  "Orchestrator Agent": { color: "var(--color-gold-500)", label: "Orchestrator" },
  "Frontend Agent":     { color: "#10b981", label: "Frontend" },
  "Backend Agent":      { color: "#3b82f6", label: "Backend" },
  "Review Agent":       { color: "#a855f7", label: "Review" },
  "Test Agent":         { color: "#f59e0b", label: "Test" },
}

const PIPELINE_ORDER = ["Orchestrator Agent", "Frontend Agent", "Backend Agent", "Review Agent", "Test Agent"]

const IDEModal = dynamic(
  () => import("../components/IDEModal").then((mod) => mod.IDEModal),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-2 text-[12px] text-white/60">
          Loading IDE...
        </div>
      </div>
    ),
  }
)

// ── Pipeline Status Bar ──────────────────────────────────────

function PipelineStatusBar({ currentAgent, completedAgents, currentStatus, tokenCount }: {
  currentAgent?: string
  completedAgents: string[]
  currentStatus: string
  tokenCount: number
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const prevAgentCount = useRef(0)

  // Animate new completions
  useEffect(() => {
    if (!barRef.current) return
    const count = completedAgents.length
    if (count > prevAgentCount.current) {
      // Flash the newly completed badge — subtle 1.04 scale (not 1.15)
      const badges = barRef.current.querySelectorAll(".pipe-badge")
      const newBadge = badges[count - 1]
      if (newBadge) {
        gsap.fromTo(newBadge, { scale: 1.04 }, { scale: 1, duration: 0.38, ease: "power2.out" })
      }
      // Animate the connecting line
      const lines = barRef.current.querySelectorAll(".pipe-line")
      const newLine = lines[count - 1]
      if (newLine) {
        gsap.fromTo(newLine, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 0.15, duration: 0.38, ease: "power2.out" })
      }
    }
    prevAgentCount.current = count
  }, [completedAgents.length])

  return (
    <div ref={barRef} className="flex items-center gap-2 w-full max-w-3xl px-1 animate-spring-in overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {PIPELINE_ORDER.map((agent, i) => {
          const cfg = AGENT_STATUS[agent]
          const isActive = currentAgent === agent
          const isCompleted = completedAgents.includes(agent)
          const isIdle = !isActive && !isCompleted

          return (
            <div key={agent} className="flex items-center">
              <div
                className={`pipe-badge flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-[background-color,border-color,box-shadow,opacity] duration-[180ms] whitespace-nowrap tracking-[-0.02em]
                  ${isActive
                    ? "bg-[#1A1A1A] border border-white/[0.12]"
                    : isCompleted
                      ? "bg-[var(--surface-base)] border border-white/[0.08]"
                      : "opacity-50"
                  }`}
                style={isActive ? { boxShadow: `0 0 12px ${cfg.color}15` } : undefined}
              >
                {isActive ? (
                  <div className="w-2 h-2 rounded-full flex-shrink-0 animate-agent-pulse" style={{ backgroundColor: cfg.color }} />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: cfg.color }} />
                ) : (
                  <Circle className="w-2 h-2 flex-shrink-0 text-white/15" />
                )}
                <span style={{ color: isIdle ? undefined : cfg.color }} className={`${isIdle ? "text-white/20" : ""} hidden sm:inline`}>
                  {cfg.label}
                </span>
              </div>
              {i < PIPELINE_ORDER.length - 1 && (
                <div
                  className={`pipe-line w-4 h-px mx-0.5 origin-left ${isCompleted ? "bg-white/10" : "bg-white/[0.04]"}`}
                  style={isCompleted ? { boxShadow: `0 0 4px ${cfg.color}20` } : undefined}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {currentStatus && (
          <span className="text-[10px] text-white/35 truncate max-w-[140px] font-medium">{currentStatus}</span>
        )}
        {tokenCount > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-white/30 font-mono">
            <Zap className="w-2.5 h-2.5 text-white/25" />
            ~{tokenCount.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Feedback Loop Card ──────────────────────────────────────

function FeedbackCard({ iteration, issues }: { iteration: number; issues: string[] }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const orbitRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardRef.current) return
    // Card entrance — matches --duration-slow (0.38s)
    gsap.fromTo(cardRef.current, { opacity: 0, y: 12, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: "power2.out" })
    // Stagger issues — unified 0.05s stagger, 0.12s delay
    const items = cardRef.current.querySelectorAll(".fb-issue")
    if (items.length > 0) {
      gsap.fromTo(items, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.38, stagger: 0.05, delay: 0.12, ease: "power2.out" })
    }
    // Orbit spin — matches breathe-cycle rhythm (4.5s = 1.5× of 3s)
    if (orbitRef.current) {
      gsap.to(orbitRef.current, { rotation: 360, duration: 4.5, repeat: -1, ease: "none" })
    }
  }, [])

  return (
    <div ref={cardRef} className="max-w-lg" style={{ opacity: 0 }}>
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.08), transparent)" }} />

        {/* Orbiting indicator */}
        <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
          <div ref={orbitRef} className="absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400/60" style={{ boxShadow: "0 0 6px rgba(245,158,11,0.4)" }} />
          </div>
          <RotateCcw className="w-3.5 h-3.5 text-amber-400/50" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-amber-300/80 font-semibold tracking-[-0.02em]">
            Feedback Loop
            <span className="ml-1.5 text-[10px] font-mono text-amber-400/40 bg-amber-500/[0.08] px-1.5 py-0.5 rounded">
              #{iteration}
            </span>
          </p>
          {issues.length > 0 && (
            <ul className="mt-2 space-y-1">
              {issues.slice(0, 3).map((issue: string, i: number) => (
                <li key={i} className="fb-issue text-[11px] text-white/45 leading-relaxed flex items-start gap-1.5" style={{ opacity: 0 }}>
                  <span className="text-amber-400/30 mt-px font-mono text-[9px]">{i + 1}</span>
                  <span className="line-clamp-2">{issue}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────

function App({ projectId: initialProjectId }: { projectId: string }) {
  const params = useParams()
  const projectId = (params?.projectId as string) || initialProjectId
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const {
    messages,
    isLoading,
    wsState,
    sendMessage,
    sendUnderstandingResponse,
    sendQAComplete,
    sendProceed,
    cancelPipeline,
    addMessage,
  } = useWebSocket(projectId)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sidebarWrapRef = useRef<HTMLDivElement>(null)
  const chatAreaRef = useRef<HTMLDivElement>(null)
  const hasPageAnimated = useRef(false)
  const autoStarted = useRef(false)

  // ── Q&A local state ──────────────────────────────────────
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [qaAnswers, setQaAnswers] = useState<Array<{ questionId: string; answer: string }>>([])
  const [qaCollapsed, setQaCollapsed] = useState(false)
  const [firstQuestionAdded, setFirstQuestionAdded] = useState(false)
  const [understandingExpanded, setUnderstandingExpanded] = useState<string | null>(null)
  const [planExpanded, setPlanExpanded] = useState(false)
  const [qaSummaryExpanded, setQaSummaryExpanded] = useState(false)

  const questions = wsState.understandingData?.questions || []
  const isInQAPhase = wsState.flowStage === 'qa'

  // Add the first question when entering Q&A phase
  useEffect(() => {
    if (isInQAPhase && questions.length > 0 && !firstQuestionAdded) {
      setFirstQuestionAdded(true)
      addMessage({
        sender: 'agent',
        username: 'System',
        content: questions[0].question,
        type: 'qa_question',
        data: questions[0],
      })
    }
  }, [isInQAPhase, questions, firstQuestionAdded, addMessage])

  function handleQuestionAnswer(answer: string) {
    const q = questions[currentQuestionIndex]
    if (!q) return

    const newAnswers = [...qaAnswers, { questionId: q.id, answer }]
    setQaAnswers(newAnswers)

    // Add answer as user message
    addMessage({ sender: 'user', username: 'You', content: answer, type: 'qa_answer' })

    if (currentQuestionIndex + 1 < questions.length) {
      const nextQ = questions[currentQuestionIndex + 1]
      setCurrentQuestionIndex(prev => prev + 1)
      // Add next question
      setTimeout(() => {
        addMessage({
          sender: 'agent',
          username: 'System',
          content: nextQ.question,
          type: 'qa_question',
          data: nextQ,
        })
      }, 300)
    } else {
      // All questions answered
      setQaCollapsed(true)
      sendQAComplete(newAnswers)
    }
  }

  // Auto-send project description on first visit after creation
  useEffect(() => {
    if (autoStarted.current) return
    if (!searchParams.get("autostart")) return
    if (isLoading || !wsState.isConnected) return
    if (messages.length > 0) return

    autoStarted.current = true
    if (pathname) {
      router.replace(pathname, { scroll: false })
    }

    const desc = sessionStorage.getItem(`autostart_${projectId}`)
    sessionStorage.removeItem(`autostart_${projectId}`)
    if (desc) {
      sendMessage(desc)
    }
  }, [searchParams, isLoading, wsState.isConnected, messages.length, projectId, sendMessage, router, pathname])

  // Auto-scroll on new messages — smooth scroll only if near bottom
  const prevMessageCount = useRef(0)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const count = messages.length
    const isNewMessage = count > prevMessageCount.current
    prevMessageCount.current = count

    // On initial load, snap instantly
    if (isLoading || !isNewMessage) {
      el.scrollTop = el.scrollHeight
      return
    }

    // Only auto-scroll if user is near the bottom (within 200px)
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom < 200) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    }
  }, [messages.length, isLoading])

  // Page entrance animation — sidebar + chat area in sync
  useEffect(() => {
    if (isLoading || hasPageAnimated.current) return
    hasPageAnimated.current = true
    requestAnimationFrame(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } })
      if (sidebarWrapRef.current) {
        tl.to(sidebarWrapRef.current, { opacity: 1, x: 0, duration: 0.38 }, 0)
      }
      if (chatAreaRef.current) {
        tl.to(chatAreaRef.current, { opacity: 1, y: 0, duration: 0.38 }, 0.05)
      }
    })
  }, [isLoading])

  // iOS virtual keyboard handling — adjust input bar position
  const inputBarRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    function onResize() {
      if (!inputBarRef.current || !vv) return
      const offset = window.innerHeight - vv.height - vv.offsetTop
      inputBarRef.current.style.transform = offset > 0 ? `translateY(-${offset}px)` : ""
    }
    vv.addEventListener("resize", onResize)
    vv.addEventListener("scroll", onResize)
    return () => {
      vv.removeEventListener("resize", onResize)
      vv.removeEventListener("scroll", onResize)
    }
  }, [])

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

  // Latest backend files for IDE
  const latestBackendFiles = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.type === "backend" && m.data && typeof m.data === "object") {
        const files = Object.entries(m.data).filter(([, v]) => typeof v === "string") as [string, string][]
        if (files.length > 0) return files
      }
    }
    return null
  }, [messages])

  // Latest env variables from review
  const latestEnvVars = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.type === "env_setup" && m.data?.envVariables) return m.data.envVariables as string[]
    }
    return null
  }, [messages])

  const [, setEnvValues] = useState<Record<string, string>>({})
  const [showEnvModal, setShowEnvModal] = useState(false)

  // Retry logic — determine what failed and retry from that point
  const retryInfo = useMemo(() => {
    if (wsState.isGenerating || messages.length === 0) return null

    // Check if last message is an error
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.type !== 'error') return null

    // Check if we had a final_plan — means build phase failed
    const hasPlan = messages.some(m => m.type === 'final_plan')
    if (hasPlan) {
      return { type: 'proceed' as const, label: 'Retry build' }
    }

    // Otherwise retry from the beginning
    const userMsg = messages.find(m => m.sender === 'user' && m.type === 'text')
    if (userMsg) {
      return { type: 'message' as const, label: 'Retry', content: userMsg.content }
    }

    return null
  }, [messages, wsState.isGenerating])

  const handleRetry = () => {
    if (!retryInfo) return
    if (retryInfo.type === 'proceed') {
      sendProceed(true)
    } else if (retryInfo.content) {
      sendMessage(retryInfo.content)
    }
  }

  if (!projectId) {
    return <MainLoadingScreen label="Loading project" />
  }

  if (isLoading && messages.length === 0) {
    return <MainLoadingScreen label="Loading project" />
  }

  const completedTokens =
    (wsState.tokenUsage.frontend?.totalTokens ?? 0) +
    (wsState.tokenUsage.backend?.totalTokens ?? 0) +
    (wsState.tokenUsage.review?.totalTokens ?? 0) +
    (wsState.tokenUsage.test?.totalTokens ?? 0)
  const totalTokensDisplay = completedTokens + (wsState.tokenUsage.currentEstimate ?? 0)

  const showPipeline = wsState.isGenerating && (wsState.currentAgent || wsState.completedAgents.length > 0)
    && wsState.flowStage !== 'understanding' && wsState.flowStage !== 'waiting_understanding' && wsState.flowStage !== 'qa'
    && wsState.flowStage !== 'waiting_plan_review'

  // Count Q&A messages for collapse
  const qaQuestionCount = messages.filter(m => m.type === 'qa_question').length

  // Check if understanding was already responded to (from history)
  const understandingCompleted = messages.some(m =>
    m.type === 'final_plan' || m.type === 'qa_summary' || m.type === 'qa_question'
  )

  return (
    <>
      {/* Env modal overlay */}
      {showEnvModal && latestEnvVars && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center animate-overlay-in"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowEnvModal(false) }}
        >
          <div className="animate-popover-in max-w-2xl w-full mx-4">
            <EnvSetupCard
              envVariables={latestEnvVars}
              onSave={(vals) => { setEnvValues(vals); setShowEnvModal(false) }}
            />
          </div>
        </div>
      )}

      {previewOpen && latestFrontendFiles && (
        <IDEModal
          files={latestFrontendFiles}
          backendFiles={latestBackendFiles || undefined}
          title={latestBackendFiles ? "Full-Stack IDE" : "Frontend IDE"}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      <div className="flex flex-row h-screen w-screen bg-background overflow-hidden">
        {/* Desktop sidebar */}
        <div ref={sidebarWrapRef} className="hidden md:block" style={{ opacity: 0, transform: "translateX(-16px)" }}>
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* ── Main Chat Area ───────────────────────────────── */}
        <div ref={chatAreaRef} className="flex flex-col h-full flex-1 overflow-hidden min-w-0" style={{ opacity: 0, transform: "translateY(8px)" }}>

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 md:px-6 py-2 border-b border-white/[0.05] flex-shrink-0 bg-[#050505]">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1.5 rounded-lg text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              {!wsState.isConnected && (
                <div className="flex items-center gap-2 text-amber-400/70 text-[12px] font-mono font-medium">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{wsState.error || "Reconnecting..."}</span>
                </div>
              )}
              {wsState.complexityScore !== undefined && wsState.isGenerating && (
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-semibold tracking-wide uppercase ${
                  wsState.complexityScore <= 2
                    ? 'bg-gold-500/[0.04] border-gold-500/10 text-gold-500/50'
                    : wsState.complexityScore <= 3
                    ? 'bg-gold-500/[0.06] border-gold-500/15 text-gold-500/60'
                    : 'bg-gold-500/[0.08] border-gold-500/20 text-gold-500/70'
                }`}>
                  <Shield className="w-3 h-3" />
                  <span>Complexity {wsState.complexityScore}/5</span>
                </div>
              )}
              {wsState.isGenerating && totalTokensDisplay > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white/35 text-[10px] font-mono">
                  <Zap className="w-3 h-3 text-gold-500/30" />
                  <span>~{totalTokensDisplay.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {latestEnvVars && (
                <EnvButton envVariables={latestEnvVars} onClick={() => setShowEnvModal(e => !e)} />
              )}
              <button
                onClick={() => latestFrontendFiles && setPreviewOpen(true)}
                disabled={!latestFrontendFiles}
                title={latestFrontendFiles ? "Open IDE" : "Generate a project first"}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[13px] font-semibold border transition-[color,background-color,border-color,box-shadow] duration-[180ms] tracking-[-0.02em] ${
                  latestFrontendFiles
                    ? "text-white/90 bg-gold-500/[0.08] hover:bg-gold-500/[0.12] border-gold-500/20 hover:border-gold-500/35 shadow-[0_0_12px_rgba(230,179,62,0.06)]"
                    : "text-white/10 bg-transparent border-white/[0.06] cursor-not-allowed"
                }`}
              >
                <Code2 className={`w-4 h-4 ${latestFrontendFiles ? "text-gold-500/70" : ""}`} />
                <span className="hidden sm:inline">IDE</span>
              </button>
            </div>
          </div>

          {/* ── Chat Column ────────────────────────────────── */}
          <div className="relative flex flex-col flex-1 overflow-hidden min-w-0">
            <BGPattern mask="fade-edges" size={28} fill="rgba(255,255,255,0.03)" />

            {/* Messages */}
            <div
              ref={scrollRef}
              className="relative z-[1] flex flex-col overflow-y-auto overflow-x-hidden gap-4 md:gap-5 flex-1 px-3 md:px-8 py-4 md:py-6 pb-8 md:pb-10 chat-scroll"
            >
              {messages.length === 0 && !wsState.isGenerating ? (
                /* ── Welcome state ──────────────────── */
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center text-center max-w-lg px-6 md:p-10 animate-spring-in">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gold-500/[0.04] border border-gold-500/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(230,179,62,0.04)]">
                      <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-gold-500/40" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-gold-500/35 mb-3">
                      Build something
                    </span>
                    <h3 className="text-xl md:text-2xl font-display italic text-white/85 mb-3 tracking-[-0.03em]">
                      What do you want to create?
                    </h3>
                    <p className="text-[13px] md:text-[14px] text-white/40 mb-8 leading-relaxed max-w-sm font-medium">
                      Describe your idea and AI agents will understand, plan, and generate complete code.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {["Todo app with auth", "E-commerce dashboard", "Chat application"].map((hint) => (
                        <button
                          key={hint}
                          onClick={() => sendMessage(hint)}
                          className="px-3.5 py-2 rounded-xl text-[13px] font-medium text-white/50 bg-white/[0.03] border border-white/[0.10] hover:border-gold-500/30 hover:text-gold-500/80 hover:bg-gold-500/[0.05] transition-[color,border-color,background-color] duration-[180ms]"
                        >
                          {hint}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {(() => {
                    let qaBlockRendered = false

                    return messages.map((message) => {
                      // ── Understanding card ──────────────
                      if (message.type === 'understanding' && message.data) {
                        if (understandingCompleted) {
                          return (
                            <div key={message.id} className="animate-spring-in w-full">
                              <div className="flex-1 min-w-0">
                                <button
                                  onClick={() => setUnderstandingExpanded(prev => prev === message.id ? null : message.id)}
                                  className="accordion-trigger w-full flex items-center gap-2 px-3 py-2 text-sm cursor-pointer"
                                  style={{
                                    borderRadius: "8px",
                                    border: understandingExpanded === message.id ? "1px solid rgba(255,255,255,0.10)" : "1px solid transparent",
                                    backgroundColor: understandingExpanded === message.id ? "rgba(255,255,255,0.05)" : "transparent",
                                    color: understandingExpanded === message.id ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.45)",
                                  }}
                                >
                                  <Check className="w-4 h-4 text-gold-500/50 flex-shrink-0" />
                                  Project understood
                                  <ChevronDown className="w-3.5 h-3.5 ml-auto" style={{ color: "rgba(255,255,255,0.20)", transform: understandingExpanded === message.id ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                                </button>
                                <Collapse open={understandingExpanded === message.id}>
                                  <div className="mt-1 ml-5">
                                    <div className="w-px h-4 ml-2" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
                                    <div className="px-4 py-3" style={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.10)" }}>
                                      <p className="text-sm text-white/50 leading-relaxed">{message.data.summary}</p>
                                    </div>
                                  </div>
                                </Collapse>
                              </div>
                            </div>
                          )
                        }
                        return (
                          <UnderstandingCard
                            key={message.id}
                            summary={message.data.summary}
                            projectName={message.data.projectName}
                            hasQuestions={(message.data.questions?.length ?? 0) > 0}
                            onConfirm={() => sendUnderstandingResponse(true)}
                            onReject={() => sendUnderstandingResponse(false)}
                          />
                        )
                      }

                      // ── Q&A messages (collapsible) ──────
                      if (message.type === 'qa_question' || message.type === 'qa_answer') {
                        if (qaCollapsed) {
                          if (!qaBlockRendered) {
                            qaBlockRendered = true
                            return (
                              <div key="qa-collapsed" className="w-full">
                                <button
                                  onClick={() => setQaCollapsed(false)}
                                  className="accordion-trigger w-full flex items-center gap-2 px-3 py-2 text-sm cursor-pointer"
                                  style={{ borderRadius: "8px", border: "1px solid transparent", backgroundColor: "transparent", color: "rgba(255,255,255,0.45)" }}
                                >
                                  <Check className="w-4 h-4 text-gold-500/50 flex-shrink-0" />
                                  Answered {qaQuestionCount} clarifying {qaQuestionCount === 1 ? 'question' : 'questions'}
                                  <ChevronDown className="w-3.5 h-3.5 ml-auto" style={{ color: "rgba(255,255,255,0.20)" }} />
                                </button>
                              </div>
                            )
                          }
                          return null
                        }


                        // Expanded Q&A
                        if (message.type === 'qa_question' && message.data) {
                          const qIdx = questions.findIndex(q => q.id === message.data.id)
                          const isCurrentQuestion = qIdx === currentQuestionIndex && isInQAPhase
                          const answeredValue = qaAnswers.find(a => a.questionId === message.data.id)?.answer
                          const isFirst = qIdx === 0

                          // Q&A questions are handled by the collapsed accordion or qa_summary
                          // Don't render individual qa_question messages in the chat
                          return null
                        }

                        if (message.type === 'qa_answer') {
                          // Already shown inline in ClarifyingQuestion answered state
                          return null
                        }
                      }

                      // ── Q&A summary (from history) ──────
                      if (message.type === 'qa_summary') {
                        const qaData = message.data as { answers: Array<{ questionId: string; answer: string }>; questions: Array<{ id: string; question: string }> } | null;
                        const answers = qaData?.answers || [];
                        const questions = qaData?.questions || [];
                        return (
                          <div key={message.id} className="animate-spring-in w-full">
                            <button
                              onClick={() => setQaSummaryExpanded(e => !e)}
                              className="accordion-trigger w-full flex items-center gap-2 px-3 py-2 text-sm cursor-pointer"
                              style={{
                                borderRadius: "8px",
                                border: qaSummaryExpanded ? "1px solid rgba(255,255,255,0.10)" : "1px solid transparent",
                                backgroundColor: qaSummaryExpanded ? "rgba(255,255,255,0.05)" : "transparent",
                                color: qaSummaryExpanded ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.45)",
                              }}
                            >
                              <Check className="w-4 h-4 text-gold-500/50 flex-shrink-0" />
                              {message.content}
                              <ChevronDown className="w-3.5 h-3.5 ml-auto" style={{ color: "rgba(255,255,255,0.20)", transform: qaSummaryExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                            </button>
                            <Collapse open={qaSummaryExpanded}>
                              <div className="mt-1 ml-5">
                                <div className="w-px h-3 ml-2" style={{ backgroundColor: "rgba(255,255,255,0.10)" }} />
                                <div className="space-y-1.5" style={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", padding: "12px" }}>
                                  {answers.map((a, i) => {
                                    const q = questions.find(q => q.id === a.questionId);
                                    return (
                                      <div key={i} className="px-3 py-2" style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.05)" } : undefined}>
                                        <p className="text-[11px] text-white/35 mb-0.5">{q?.question || a.questionId}</p>
                                        <p className="text-[13px] text-white/70 font-medium">{a.answer}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </Collapse>
                          </div>
                        )
                      }

                      // ── Retry prompt (failed code generation) ──
                      if (message.type === 'retry_prompt' && message.data) {
                        const target = (message.data as { target: string }).target;
                        const label = target === 'frontend' ? 'Frontend' : 'Backend';
                        return (
                          <div key={message.id} className="w-full max-w-3xl animate-bubble-in px-2 md:px-0">
                            <div className="rounded-xl border border-orange-500/20 bg-[var(--surface-raised)] p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-orange-400 text-[14px]">!</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold text-white/80">{label} generation failed</p>
                                  <p className="text-[11px] text-white/40 mt-0.5">Output couldn't be parsed. You can retry just this agent.</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                                <button
                                  onClick={() => sendMessage(`retry ${target}`)}
                                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-gold-500/10 text-gold-500 border border-gold-500/20 hover:bg-gold-500/20 transition-all"
                                >
                                  Retry {label}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      // ── Final plan card ─────────────────
                      if (message.type === 'final_plan' && message.data) {
                        const planIdx = messages.indexOf(message)
                        const hasSubsequent = messages.slice(planIdx + 1).some(m =>
                          m.type === 'frontend' || m.type === 'backend' || m.type === 'review' || m.type === 'text'
                        )
                        // If build already happened, show as collapsible stepper
                        if (hasSubsequent) {
                          return (
                            <div key={message.id} className="animate-spring-in w-full">
                              <button
                                onClick={() => setPlanExpanded(e => !e)}
                                className="accordion-trigger w-full flex items-center gap-2 px-3 py-2 text-sm cursor-pointer"
                                style={{
                                  borderRadius: "8px",
                                  border: planExpanded ? "1px solid rgba(255,255,255,0.10)" : "1px solid transparent",
                                  backgroundColor: planExpanded ? "rgba(255,255,255,0.05)" : "transparent",
                                  color: planExpanded ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.45)",
                                }}
                              >
                                <Check className="w-4 h-4 text-gold-500/50 flex-shrink-0" />
                                Plan reviewed
                                <ChevronDown className="w-3.5 h-3.5 ml-auto" style={{ color: "rgba(255,255,255,0.20)", transform: planExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                              </button>
                              <Collapse open={planExpanded}>
                                <div className="mt-1 ml-5">
                                  <div className="w-px h-3 ml-2" style={{ backgroundColor: "rgba(255,255,255,0.10)" }} />
                                  <FeatureReviewCard
                                    data={message.data}
                                    onProceed={() => {}}
                                    onStop={() => {}}
                                    onClarify={() => {}}
                                    readOnly
                                  />
                                </div>
                              </Collapse>
                            </div>
                          )
                        }
                        return (
                          <div key={message.id} className="w-full">
                            <div className="flex-1 min-w-0">
                              <FeatureReviewCard
                                data={message.data}
                                onProceed={() => sendProceed(true)}
                                onStop={() => sendProceed(false)}
                                onClarify={() => {}}
                              />
                            </div>
                          </div>
                        )
                      }

                      // ── Review & Test — skip individual render, shown in PipelineReportCard ──
                      if (message.type === 'review' && message.data) {
                        return null
                      }
                      if (message.type === 'test' && message.data) {
                        return null
                      }

                      // ── Quality score — render combined PipelineReportCard ──
                      if (message.type === 'quality_score' && message.data) {
                        const reviewMsg = messages.find(m => m.type === 'review' && m.data)
                        const testMsg = messages.find(m => m.type === 'test' && m.data)
                        return (
                          <PipelineReportCard
                            key={message.id}
                            reviewData={reviewMsg?.data}
                            testData={testMsg?.data}
                            qualityData={{
                              grade: message.data.grade,
                              metrics: message.data.metrics,
                              overall: message.data.overall,
                              needsFeedback: message.data.needsFeedback,
                            }}
                          />
                        )
                      }

                      // ── PRD card (init mode) ──────────────
                      if (message.data?.prd) {
                        return <PRDCard key={message.id} prd={message.data.prd} />
                      }

                      // ── Tool call card ─────────────────────
                      if (message.data?.toolCall) {
                        const tc = message.data.toolCall
                        return (
                          <ToolCallCard
                            key={message.id}
                            serverName={tc.call.serverName}
                            toolName={tc.call.toolName}
                            args={tc.call.args}
                            success={tc.result.success}
                            preview={tc.result.preview}
                            durationMs={tc.result.durationMs}
                            phase={tc.phase}
                          />
                        )
                      }

                      // ── Feedback iteration notice ─────────
                      if (message.type === 'feedback_iteration' && message.data) {
                        return (
                          <FeedbackCard key={message.id} iteration={message.data.iteration} issues={message.data.issues || []} />
                        )
                      }

                      // ── Env setup card ─────────────────
                      if (message.type === 'env_setup' && message.data?.envVariables) {
                        return (
                          <EnvSetupCard
                            key={message.id}
                            envVariables={message.data.envVariables}
                            onSave={(vals) => setEnvValues(vals)}
                          />
                        )
                      }

                      // ── Skip orchestrator (covered by final_plan) ──
                      if (message.type === 'orchestrator') return null

                      // ── Regular messages ────────────────
                      // Compute group position for consecutive same-sender bubbles
                      const msgIdx = messages.indexOf(message)
                      const isSimpleAiBubble = message.sender === 'agent' && ((message.type === 'text' && !message.data) || message.type === 'error')
                      const isUserText = message.sender === 'user'
                      let groupPos: BubbleGroupPos = "solo"
                      if (isSimpleAiBubble || isUserText) {
                        const prev = msgIdx > 0 ? messages[msgIdx - 1] : null
                        const next = msgIdx < messages.length - 1 ? messages[msgIdx + 1] : null
                        const prevIsAi = prev && prev.sender === 'agent' && prev.type !== 'orchestrator' && prev.type !== 'qa_question' && prev.type !== 'qa_answer' && prev.type !== 'qa_summary' && prev.type !== 'understanding'
                        const nextIsAi = next && next.sender === 'agent' && next.type !== 'orchestrator' && next.type !== 'qa_question' && next.type !== 'qa_answer' && next.type !== 'qa_summary' && next.type !== 'understanding'
                        const prevSame = isUserText ? (prev && prev.sender === 'user') : prevIsAi
                        const nextSame = isUserText ? (next && next.sender === 'user') : nextIsAi
                        if (prevSame && nextSame) groupPos = "middle"
                        else if (prevSame) groupPos = "last"
                        else if (nextSame) groupPos = "first"
                      }
                      return <MessageCard key={message.id} message={message} allMessages={messages} onRetry={message.type === 'error' && retryInfo ? handleRetry : undefined} groupPos={groupPos} />
                    })
                  })()}

                  {/* Streaming dropdowns */}
                  {wsState.streaming.frontendStream && (
                    <StreamingDropdown
                      content={wsState.streaming.frontendStream}
                      agent="Frontend Agent"
                      isActive={!!wsState.streaming.frontendStream && !wsState.completedAgents.includes('Frontend Agent')}
                      tokenUsage={wsState.tokenUsage.frontend}
                      liveEstimate={wsState.tokenUsage.currentEstimate}
                    />
                  )}

                  {wsState.streaming.backendStream && (
                    <StreamingDropdown
                      content={wsState.streaming.backendStream}
                      agent="Backend Agent"
                      isActive={!!wsState.streaming.backendStream && !wsState.completedAgents.includes('Backend Agent')}
                      tokenUsage={wsState.tokenUsage.backend}
                      liveEstimate={wsState.tokenUsage.currentEstimate}
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
                          ? wsState.tokenUsage.currentEstimate : undefined
                      }
                    />
                  )}

                  {wsState.streaming.testStream && (
                    <StreamingDropdown
                      content={wsState.streaming.testStream}
                      agent="Test Agent"
                      isActive={wsState.streaming.activeAgent === "Test Agent"}
                      tokenUsage={wsState.tokenUsage.test}
                      liveEstimate={
                        wsState.streaming.activeAgent === "Test Agent"
                          ? wsState.tokenUsage.currentEstimate : undefined
                      }
                    />
                  )}

                  {/* Status indicator */}
                  {wsState.isGenerating && wsState.currentStatus && !wsState.currentAgent
                    && wsState.flowStage !== 'waiting_understanding' && wsState.flowStage !== 'qa'
                    && wsState.flowStage !== 'waiting_plan_review' && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1A1A1A] border border-white/[0.08] max-w-md animate-bubble-in">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/25 typing-dot" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/25 typing-dot" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/25 typing-dot" />
                      </div>
                      <span className="text-[13px] text-white/35 font-medium">{wsState.currentStatus}</span>
                    </div>
                  )}

                  {/* Retry button — only show if last message isn't an error (errors have inline retry) */}
                  {retryInfo && messages[messages.length - 1]?.type !== 'error' && (
                    <div className="flex justify-center">
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500/[0.06] hover:bg-gold-500/[0.10] border border-gold-500/20 hover:border-gold-500/35 text-gold-500/70 hover:text-gold-500 text-[13px] font-semibold tracking-[-0.02em] transition-[color,background-color,border-color] duration-[180ms]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {retryInfo.label}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Pipeline status + Input bar ────────────── */}
            <div ref={inputBarRef} className="flex flex-col items-center gap-3 px-3 md:px-8 pt-4 flex-shrink-0 border-t border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] transition-transform duration-100" style={{ paddingBottom: "max(2.5rem, calc(var(--safe-bottom) + 1.5rem))" }}>
              {showPipeline && (
                <PipelineStatusBar
                  currentAgent={wsState.currentAgent}
                  completedAgents={wsState.completedAgents}
                  currentStatus={wsState.currentStatus}
                  tokenCount={totalTokensDisplay}
                />
              )}

              {/* Tool calls during generation */}
              {wsState.toolCalls && wsState.toolCalls.length > 0 && wsState.isGenerating && (
                <div className="w-full max-w-3xl flex flex-wrap gap-1.5 px-1">
                  {wsState.toolCalls.map((tc, i) => (
                    <ToolCallPill
                      key={i}
                      serverName={tc.call.serverName}
                      toolName={tc.call.toolName}
                      success={tc.result.success}
                      durationMs={tc.result.durationMs}
                    />
                  ))}
                </div>
              )}

              {/* Checkpoint resume bar */}
              {wsState.checkpoints && wsState.checkpoints.length > 0 && (
                <div className="w-full max-w-3xl">
                  <CheckpointBar
                    checkpoints={wsState.checkpoints}
                    onResumeCheckpoint={resumeCheckpoint}
                    isGenerating={wsState.isGenerating}
                  />
                </div>
              )}

              {/* Guardrail reports */}
              {wsState.guardrailReports && (
                <div className="w-full max-w-3xl space-y-1.5">
                  {wsState.guardrailReports.frontend && (
                    <GuardrailReportCard side="frontend" report={wsState.guardrailReports.frontend} />
                  )}
                  {wsState.guardrailReports.backend && (
                    <GuardrailReportCard side="backend" report={wsState.guardrailReports.backend} />
                  )}
                </div>
              )}

              {/* Feature tracker */}
              {wsState.features && wsState.features.length > 0 && wsState.featureSummary && (
                <div className="w-full max-w-3xl">
                  <FeatureTrackerCard
                    features={wsState.features}
                    summary={wsState.featureSummary}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 w-full max-w-3xl mb-4">
                <MessageBox
                  onSendMessage={sendMessage}
                  onStop={cancelPipeline}
                  isGenerating={wsState.isGenerating}
                  hasMessages={messages.length > 0}
                  qaQuestion={isInQAPhase && questions[currentQuestionIndex] ? questions[currentQuestionIndex].question : undefined}
                  qaOptions={isInQAPhase && questions[currentQuestionIndex] ? questions[currentQuestionIndex].options : undefined}
                  qaQuestionNumber={isInQAPhase ? currentQuestionIndex + 1 : undefined}
                  qaTotalQuestions={isInQAPhase ? questions.length : undefined}
                  onQAAnswer={isInQAPhase ? handleQuestionAnswer : undefined}
                  onQAPrev={isInQAPhase && currentQuestionIndex > 0 ? () => setCurrentQuestionIndex(i => i - 1) : undefined}
                  onQANext={isInQAPhase && currentQuestionIndex < qaAnswers.length && currentQuestionIndex + 1 < questions.length ? () => setCurrentQuestionIndex(i => i + 1) : undefined}
                  canQAPrev={isInQAPhase && currentQuestionIndex > 0}
                  canQANext={isInQAPhase && currentQuestionIndex < qaAnswers.length && currentQuestionIndex + 1 < questions.length}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
