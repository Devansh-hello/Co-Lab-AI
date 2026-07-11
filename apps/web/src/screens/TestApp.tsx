"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import gsap from "gsap"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
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
import { TestResultsCard } from "../components/TestResultsCard"
import { QualityScoreCard } from "../components/QualityScoreCard"
import MainLoadingScreen from "../components/MainLoadingScreen"
import Link from "next/link"
import {
  WifiOff,
  Sparkles,
  Zap,
  Code2,
  RotateCcw,
  CheckCircle2,
  Circle,
  ChevronRight,
  Check,
  Menu,
  Shield,
  ChevronDown,
  Cpu,
  MonitorSmartphone,
  Server,
  Eye,
  FlaskConical,
  Home,
  FolderOpen,
  Plug,
  Settings,
} from "lucide-react"

// ── Agent status config ─────────────────────────────────────────

const AGENT_STATUS: Record<string, { color: string; label: string; icon: typeof Cpu }> = {
  "Orchestrator Agent": { color: "#E6B33E", label: "Orchestrator", icon: Cpu },
  "Frontend Agent": { color: "#10b981", label: "Frontend", icon: MonitorSmartphone },
  "Backend Agent": { color: "#3b82f6", label: "Backend", icon: Server },
  "Review Agent": { color: "#a855f7", label: "Review", icon: Eye },
  "Test Agent": { color: "#f59e0b", label: "Test", icon: FlaskConical },
}

const PIPELINE_ORDER = [
  "Orchestrator Agent",
  "Frontend Agent",
  "Backend Agent",
  "Review Agent",
  "Test Agent",
]

// ── Phase definitions ───────────────────────────────────────────

type Phase = "understanding" | "planning" | "generation" | "review" | "complete"

const PHASES: Record<Phase, { label: string; icon: typeof Sparkles; color: string }> = {
  understanding: { label: "Understanding", icon: Sparkles, color: "#E6B33E" },
  planning: { label: "Planning", icon: Cpu, color: "#E6B33E" },
  generation: { label: "Code Generation", icon: Code2, color: "#10b981" },
  review: { label: "Review & Testing", icon: Eye, color: "#a855f7" },
  complete: { label: "Complete", icon: CheckCircle2, color: "#E6B33E" },
}

const MESSAGE_PHASE_MAP: Record<string, Phase> = {
  understanding: "understanding",
  qa_question: "understanding",
  qa_answer: "understanding",
  qa_summary: "understanding",
  final_plan: "planning",
  frontend: "generation",
  backend: "generation",
  orchestrator: "generation",
  retry_prompt: "generation",
  feedback_iteration: "generation",
  review: "review",
  test: "review",
  quality_score: "review",
  env_setup: "review",
}

// ── Lazy IDE modal (for mobile fallback) ────────────────────────

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
  },
)

// ── Vertical Agent Rail (#12) ───────────────────────────────────

