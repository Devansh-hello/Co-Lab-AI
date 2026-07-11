"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { CreateProjectModal } from "../components/CreateProject"
import { Sidebar } from "../components/sidebar"
import { MobileSidebar } from "../components/MobileSidebar"
import {
  Plus,
  FolderOpen,
  Trash2,
  Search,
  Menu,
  Star,
  Grid3X3,
  List,
  Copy,
  Play,
  Home,
  Plug,
  Settings,
} from "lucide-react"
import { Skeleton } from "../components/ui/skeleton"
import useContent from "../hooks/useContent"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { deleteProject } from "../functions/send"
import gsap from "gsap"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GRADE_CYCLE = ["A", "B", "A", "C", "B", "A"] as const
type Grade = (typeof GRADE_CYCLE)[number]

const GRADE_COLORS: Record<Grade, string> = {
  A: "#E6B33E",
  B: "#AA8C2C",
  C: "#8B7023",
}

function getGrade(index: number): Grade {
  return GRADE_CYCLE[index % GRADE_CYCLE.length]
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const AGENT_COLORS = ["#E6B33E", "#10b981", "#3b82f6", "#a855f7", "#f59e0b"]

function AgentDots() {
  return (
    <div className="flex items-center gap-1">
      {AGENT_COLORS.map((c, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: c, opacity: 0.6 }}
        />
      ))}
    </div>
  )
}