function AgentRail({
  currentAgent,
  completedAgents,
  selectedAgent,
  onSelectAgent,
}: {
  currentAgent?: string
  completedAgents: string[]
  selectedAgent: string | null
  onSelectAgent: (agent: string | null) => void
}) {
  return (
    <div className="hidden md:flex flex-col items-center w-12 flex-shrink-0 bg-[#1A1A1A] border-r border-white/[0.06] py-4 gap-2">
      {PIPELINE_ORDER.map((agent) => {
        const cfg = AGENT_STATUS[agent]
        const Icon = cfg.icon
        const isActive = currentAgent === agent
        const isCompleted = completedAgents.includes(agent)
        const isSelected = selectedAgent === agent
        const isIdle = !isActive && !isCompleted

        return (
          <div key={agent} className="relative group">
            <button
              onClick={() => onSelectAgent(isSelected ? null : agent)}
              className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isSelected
                  ? "ring-1 ring-white/20"
                  : ""
              } ${
                isActive
                  ? "bg-opacity-8"
                  : isCompleted
                    ? "bg-opacity-6"
                    : "bg-white/[0.03]"
              }`}
              style={{
                backgroundColor: isActive
                  ? `${cfg.color}14`
                  : isCompleted
                    ? `${cfg.color}0F`
                    : undefined,
              }}
            >
              <Icon
                className="w-4 h-4 transition-opacity duration-200"
                style={{
                  color: isIdle ? "rgba(255,255,255,0.2)" : cfg.color,
                  opacity: isIdle ? 0.2 : 1,
                }}
              />

              {/* Active pulsing dot */}
              {isActive && (
                <div
                  className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full animate-agent-pulse"
                  style={{ backgroundColor: cfg.color }}
                />
              )}

              {/* Completed checkmark overlay */}
              {isCompleted && !isActive && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#0A0A0A", border: `1.5px solid ${cfg.color}` }}
                >
                  <Check className="w-2 h-2" style={{ color: cfg.color }} />
                </div>
              )}
            </button>

            {/* Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <div className="whitespace-nowrap bg-[#1a1a1a] border border-white/[0.10] rounded-lg px-2.5 py-1.5 shadow-elevation-2">
                <span className="text-[11px] font-semibold" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
                {isActive && (
                  <span className="block text-[10px] text-white/40 mt-0.5">Running...</span>
                )}
                {isCompleted && (
                  <span className="block text-[10px] text-white/40 mt-0.5">Completed</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Radial Progress (#17) ───────────────────────────────────────

function RadialProgress({
  currentAgent,
  completedAgents,
  currentStatus,
  totalAgents = 5,
}: {
  currentAgent?: string
  completedAgents: string[]
  currentStatus?: string
  totalAgents?: number
}) {
  const progress = completedAgents.length / totalAgents
  const circumference = 2 * Math.PI * 18
  const offset = circumference - progress * circumference

  return (
    <div className="flex items-center gap-3 flex-shrink-0 animate-spring-in">
      <div className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
        <svg className="w-11 h-11 -rotate-90" viewBox="0 0 40 40">
          {/* Background ring */}
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2.5"
          />
          {/* Progress ring */}
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="#E6B33E"
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute text-[10px] font-mono font-bold text-white/60">
          {Math.round(progress * 100)}%
        </span>
      </div>
      <div className="flex flex-col min-w-0">
        {currentAgent && (
          <span
            className="text-[11px] font-semibold truncate"
            style={{ color: AGENT_STATUS[currentAgent]?.color || "#E6B33E" }}
          >
            {AGENT_STATUS[currentAgent]?.label || currentAgent}
          </span>
        )}
        {currentStatus && (
          <span className="text-[10px] text-white/35 truncate max-w-[180px] font-medium">
            {currentStatus}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Mobile Pipeline Bar (fallback for small screens) ────────────

function MobilePipelineBar({
  currentAgent,
  completedAgents,
}: {
  currentAgent?: string
  completedAgents: string[]
}) {
  return (
    <div className="md:hidden flex items-center gap-1 w-full overflow-x-auto scrollbar-none px-1">
      {PIPELINE_ORDER.map((agent, i) => {
        const cfg = AGENT_STATUS[agent]
        const isActive = currentAgent === agent
        const isCompleted = completedAgents.includes(agent)
        const isIdle = !isActive && !isCompleted

        return (
          <div key={agent} className="flex items-center">
            <div
              className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#1A1A1A] border border-white/[0.12]"
                  : isCompleted
                    ? "bg-[var(--surface-base)] border border-white/[0.08]"
                    : "opacity-25"
              }`}
              style={isActive ? { boxShadow: `0 0 12px ${cfg.color}15` } : undefined}
            >
              {isActive ? (
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-agent-pulse"
                  style={{ backgroundColor: cfg.color }}
                />
              ) : isCompleted ? (
                <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0" style={{ color: cfg.color }} />
              ) : (
                <Circle className="w-1.5 h-1.5 flex-shrink-0 text-white/15" />
              )}
              <span
                style={{ color: isIdle ? undefined : cfg.color }}
                className={isIdle ? "text-white/20" : ""}
              >
                {cfg.label.slice(0, 3)}
              </span>
            </div>
            {i < PIPELINE_ORDER.length - 1 && (
              <div
                className={`w-2 h-px mx-0.5 ${isCompleted ? "bg-white/10" : "bg-white/[0.04]"}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Phase Group Header (#14) ────────────────────────────────────

function PhaseHeader({
  phase,
  isActive,
  isComplete,
  open,
  onToggle,
}: {
  phase: Phase
  isActive: boolean
  isComplete: boolean
  open: boolean
  onToggle: () => void
}) {
  const { label, icon: Icon, color } = PHASES[phase]
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full py-2 group"
    >
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
        style={{
          backgroundColor: isComplete
            ? `${color}1A`
            : isActive
              ? `${color}0D`
              : "rgba(255,255,255,0.04)",
        }}
      >
        {isComplete ? (
          <Check className="w-3 h-3" style={{ color }} />
        ) : isActive ? (
          <div
            className="w-2 h-2 rounded-full animate-agent-pulse"
            style={{ backgroundColor: color }}
          />
        ) : (
          <Icon className="w-3 h-3 text-white/20" />
        )}
      </div>
      <span
        className={`text-[13px] font-semibold ${
          isComplete
            ? "text-white/50"
            : isActive
              ? "text-white/80"
              : "text-white/30"
        }`}
      >
        {label}
      </span>
      {isComplete && <span className="text-[10px] text-white/25 ml-1">done</span>}
      <ChevronDown
        className={`w-3 h-3 text-white/20 ml-auto transition-transform duration-200 ${
          open ? "rotate-180" : ""
        }`}
      />
    </button>
  )
}

// ── Code Panel (#13 - Desktop split pane) ───────────────────────

function CodePanel({
  files,
  backendFiles,
  onClose,
}: {
  files: [string, string][]
  backendFiles?: [string, string][]
  onClose: () => void
}) {
  const allFiles = useMemo(() => {
    if (!backendFiles || backendFiles.length === 0) return files
    return [
      ...files.map(([name, content]) => [`frontend/${name}`, content] as [string, string]),
      ...backendFiles.map(([name, content]) => [`backend/${name}`, content] as [string, string]),
    ]
  }, [files, backendFiles])

  const [selectedFile, setSelectedFile] = useState(0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[#080808] flex-shrink-0">
        <span className="text-[13px] font-mono text-white/50">
          {backendFiles && backendFiles.length > 0 ? "Full-Stack" : "Frontend"}
        </span>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
        >
          <span className="text-sm leading-none">&times;</span>
        </button>
      </div>

      {/* File list + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* File list */}
        <div className="w-48 border-r border-white/[0.06] overflow-y-auto flex-shrink-0 bg-[#1A1A1A]">
          {allFiles.map(([name], i) => (
            <button
              key={`${name}-${i}`}
              onClick={() => setSelectedFile(i)}
              className={`w-full text-left px-3 py-2 text-[12px] font-mono truncate transition-colors ${
                i === selectedFile
                  ? "bg-[#E6B33E]/[0.08] text-[#E6B33E]"
                  : "text-white/45 hover:bg-white/[0.04]"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* File content */}
        <div className="flex-1 overflow-auto p-4 bg-[#0A0A0A]">
          <pre className="text-[12px] font-mono text-white/70 leading-relaxed whitespace-pre-wrap">
            {allFiles[selectedFile]?.[1] || ""}
          </pre>
        </div>
      </div>
    </div>
  )
}

// ── Feedback Loop Card ──────────────────────────────────────────

function FeedbackCard({
  iteration,
  issues,
}: {
  iteration: number
  issues: string[]
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const orbitRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardRef.current) return
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 12, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "power2.out" },
    )
    const items = cardRef.current.querySelectorAll(".fb-issue")
    if (items.length > 0) {
      gsap.fromTo(
        items,
        { opacity: 0, x: -6 },
        { opacity: 1, x: 0, duration: 0.25, stagger: 0.06, delay: 0.15, ease: "power2.out" },
      )
    }
    if (orbitRef.current) {
      gsap.to(orbitRef.current, { rotation: 360, duration: 4, repeat: -1, ease: "none" })
    }
  }, [])

  return (
    <div ref={cardRef} className="max-w-lg" style={{ opacity: 0 }}>
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10 relative overflow-hidden">
        <div
          className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(245,158,11,0.08), transparent)",
          }}
        />

        <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
          <div ref={orbitRef} className="absolute inset-0">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400/60"
              style={{ boxShadow: "0 0 6px rgba(245,158,11,0.4)" }}
            />
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
                <li
                  key={i}
                  className="fb-issue text-[11px] text-white/45 leading-relaxed flex items-start gap-1.5"
                  style={{ opacity: 0 }}
                >
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

// ── Sticky Quality Badge (#15) ──────────────────────────────────

function StickyQualityBadge({
  grade,
  score,
  onDismiss,
}: {
  grade: string
  score: number
  onDismiss: () => void
}) {
  const badgeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (badgeRef.current) {
      gsap.fromTo(
        badgeRef.current,
        { opacity: 0, scale: 0.9, y: -8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" },
      )
    }
  }, [])

  return (
    <div
      ref={badgeRef}
      className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0c0c0c]/90 backdrop-blur-xl border border-[#E6B33E]/20 shadow-elevation-2"
      style={{ opacity: 0 }}
    >
      <div className="w-10 h-10 rounded-full border-2 border-[#E6B33E] flex items-center justify-center relative">
        <span className="text-lg font-black text-[#E6B33E]">{grade}</span>
        <div
          className="absolute inset-0 rounded-full border-2 border-[#E6B33E]/30"
          style={{ animation: "ring-breathe 2s ease-in-out infinite" }}
        />
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] text-white/40 font-mono">Quality</span>
        <span className="text-[13px] font-bold text-white/80">{score}/100</span>
      </div>
      <button
        onClick={onDismiss}
        className="ml-1 text-white/20 hover:text-white/50 text-xs transition-colors"
      >
        <span>&times;</span>
      </button>
    </div>
  )
}

// ── Mobile Bottom Navigation ────────────────────────────────────