function GradeBadge({ grade, large }: { grade: Grade; large?: boolean }) {
  const color = GRADE_COLORS[grade]
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md font-mono font-bold border ${
        large ? "h-8 w-8 text-sm" : "h-5 w-5 text-[10px]"
      }`}
      style={{
        color,
        borderColor: `${color}33`,
        backgroundColor: `${color}15`,
      }}
    >
      {grade}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Empty state with typing animation
// ---------------------------------------------------------------------------

const SAMPLE_PROMPTS = [
  "A real-time dashboard with analytics...",
  "An e-commerce platform with auth...",
  "A chat app with WebSocket support...",
  "A portfolio site with CMS...",
  "A SaaS billing dashboard...",
]

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  const [promptIndex, setPromptIndex] = useState(0)
  const [displayed, setDisplayed] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const target = SAMPLE_PROMPTS[promptIndex]
    let timeout: ReturnType<typeof setTimeout>

    if (!isDeleting) {
      if (displayed.length < target.length) {
        timeout = setTimeout(
          () => setDisplayed(target.slice(0, displayed.length + 1)),
          40
        )
      } else {
        // Pause then start deleting
        timeout = setTimeout(() => setIsDeleting(true), 2000)
      }
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(
          () => setDisplayed(displayed.slice(0, -1)),
          20
        )
      } else {
        setIsDeleting(false)
        setPromptIndex((prev) => (prev + 1) % SAMPLE_PROMPTS.length)
      }
    }

    return () => clearTimeout(timeout)
  }, [displayed, isDeleting, promptIndex])

  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center px-4">
      {/* Terminal card */}
      <div className="w-full max-w-md mb-8 rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02]">
        {/* Terminal title bar */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          <span className="ml-2 text-[11px] font-mono text-white/25">
            co-lab-ai
          </span>
        </div>
        {/* Terminal body */}
        <div className="px-4 py-5 min-h-[100px]">
          <p className="text-[11px] font-mono text-white/30 mb-3">
            $ Describe what you want to build...
          </p>
          <p className="text-sm font-mono text-gold-500/80 min-h-[1.5em]">
            {displayed}
            <span className="inline-block w-[2px] h-[14px] bg-gold-500/70 ml-0.5 align-text-bottom animate-pulse" />
          </p>
        </div>
      </div>

      <p className="text-white/50 text-sm mb-1.5">
        Your workspace is empty
      </p>
      <p className="text-white/30 text-xs mb-6">
        Create your first project and let the agents build it
      </p>

      <button
        onClick={onCreateClick}
        className="inline-flex items-center justify-center gap-1.5 h-10 px-6 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-bold text-sm transition-all cursor-pointer"
      >
        <Plus size={15} />
        Start Building
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toast (simple inline)
// ---------------------------------------------------------------------------

function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const show = useCallback((msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 2000)
  }, [])
  return { message, show }
}

function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg bg-[#1a1a1a] border border-white/[0.1] text-sm text-white/80 font-medium shadow-lg animate-spring-in">
      {message}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mobile Bottom Navigation
// ---------------------------------------------------------------------------

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
              className={`w-5 h-5 ${
                active ? "text-gold-500" : "text-white/40"
              }`}
            />
            <span
              className={`text-[10px] font-medium ${
                active ? "text-gold-500" : "text-white/35"
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

// ---------------------------------------------------------------------------
// Project cards
// ---------------------------------------------------------------------------

interface ProjectCardProps {
  _id: string
  name: string
  description?: string
  createdAt?: string
  index: number
  isPinned: boolean
  viewMode: "list" | "grid"
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
  onClone: () => void
}

function ProjectCard({
  _id,
  name,
  description,
  createdAt,
  index,
  isPinned,
  viewMode,
  onTogglePin,
  onDelete,
  onClone,
}: ProjectCardProps) {
  const grade = getGrade(index)

  if (viewMode === "grid") {
    return (
      <div
        className="group relative flex flex-col rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-gold-500/20 transition-all p-4"
        style={{ opacity: 0, transform: "translateY(10px)" }}
      >
        {/* Pin star — top right */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onTogglePin(_id)
          }}
          className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all cursor-pointer z-10 ${
            isPinned
              ? "text-gold-500 bg-gold-500/10"
              : "text-white/15 hover:text-gold-500/60 opacity-0 group-hover:opacity-100"
          }`}
        >
          <Star size={14} fill={isPinned ? "currentColor" : "none"} />
        </button>

        <Link href={`/chat/${_id}`} className="flex flex-col flex-1 min-w-0">
          {/* Grade + Dots row */}
          <div className="flex items-center gap-2.5 mb-3">
            <GradeBadge grade={grade} large />
            <AgentDots />
          </div>

          {/* Name */}
          <h3 className="text-sm font-medium text-white/90 truncate group-hover:text-white transition-colors mb-1">
            {name}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-[12px] text-white/35 line-clamp-2 mb-3 flex-1 min-w-0">
              {description}
            </p>
          )}
          {!description && <div className="flex-1" />}

          {/* Date */}
          {createdAt && (
            <span className="text-[11px] text-white/25 font-mono">
              {relativeTime(createdAt)}
            </span>
          )}
        </Link>

        {/* Hover actions — bottom right */}
        <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/chat/${_id}`}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-white/30 hover:text-green-400 hover:bg-green-500/10 transition-all cursor-pointer"
            title="Open"
          >
            <Play size={13} />
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClone()
            }}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
            title="Clone"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(_id)
            }}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    )
  }

  // ── List view ──
  return (
    <div
      className="group flex items-center gap-3 md:gap-4 py-3.5 md:py-4 px-3 md:px-4 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-gold-500/20 transition-all"
      style={{ opacity: 0, transform: "translateY(10px)" }}
    >
      {/* Pin star */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onTogglePin(_id)
        }}
        className={`flex-shrink-0 p-1 rounded-lg transition-all cursor-pointer ${
          isPinned
            ? "text-gold-500"
            : "text-white/10 hover:text-gold-500/60 md:opacity-0 md:group-hover:opacity-100"
        }`}
      >
        <Star size={14} fill={isPinned ? "currentColor" : "none"} />
      </button>

      {/* Icon */}
      <Link
        href={`/chat/${_id}`}
        className="flex items-center gap-3 md:gap-4 flex-1 min-w-0"
      >
        <div className="flex h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-gold-500/10 border border-gold-500/15 items-center justify-center flex-shrink-0">
          <FolderOpen size={16} className="text-gold-500/70" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white/90 truncate group-hover:text-white transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            {description && (
              <p className="text-[13px] text-white/40 truncate flex-1 min-w-0">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Status cluster */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <AgentDots />
          <GradeBadge grade={grade} />
          {createdAt && (
            <span className="text-[11px] text-white/25 font-mono w-14 text-right">
              {relativeTime(createdAt)}
            </span>
          )}
        </div>
      </Link>

      {/* Hover actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <Link
          href={`/chat/${_id}`}
          className="h-9 w-9 flex items-center justify-center rounded-lg text-white/20 hover:text-green-400 hover:bg-green-500/10 transition-all cursor-pointer"
          title="Open"
        >
          <Play size={14} />
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClone()
          }}
          className="h-9 w-9 flex items-center justify-center rounded-lg text-white/20 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
          title="Clone"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete(_id)
          }}
          className="h-9 w-9 flex items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function TestProjectPage() {
  const [open, setOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { projects, isLoading, refetch } = useContent()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [pinnedIds, setPinnedIds] = useState<string[]>([])
  const toast = useToast()

  // GSAP refs
  const sidebarWrapRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const pinnedListRef = useRef<HTMLDivElement>(null)
  const emptyRef = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  // ── Load pinned projects from localStorage on mount ──
  useEffect(() => {
    try {
      const stored = localStorage.getItem("colab-pinned-projects")
      if (stored) setPinnedIds(JSON.parse(stored))
    } catch {
      // ignore corrupt data
    }
  }, [])

  const togglePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
      localStorage.setItem("colab-pinned-projects", JSON.stringify(next))
      return next
    })
  }, [])

  // ── Filter + split pinned / unpinned ──
  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  )
  const pinnedProjects = filtered.filter((p) => pinnedIds.includes(p._id))
  const unpinnedProjects = filtered.filter((p) => !pinnedIds.includes(p._id))

  // ── GSAP entrance animation ──
  useEffect(() => {
    if (isLoading || hasAnimated.current) return
    hasAnimated.current = true

    requestAnimationFrame(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } })

      if (sidebarWrapRef.current) {
        tl.to(sidebarWrapRef.current, { opacity: 1, x: 0, duration: 0.4 }, 0)
      }

      if (headerRef.current) {
        const children = headerRef.current.querySelectorAll(".gsap-entry")
        tl.to(
          children,
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.06 },
          0.05
        )
      }

      if (searchRef.current) {
        tl.to(searchRef.current, { opacity: 1, y: 0, duration: 0.35 }, 0.2)
      }

      // Pinned section
      if (pinnedListRef.current) {
        const cards = pinnedListRef.current.children
        if (cards.length > 0) {
          tl.to(
            cards,
            { opacity: 1, y: 0, duration: 0.35, stagger: 0.04 },
            0.25
          )
        }
      }

      // All-projects section
      if (listRef.current) {
        const cards = listRef.current.children
        if (cards.length > 0) {
          tl.to(
            cards,
            { opacity: 1, y: 0, duration: 0.35, stagger: 0.04 },
            0.3
          )
        }
      }

      if (emptyRef.current) {
        tl.to(emptyRef.current, { opacity: 1, y: 0, duration: 0.5 }, 0.2)
      }
    })
  }, [isLoading])

  // ── Delete handler ──
  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await deleteProject(id)
      setConfirmDeleteId(null)
      refetch()
    } catch (err) {
      console.error("[deleteProject]", err)
    } finally {
      setDeleting(false)
    }
  }

  // ── Grid / List class for the project list container ──
  const containerClass =
    viewMode === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      : "flex flex-col gap-3"

  // ── Render a section of project cards ──
  function renderCards(
    list: typeof projects,
    ref: React.RefObject<HTMLDivElement | null>,
    indexOffset: number
  ) {
    return (
      <div ref={ref} className={containerClass}>
        {list.map((project, i) => (
          <ProjectCard
            key={project._id}
            {...project}
            index={indexOffset + i}
            isPinned={pinnedIds.includes(project._id)}
            viewMode={viewMode}
            onTogglePin={togglePin}
            onDelete={setConfirmDeleteId}
            onClone={() => toast.show("Clone coming soon")}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      <CreateProjectModal open={open} onclose={() => setOpen(false)} />
      <Toast message={toast.message} />

      {/* ── Delete Confirmation Modal ── */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="w-[90%] max-w-sm bg-[#0c0c0c] border border-white/[0.08] rounded-xl p-5 md:p-6 flex flex-col gap-4 animate-spring-in shadow-elevation-3 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 rounded-xl bg-red-500/10 w-fit mx-auto">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Delete Project?
            </h2>
            <p className="text-sm text-white/55">
              This will permanently delete the project and all its messages.
            </p>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg border border-white/[0.1] text-white/50 hover:text-white hover:border-white/20 hover:bg-white/[0.04] font-semibold text-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Layout ── */}
      <div className="flex flex-row h-screen w-screen bg-background overflow-hidden">
        {/* Desktop sidebar */}
        <div
          ref={sidebarWrapRef}
          className="hidden md:block"
          style={{ opacity: 0, transform: "translateX(-16px)" }}
        >
          <Sidebar />
        </div>

        {/* Mobile sidebar (hamburger-triggered) */}
        <MobileSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content */}
        <div className="flex-1 overflow-y-auto chat-scroll bg-grainy">
          <div className="w-full max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-20 md:pb-10">
            {/* ── Page header ── */}
            <div
              ref={headerRef}
              className="flex items-center justify-between gap-4 mb-6 md:mb-8"
            >
              <div
                className="gsap-entry flex items-center gap-3"
                style={{ opacity: 0, transform: "translateY(8px)" }}
              >
                {/* Hamburger — hidden on mobile when bottom nav present */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="hidden p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <p className="text-[11px] font-mono text-gold-500/50 mb-1 tracking-[0.15em] uppercase font-bold">
                    Workspace
                  </p>
                  <h1 className="text-xl md:text-3xl font-bold text-foreground tracking-tight">
                    Projects
                  </h1>
                  {!isLoading && (
                    <p className="text-[13px] text-white/40 mt-0.5 md:mt-1">
                      {projects.length}{" "}
                      {projects.length === 1 ? "project" : "projects"}
                    </p>
                  )}
                </div>
              </div>

              {/* Right side: view toggle + new button */}
              <div
                className="gsap-entry flex items-center gap-2"
                style={{ opacity: 0, transform: "translateY(8px)" }}
              >
                {/* View toggle */}
                {!isLoading && projects.length > 0 && (
                  <div className="hidden sm:flex items-center rounded-lg border border-white/[0.08] bg-white/[0.02] p-0.5">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-md transition-all cursor-pointer ${
                        viewMode === "list"
                          ? "bg-gold-500/10 text-gold-500"
                          : "text-white/30 hover:text-white/50"
                      }`}
                      title="List view"
                    >
                      <List size={15} />
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-md transition-all cursor-pointer ${
                        viewMode === "grid"
                          ? "bg-gold-500/10 text-gold-500"
                          : "text-white/30 hover:text-white/50"
                      }`}
                      title="Grid view"
                    >
                      <Grid3X3 size={15} />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setOpen(true)}
                  className="group inline-flex items-center justify-center gap-1.5 h-9 md:h-10 px-4 md:px-5 rounded-lg bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 hover:border-gold-500/50 text-gold-500 font-bold text-xs md:text-sm transition-all cursor-pointer"
                >
                  <Plus size={15} />
                  New Project
                </button>
              </div>
            </div>

            {/* ── Search ── */}
            {!isLoading && projects.length > 0 && (
              <div
                ref={searchRef}
                className="relative mb-5 md:mb-6"
                style={{ opacity: 0, transform: "translateY(6px)" }}
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                <input
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 h-9 md:h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-gold-500/40 focus:bg-white/[0.06]"
                />
              </div>
            )}

            {/* ── Loading skeletons ── */}
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 md:gap-4 py-3.5 md:py-4 px-3 md:px-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                    style={{ opacity: 1 - i * 0.15 }}
                  >
                    <Skeleton className="hidden sm:block h-10 w-10 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[40%]" />
                      <Skeleton className="h-3 w-[65%]" />
                    </div>
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              /* ── Empty state ── */
              <div
                ref={emptyRef}
                style={{ opacity: 0, transform: "translateY(12px)" }}
              >
                <EmptyState onCreateClick={() => setOpen(true)} />
              </div>
            ) : filtered.length === 0 ? (
              /* ── No search results ── */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm text-white/40">
                  No projects match &ldquo;{search}&rdquo;
                </p>
              </div>
            ) : (
              /* ── Project lists ── */
              <div className="space-y-6">
                {/* Pinned section */}
                {pinnedProjects.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono font-bold text-gold-500/60 tracking-[0.2em] uppercase mb-3">
                      Pinned
                    </p>
                    <div className="rounded-xl border border-gold-500/[0.15] bg-gold-500/[0.03] p-3">
                      {renderCards(pinnedProjects, pinnedListRef, 0)}
                    </div>
                  </div>
                )}

                {/* All projects section */}
                <div>
                  {pinnedProjects.length > 0 && (
                    <p className="text-[10px] font-mono font-bold text-white/30 tracking-[0.2em] uppercase mb-3">
                      All Projects
                    </p>
                  )}
                  {renderCards(
                    unpinnedProjects,
                    listRef,
                    pinnedProjects.length
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile bottom navigation ── */}
      <BottomNav />
    </>
  )
}

export default TestProjectPage