function BottomNav() {
  const pathname = usePathname()
  const tabs = [
    { icon: Home, label: "Home", href: "/" },
    { icon: FolderOpen, label: "Projects", href: "/test-projects" },
    { icon: Plug, label: "Plugins", href: "/plugins" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ]
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] border-t border-white/[0.08] flex items-center justify-around px-2 py-1.5"
      style={{
        paddingBottom: "max(0.375rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-0.5 py-1 px-3"
          >
            <tab.icon
              className={`w-5 h-5 ${active ? "text-[#E6B33E]" : "text-white/40"}`}
            />
            <span
              className={`text-[10px] font-medium ${
                active ? "text-[#E6B33E]" : "text-white/35"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

function TestApp({ projectId }: { projectId: string }) {
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

  // ── Core UI state ───────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sidebarWrapRef = useRef<HTMLDivElement>(null)
  const chatAreaRef = useRef<HTMLDivElement>(null)
  const hasPageAnimated = useRef(false)
  const autoStarted = useRef(false)

  // ── Q&A local state ─────────────────────────────────────────
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [qaAnswers, setQaAnswers] = useState<Array<{ questionId: string; answer: string }>>([])
  const [qaCollapsed, setQaCollapsed] = useState(false)
  const [firstQuestionAdded, setFirstQuestionAdded] = useState(false)
  const [understandingExpanded, setUnderstandingExpanded] = useState(false)
  const [planExpanded, setPlanExpanded] = useState(false)
  const [qaSummaryExpanded, setQaSummaryExpanded] = useState(false)

  // ── Sticky quality badge (#15) ──────────────────────────────
  const [stickyGrade, setStickyGrade] = useState<{ grade: string; score: number } | null>(null)

  // ── Phase collapse state (#14) ──────────────────────────────
  const [collapsedPhases, setCollapsedPhases] = useState<Set<Phase>>(new Set())

  // ── Env state ───────────────────────────────────────────────
  const [, setEnvValues] = useState<Record<string, string>>({})
  const [showEnvModal, setShowEnvModal] = useState(false)

  const questions = wsState.understandingData?.questions || []
  const isInQAPhase = wsState.flowStage === "qa"

  // ── Add first question when entering Q&A ────────────────────
  useEffect(() => {
    if (isInQAPhase && questions.length > 0 && !firstQuestionAdded) {
      setFirstQuestionAdded(true)
      addMessage({
        sender: "agent",
        username: "System",
        content: questions[0].question,
        type: "qa_question",
        data: questions[0],
      })
    }
  }, [isInQAPhase, questions, firstQuestionAdded, addMessage])

  function handleQuestionAnswer(answer: string) {
    const q = questions[currentQuestionIndex]
    if (!q) return

    const newAnswers = [...qaAnswers, { questionId: q.id, answer }]
    setQaAnswers(newAnswers)

    addMessage({ sender: "user", username: "You", content: answer, type: "qa_answer" })

    if (currentQuestionIndex + 1 < questions.length) {
      const nextQ = questions[currentQuestionIndex + 1]
      setCurrentQuestionIndex((prev) => prev + 1)
      setTimeout(() => {
        addMessage({
          sender: "agent",
          username: "System",
          content: nextQ.question,
          type: "qa_question",
          data: nextQ,
        })
      }, 300)
    } else {
      setQaCollapsed(true)
      sendQAComplete(newAnswers)
    }
  }

  // ── Auto-start from project creation ────────────────────────
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

  // ── Auto-scroll ─────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // ── Page entrance animation ─────────────────────────────────
  useEffect(() => {
    if (isLoading || hasPageAnimated.current) return
    hasPageAnimated.current = true
    requestAnimationFrame(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } })
      if (sidebarWrapRef.current) {
        tl.to(sidebarWrapRef.current, { opacity: 1, x: 0, duration: 0.4 }, 0)
      }
      if (chatAreaRef.current) {
        tl.to(chatAreaRef.current, { opacity: 1, y: 0, duration: 0.45 }, 0.05)
      }
    })
  }, [isLoading])

  // ── iOS virtual keyboard handling ───────────────────────────
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

  // ── Latest files for IDE ────────────────────────────────────
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

  const latestEnvVars = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.type === "env_setup" && m.data?.envVariables) return m.data.envVariables as string[]
    }
    return null
  }, [messages])

  // ── Watch for quality_score to show sticky badge (#15) ──────
  useEffect(() => {
    const qualityMsg = [...messages].reverse().find((m) => m.type === "quality_score" && m.data)
    if (qualityMsg?.data) {
      setStickyGrade({ grade: qualityMsg.data.grade, score: qualityMsg.data.overall })
    }
  }, [messages])

  // ── Retry logic ─────────────────────────────────────────────
  const retryInfo = useMemo(() => {
    if (wsState.isGenerating || messages.length === 0) return null

    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.type !== "error") return null

    const hasPlan = messages.some((m) => m.type === "final_plan")
    if (hasPlan) {
      return { type: "proceed" as const, label: "Retry build" }
    }

    const userMsg = messages.find((m) => m.sender === "user" && m.type === "text")
    if (userMsg) {
      return { type: "message" as const, label: "Retry", content: userMsg.content }
    }

    return null
  }, [messages, wsState.isGenerating])

  const handleRetry = () => {
    if (!retryInfo) return
    if (retryInfo.type === "proceed") {
      sendProceed(true)
    } else if (retryInfo.content) {
      sendMessage(retryInfo.content)
    }
  }

  // ── Suggestion chips (#16) ──────────────────────────────────
  const suggestionChips = useMemo(() => {
    if (wsState.flowStage === "waiting_plan_review") {
      return [
        { label: "Approve & Build", action: () => sendProceed(true), primary: true },
        { label: "Cancel", action: () => sendProceed(false), primary: false },
      ]
    }
    if (wsState.flowStage === "qa" && questions[currentQuestionIndex]) {
      const q = questions[currentQuestionIndex]
      if (q.options?.length) {
        return q.options.map((opt: string) => ({
          label: opt,
          action: () => handleQuestionAnswer(opt),
          primary: false,
        }))
      }
    }
    if (!wsState.isGenerating && messages.length > 0 && !retryInfo) {
      return [
        { label: "Add a feature", action: () => {}, primary: false },
        { label: "Fix an issue", action: () => {}, primary: false },
        { label: "Run more tests", action: () => {}, primary: false },
      ]
    }
    return []
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsState.flowStage, currentQuestionIndex, questions, wsState.isGenerating, messages.length, retryInfo])

  // ── Computed values ─────────────────────────────────────────
  const completedTokens =
    (wsState.tokenUsage.frontend?.totalTokens ?? 0) +
    (wsState.tokenUsage.backend?.totalTokens ?? 0) +
    (wsState.tokenUsage.review?.totalTokens ?? 0) +
    (wsState.tokenUsage.test?.totalTokens ?? 0)
  const totalTokensDisplay = completedTokens + (wsState.tokenUsage.currentEstimate ?? 0)

  const showPipeline =
    wsState.isGenerating &&
    (wsState.currentAgent || wsState.completedAgents.length > 0) &&
    wsState.flowStage !== "understanding" &&
    wsState.flowStage !== "waiting_understanding" &&
    wsState.flowStage !== "qa"

  const qaQuestionCount = messages.filter((m) => m.type === "qa_question").length

  const understandingCompleted = messages.some(
    (m) => m.type === "final_plan" || m.type === "qa_summary" || m.type === "qa_question",
  )

  // ── Phase grouping helpers (#14) ────────────────────────────
  function getMessagePhase(type?: string): Phase | null {
    if (!type) return null
    return MESSAGE_PHASE_MAP[type] || null
  }

  function isPhaseComplete(phase: Phase): boolean {
    switch (phase) {
      case "understanding":
        return understandingCompleted
      case "planning":
        return messages.some(
          (m) =>
            m.type === "frontend" ||
            m.type === "backend" ||
            (m.type === "text" && m.sender === "agent" && messages.indexOf(m) > messages.findIndex((p) => p.type === "final_plan")),
        )
      case "generation":
        return (
          wsState.completedAgents.includes("Frontend Agent") ||
          wsState.completedAgents.includes("Backend Agent") ||
          messages.some((m) => m.type === "review" || m.type === "test")
        )
      case "review":
        return wsState.flowStage === "completed"
      case "complete":
        return wsState.flowStage === "completed"
      default:
        return false
    }
  }

  function isPhaseActive(phase: Phase): boolean {
    switch (phase) {
      case "understanding":
        return (
          wsState.flowStage === "understanding" ||
          wsState.flowStage === "waiting_understanding" ||
          wsState.flowStage === "qa"
        )
      case "planning":
        return wsState.flowStage === "planning" || wsState.flowStage === "waiting_plan_review"
      case "generation":
        return wsState.flowStage === "generating" || wsState.flowStage === "feedback"
      case "review":
        return wsState.flowStage === "reviewing" || wsState.flowStage === "testing"
      case "complete":
        return false
      default:
        return false
    }
  }

  // ── Loading / empty states ──────────────────────────────────
  if (!projectId) {
    return <MainLoadingScreen label="Loading project" />
  }

  if (isLoading) {
    return <MainLoadingScreen label="Loading project" />
  }

  // ── Filtered messages (by selected agent from rail) ─────────
  const displayMessages = selectedAgent
    ? messages.filter((m) => {
        if (m.sender === "user") return true
        if (m.type === "text" || m.type === "error") return true
        const agentMap: Record<string, string[]> = {
          "Orchestrator Agent": ["understanding", "qa_question", "qa_answer", "qa_summary", "final_plan", "orchestrator"],
          "Frontend Agent": ["frontend"],
          "Backend Agent": ["backend"],
          "Review Agent": ["review", "env_setup"],
          "Test Agent": ["test", "quality_score"],
        }
        return agentMap[selectedAgent]?.includes(m.type || "") ?? false
      })
    : messages

  // ── Render message content (shared logic) ───────────────────
  function renderMessage(message: typeof messages[0], idx: number) {
    // Understanding card
    if (message.type === "understanding" && message.data) {
      if (understandingCompleted) {
        return (
          <div key={message.id} className="animate-spring-in flex gap-3">
            <div className="flex flex-col items-center flex-shrink-0">
              <Check className="w-4 h-4 text-[#E6B33E]/50" />
              <div className="w-px flex-1 bg-white/[0.06]" />
            </div>
            <div className="flex-1 min-w-0 -mt-0.5">
              <button
                onClick={() => setUnderstandingExpanded((e) => !e)}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity text-sm text-white/45"
              >
                Project understood
                <ChevronRight
                  className={`w-3 h-3 chevron-rotate ${understandingExpanded ? "open" : ""}`}
                />
              </button>
              <Collapse open={understandingExpanded}>
                <div className="mt-2 mb-2">
                  <p className="text-sm text-white/50 leading-relaxed">{message.data.summary}</p>
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

    // Q&A messages (collapsible)
    if (message.type === "qa_question" || message.type === "qa_answer") {
      if (qaCollapsed) {
        // Only render the collapsed summary once
        const firstQaIdx = displayMessages.findIndex(
          (m) => m.type === "qa_question" || m.type === "qa_answer",
        )
        if (idx !== firstQaIdx) return null
        return (
          <button
            key="qa-collapsed"
            onClick={() => setQaCollapsed(false)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Check className="w-4 h-4 text-[#E6B33E]/50 flex-shrink-0" />
            <span className="text-sm text-white/45 flex items-center gap-1">
              {qaQuestionCount} {qaQuestionCount === 1 ? "question" : "questions"} answered
              <ChevronRight className="w-3 h-3 chevron-rotate" />
            </span>
          </button>
        )
      }

      if (message.type === "qa_question" && message.data) {
        const qIdx = questions.findIndex((q) => q.id === message.data.id)
        const isCurrentQuestion = qIdx === currentQuestionIndex && isInQAPhase
        const answeredValue = qaAnswers.find((a) => a.questionId === message.data.id)?.answer
        const isFirst = qIdx === 0

        return (
          <div key={message.id}>
            {isFirst && !isInQAPhase && (
              <button
                onClick={() => setQaCollapsed(true)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity mb-3"
              >
                <Check className="w-4 h-4 text-[#E6B33E]/50 flex-shrink-0" />
                <span className="text-sm text-white/45 flex items-center gap-1">
                  {qaQuestionCount} {qaQuestionCount === 1 ? "question" : "questions"} answered
                  <ChevronRight className="w-3 h-3 chevron-rotate open" />
                </span>
              </button>
            )}
            <ClarifyingQuestion
              question={message.data.question}
              options={message.data.options}
              questionNumber={qIdx + 1}
              totalQuestions={questions.length}
              onAnswer={handleQuestionAnswer}
              answered={isCurrentQuestion ? undefined : answeredValue}
            />
          </div>
        )
      }

      if (message.type === "qa_answer") {
        return null
      }
    }

    // Q&A summary (from history)
    if (message.type === "qa_summary") {
      const qaData = message.data as {
        answers: Array<{ questionId: string; answer: string }>
        questions: Array<{ id: string; question: string }>
      } | null
      const answers = qaData?.answers || []
      const historyQuestions = qaData?.questions || []
      return (
        <div key={message.id} className="animate-spring-in">
          <button
            onClick={() => setQaSummaryExpanded((e) => !e)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Check className="w-4 h-4 text-[#E6B33E]/50 flex-shrink-0" />
            <span className="text-sm text-white/45 flex items-center gap-1">
              {message.content}
              <ChevronRight
                className={`w-3 h-3 chevron-rotate ${qaSummaryExpanded ? "open" : ""}`}
              />
            </span>
          </button>
          <Collapse open={qaSummaryExpanded}>
            <div className="ml-7 mt-2 space-y-1.5 max-w-xl">
              {answers.map((a, i) => {
                const q = historyQuestions.find((hq) => hq.id === a.questionId)
                return (
                  <div
                    key={i}
                    className="rounded-[6px] bg-[var(--surface-raised)] border border-white/[0.06] px-3 py-2"
                  >
                    <p className="text-[11px] text-white/40 mb-0.5">
                      {q?.question || a.questionId}
                    </p>
                    <p className="text-[13px] text-white/80 font-medium">{a.answer}</p>
                  </div>
                )
              })}
            </div>
          </Collapse>
        </div>
      )
    }

    // Retry prompt (failed code generation)
    if (message.type === "retry_prompt" && message.data) {
      const target = (message.data as { target: string }).target
      const label = target === "frontend" ? "Frontend" : "Backend"
      return (
        <div key={message.id} className="w-full max-w-3xl animate-bubble-in px-2 md:px-0">
          <div className="rounded-xl border border-orange-500/20 bg-[var(--surface-raised)] p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-orange-400 text-[14px]">!</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white/80">
                  {label} generation failed
                </p>
                <p className="text-[11px] text-white/40 mt-0.5">
                  Output couldn&apos;t be parsed. You can retry just this agent.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
              <button
                onClick={() => sendMessage(`retry ${target}`)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#E6B33E]/10 text-[#E6B33E] border border-[#E6B33E]/20 hover:bg-[#E6B33E]/20 transition-all"
              >
                Retry {label}
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Final plan card
    if (message.type === "final_plan" && message.data) {
      const planIdx = messages.indexOf(message)
      const hasSubsequent = messages
        .slice(planIdx + 1)
        .some(
          (m) =>
            m.type === "frontend" ||
            m.type === "backend" ||
            m.type === "review" ||
            m.type === "text",
        )
      if (hasSubsequent) {
        return (
          <div key={message.id} className="animate-spring-in flex gap-3">
            <div className="flex flex-col items-center flex-shrink-0">
              <Check className="w-4 h-4 text-[#E6B33E]/50" />
              <div className="w-px flex-1 bg-white/[0.06]" />
            </div>
            <div className="flex-1 min-w-0 -mt-0.5">
              <button
                onClick={() => setPlanExpanded((e) => !e)}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity text-sm text-white/45"
              >
                Plan reviewed
                <ChevronRight
                  className={`w-3 h-3 chevron-rotate ${planExpanded ? "open" : ""}`}
                />
              </button>
              <Collapse open={planExpanded}>
                <div className="mt-2 mb-1">
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
          </div>
        )
      }
      return (
        <FeatureReviewCard
          key={message.id}
          data={message.data}
          onProceed={() => sendProceed(true)}
          onStop={() => sendProceed(false)}
          onClarify={() => {}}
        />
      )
    }

    // Test results card
    if (message.type === "test" && message.data) {
      return <TestResultsCard key={message.id} data={message.data} />
    }

    // Quality score card
    if (message.type === "quality_score" && message.data) {
      return (
        <QualityScoreCard
          key={message.id}
          grade={message.data.grade}
          metrics={message.data.metrics}
          overall={message.data.overall}
          needsFeedback={message.data.needsFeedback}
        />
      )
    }

    // Feedback iteration notice
    if (message.type === "feedback_iteration" && message.data) {
      return (
        <FeedbackCard
          key={message.id}
          iteration={message.data.iteration}
          issues={message.data.issues || []}
        />
      )
    }

    // Env setup card
    if (message.type === "env_setup" && message.data?.envVariables) {
      return (
        <EnvSetupCard
          key={message.id}
          envVariables={message.data.envVariables}
          onSave={(vals) => setEnvValues(vals)}
        />
      )
    }

    // Skip orchestrator (covered by final_plan)
    if (message.type === "orchestrator") return null

    // Regular messages - compute group position
    const msgIdx = displayMessages.indexOf(message)
    const isSimpleAiBubble =
      message.sender === "agent" &&
      ((message.type === "text" && !message.data) || message.type === "error")
    const isUserText = message.sender === "user"
    let groupPos: BubbleGroupPos = "solo"
    if (isSimpleAiBubble || isUserText) {
      const prev = msgIdx > 0 ? displayMessages[msgIdx - 1] : null
      const next = msgIdx < displayMessages.length - 1 ? displayMessages[msgIdx + 1] : null
      const prevIsAi =
        prev &&
        prev.sender === "agent" &&
        prev.type !== "orchestrator" &&
        prev.type !== "qa_question" &&
        prev.type !== "qa_answer" &&
        prev.type !== "qa_summary" &&
        prev.type !== "understanding"
      const nextIsAi =
        next &&
        next.sender === "agent" &&
        next.type !== "orchestrator" &&
        next.type !== "qa_question" &&
        next.type !== "qa_answer" &&
        next.type !== "qa_summary" &&
        next.type !== "understanding"
      const prevSame = isUserText ? prev && prev.sender === "user" : prevIsAi
      const nextSame = isUserText ? next && next.sender === "user" : nextIsAi
      if (prevSame && nextSame) groupPos = "middle"
      else if (prevSame) groupPos = "last"
      else if (nextSame) groupPos = "first"
    }
    return (
      <MessageCard
        key={message.id}
        message={message}
        allMessages={messages}
        onRetry={message.type === "error" && retryInfo ? handleRetry : undefined}
        groupPos={groupPos}
      />
    )
  }

  // ── Build phase-grouped message list (#14) ──────────────────
  function renderMessagesWithPhases() {
    let lastPhase: Phase | null = null
    const elements: React.ReactNode[] = []

    displayMessages.forEach((message, idx) => {
      const phase = getMessagePhase(message.type)

      // User text messages render outside phases
      if (message.sender === "user" && message.type === "text") {
        elements.push(renderMessage(message, idx))
        return
      }

      // Insert phase header when phase changes
      if (phase && phase !== lastPhase) {
        const phaseComplete = isPhaseComplete(phase)
        const phaseActive = isPhaseActive(phase)
        const isCollapsed = collapsedPhases.has(phase)
        // Auto-collapse completed phases that aren't the currently active one
        const shouldShow = !isCollapsed || phaseActive

        elements.push(
          <PhaseHeader
            key={`phase-${phase}`}
            phase={phase}
            isActive={phaseActive}
            isComplete={phaseComplete}
            open={shouldShow}
            onToggle={() => {
              setCollapsedPhases((prev) => {
                const next = new Set(prev)
                if (next.has(phase)) {
                  next.delete(phase)
                } else {
                  next.add(phase)
                }
                return next
              })
            }}
          />,
        )

        if (!shouldShow) {
          lastPhase = phase
          return
        }

        lastPhase = phase
      }

      // Check if the current phase is collapsed
      if (phase && collapsedPhases.has(phase) && !isPhaseActive(phase)) {
        return
      }

      const rendered = renderMessage(message, idx)
      if (rendered) {
        elements.push(
          <div key={message.id} className="pl-0 md:pl-8">
            {rendered}
          </div>,
        )
      }
    })

    return elements
  }

  // ═════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════

  return (
    <>
      {/* Env modal overlay */}
      {showEnvModal && latestEnvVars && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center animate-overlay-in"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEnvModal(false)
          }}
        >
          <div className="animate-popover-in max-w-2xl w-full mx-4">
            <EnvSetupCard
              envVariables={latestEnvVars}
              onSave={(vals) => {
                setEnvValues(vals)
                setShowEnvModal(false)
              }}
            />
          </div>
        </div>
      )}

      {/* Mobile IDE modal fallback (below md) */}
      <div className="md:hidden">
        {previewOpen && latestFrontendFiles && (
          <IDEModal
            files={latestFrontendFiles}
            backendFiles={latestBackendFiles || undefined}
            title={latestBackendFiles ? "Full-Stack IDE" : "Frontend IDE"}
            onClose={() => setPreviewOpen(false)}
          />
        )}
      </div>

      <div className="flex flex-row h-screen w-screen bg-background overflow-hidden">
        {/* ── Desktop Sidebar ──────────────────────────────── */}
        <div
          ref={sidebarWrapRef}
          className="hidden md:block"
          style={{ opacity: 0, transform: "translateX(-16px)" }}
        >
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* ── Vertical Agent Rail (desktop only) (#12) ──── */}
        <AgentRail
          currentAgent={wsState.currentAgent}
          completedAgents={wsState.completedAgents}
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
        />

        {/* ── Main Content Area ────────────────────────────── */}
        <div
          ref={chatAreaRef}
          className="flex flex-col h-full flex-1 overflow-hidden min-w-0"
          style={{ opacity: 0, transform: "translateY(8px)" }}
        >
          {/* ── Top bar ─────────────────────────────────────── */}
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
                <div
                  className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-semibold tracking-wide uppercase ${
                    wsState.complexityScore <= 2
                      ? "bg-[#E6B33E]/[0.04] border-[#E6B33E]/10 text-[#E6B33E]/50"
                      : wsState.complexityScore <= 3
                        ? "bg-[#E6B33E]/[0.06] border-[#E6B33E]/15 text-[#E6B33E]/60"
                        : "bg-[#E6B33E]/[0.08] border-[#E6B33E]/20 text-[#E6B33E]/70"
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>Complexity {wsState.complexityScore}/5</span>
                </div>
              )}

              {wsState.isGenerating && totalTokensDisplay > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white/35 text-[10px] font-mono">
                  <Zap className="w-3 h-3 text-[#E6B33E]/30" />
                  <span>~{totalTokensDisplay.toLocaleString()}</span>
                </div>
              )}

              {/* Agent filter indicator */}
              {selectedAgent && (
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-white/50 hover:text-white/70 transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: AGENT_STATUS[selectedAgent]?.color }}
                  />
                  {AGENT_STATUS[selectedAgent]?.label}
                  <span className="text-white/25 ml-0.5">&times;</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {latestEnvVars && (
                <EnvButton
                  envVariables={latestEnvVars}
                  onClick={() => setShowEnvModal((e) => !e)}
                />
              )}
              <button
                onClick={() => latestFrontendFiles && setPreviewOpen(true)}
                disabled={!latestFrontendFiles}
                title={latestFrontendFiles ? "Open IDE" : "Generate a project first"}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[13px] font-semibold border transition-all tracking-[-0.02em] ${
                  latestFrontendFiles
                    ? "text-white/90 bg-[#E6B33E]/[0.08] hover:bg-[#E6B33E]/[0.12] border-[#E6B33E]/20 hover:border-[#E6B33E]/35 shadow-[0_0_12px_rgba(230,179,62,0.06)]"
                    : "text-white/10 bg-transparent border-white/[0.06] cursor-not-allowed"
                }`}
              >
                <Code2
                  className={`w-4 h-4 ${latestFrontendFiles ? "text-[#E6B33E]/70" : ""}`}
                />
                <span className="hidden sm:inline">IDE</span>
              </button>
            </div>
          </div>

          {/* ── Content: Chat + optional Code Panel (#13) ── */}
          <div className="flex flex-row flex-1 overflow-hidden">
            {/* Chat column -- shrinks when IDE open on desktop */}
            <div
              className={`flex flex-col overflow-hidden min-w-0 transition-all duration-300 ${
                previewOpen && latestFrontendFiles
                  ? "md:w-[40%] md:border-r md:border-white/[0.06] flex-1 md:flex-none"
                  : "flex-1"
              }`}
            >
              {/* Chat scroll area */}
              <div className="relative flex flex-col flex-1 overflow-hidden min-w-0">
                <BGPattern mask="fade-edges" size={28} fill="#1a1a1a" />

                {/* Sticky quality badge (#15) */}
                {stickyGrade && (
                  <StickyQualityBadge
                    grade={stickyGrade.grade}
                    score={stickyGrade.score}
                    onDismiss={() => setStickyGrade(null)}
                  />
                )}

                {/* Messages */}
                <div
                  ref={scrollRef}
                  className="relative z-[1] flex flex-col overflow-y-auto overflow-x-hidden gap-4 md:gap-5 flex-1 px-3 md:px-8 py-4 md:py-6 pb-8 md:pb-10 chat-scroll"
                >
                  {displayMessages.length === 0 && !wsState.isGenerating ? (
                    /* Welcome state */
                    <div className="flex-1 flex items-center justify-center">
                      <div className="flex flex-col items-center text-center max-w-lg px-6 md:p-10 animate-spring-in">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#E6B33E]/[0.04] border border-[#E6B33E]/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(230,179,62,0.04)]">
                          <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-[#E6B33E]/40" />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-[#E6B33E]/35 mb-3">
                          Build something
                        </span>
                        <h3 className="text-xl md:text-2xl font-display italic text-white/85 mb-3 tracking-[-0.03em]">
                          What do you want to create?
                        </h3>
                        <p className="text-[13px] md:text-[14px] text-white/40 mb-8 leading-relaxed max-w-sm font-medium">
                          Describe your idea and AI agents will understand, plan, and generate
                          complete code.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {[
                            "Todo app with auth",
                            "E-commerce dashboard",
                            "Chat application",
                          ].map((hint) => (
                            <button
                              key={hint}
                              onClick={() => sendMessage(hint)}
                              className="px-3.5 py-2 rounded-xl text-[13px] font-medium text-white/50 bg-white/[0.03] border border-white/[0.10] hover:border-[#E6B33E]/30 hover:text-[#E6B33E]/80 hover:bg-[#E6B33E]/[0.05] transition-all"
                            >
                              {hint}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Phase-grouped messages (#14) */}
                      {renderMessagesWithPhases()}

                      {/* Streaming dropdowns */}
                      {wsState.streaming.frontendStream && (
                        <StreamingDropdown
                          content={wsState.streaming.frontendStream}
                          agent="Frontend Agent"
                          isActive={
                            !!wsState.streaming.frontendStream &&
                            !wsState.completedAgents.includes("Frontend Agent")
                          }
                          tokenUsage={wsState.tokenUsage.frontend}
                          liveEstimate={wsState.tokenUsage.currentEstimate}
                        />
                      )}

                      {wsState.streaming.backendStream && (
                        <StreamingDropdown
                          content={wsState.streaming.backendStream}
                          agent="Backend Agent"
                          isActive={
                            !!wsState.streaming.backendStream &&
                            !wsState.completedAgents.includes("Backend Agent")
                          }
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
                              ? wsState.tokenUsage.currentEstimate
                              : undefined
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
                              ? wsState.tokenUsage.currentEstimate
                              : undefined
                          }
                        />
                      )}

                      {/* Status indicator */}
                      {wsState.isGenerating &&
                        wsState.currentStatus &&
                        !wsState.currentAgent &&
                        wsState.flowStage !== "waiting_understanding" &&
                        wsState.flowStage !== "qa" &&
                        wsState.flowStage !== "waiting_plan_review" && (
                          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1A1A1A] border border-white/[0.08] max-w-md animate-bubble-in">
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/25 typing-dot" />
                              <div className="w-1.5 h-1.5 rounded-full bg-white/25 typing-dot" />
                              <div className="w-1.5 h-1.5 rounded-full bg-white/25 typing-dot" />
                            </div>
                            <span className="text-[13px] text-white/35 font-medium">
                              {wsState.currentStatus}
                            </span>
                          </div>
                        )}

                      {/* Retry button */}
                      {retryInfo && messages[messages.length - 1]?.type !== "error" && (
                        <div className="flex justify-center">
                          <button
                            onClick={handleRetry}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E6B33E]/[0.06] hover:bg-[#E6B33E]/[0.10] border border-[#E6B33E]/20 hover:border-[#E6B33E]/35 text-[#E6B33E]/70 hover:text-[#E6B33E] text-[13px] font-semibold tracking-[-0.02em] transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {retryInfo.label}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ── Bottom: Radial progress + Chips + Input ── */}
              <div
                ref={inputBarRef}
                className="flex flex-col items-center gap-2 px-3 md:px-8 py-2.5 md:py-3 flex-shrink-0 border-t border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] transition-transform duration-100 pb-16 md:pb-3"
              >
                {/* Radial progress + mobile pipeline (#17) */}
                {showPipeline && (
                  <div className="w-full max-w-3xl">
                    {/* Desktop: radial progress */}
                    <div className="hidden md:block">
                      <RadialProgress
                        currentAgent={wsState.currentAgent}
                        completedAgents={wsState.completedAgents}
                        currentStatus={wsState.currentStatus}
                      />
                    </div>
                    {/* Mobile: horizontal pipeline bar */}
                    <MobilePipelineBar
                      currentAgent={wsState.currentAgent}
                      completedAgents={wsState.completedAgents}
                    />
                  </div>
                )}

                {/* Suggestion chips (#16) */}
                {suggestionChips.length > 0 && (
                  <div className="flex items-center gap-2 w-full max-w-3xl overflow-x-auto scrollbar-none pb-1">
                    {suggestionChips.map((chip, i) => (
                      <button
                        key={i}
                        onClick={chip.action}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                          chip.primary
                            ? "bg-[#E6B33E]/15 border-[#E6B33E]/30 text-[#E6B33E] hover:bg-[#E6B33E]/25"
                            : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/70 hover:border-white/15"
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Message box */}
                <div className="flex items-center gap-2 w-full max-w-3xl">
                  <MessageBox
                    onSendMessage={sendMessage}
                    onStop={cancelPipeline}
                    isGenerating={wsState.isGenerating}
                    hasMessages={messages.length > 0}
                  />
                </div>
              </div>
            </div>

            {/* ── Desktop Code Panel (#13) ── */}
            {previewOpen && latestFrontendFiles && (
              <div className="hidden md:flex flex-col w-[60%] bg-[#0A0A0A] overflow-hidden animate-tab-in">
                <CodePanel
                  files={latestFrontendFiles}
                  backendFiles={latestBackendFiles || undefined}
                  onClose={() => setPreviewOpen(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile bottom navigation (#20) ── */}
      <BottomNav />
    </>
  )
}

export default TestApp
