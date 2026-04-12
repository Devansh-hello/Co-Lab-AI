"use client"

import { useState, useRef, useEffect } from "react"
import gsap from "gsap"
import { CreateProjectModal } from "../components/CreateProject"
import { Sidebar } from "../components/sidebar"
import { MobileSidebar } from "../components/MobileSidebar"
import { BGPattern } from "../components/ui/bg-pattern"
import { Plus, FolderOpen, Trash2, Search, Menu, Hash } from "lucide-react"
import { Skeleton } from "../components/ui/skeleton"
import useContent from "../hooks/useContent"
import Link from "next/link"
import { deleteProject } from "../functions/send"

function ProjectPage() {
  const [open, setOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { projects, isLoading, refetch } = useContent()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")

  // Page entrance animation refs
  const sidebarWrapRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  )

  // Page entrance animation — sidebar + content in sync (matches chat page)
  useEffect(() => {
    if (isLoading || hasAnimated.current) return
    hasAnimated.current = true
    requestAnimationFrame(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } })
      if (sidebarWrapRef.current) {
        tl.to(sidebarWrapRef.current, { opacity: 1, x: 0, duration: 0.38 }, 0)
      }
      if (contentRef.current) {
        tl.to(contentRef.current, { opacity: 1, y: 0, duration: 0.38 }, 0.05)
      }
    })
  }, [isLoading])

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

  return (
    <>
      <CreateProjectModal open={open} onclose={() => setOpen(false)} />

      {/* Delete Confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-overlay-in" onClick={() => setConfirmDeleteId(null)}>
          <div className="w-[90%] max-w-sm bg-[#0c0c0c] border border-white/[0.08] rounded-xl p-5 md:p-6 flex flex-col gap-4 animate-popover-in shadow-elevation-3 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 rounded-xl bg-red-500/10 w-fit mx-auto">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Delete Project?</h2>
            <p className="text-sm text-white/55">This will permanently delete the project and all its messages.</p>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg border border-white/[0.1] text-white/50 hover:text-white hover:border-white/20 hover:bg-white/[0.04] font-semibold text-sm transition-[color,border-color,background-color] duration-[180ms] disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold text-sm transition-[background-color,opacity] duration-[180ms] disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-row h-screen w-screen bg-background overflow-hidden">
        {/* Desktop sidebar */}
        <div ref={sidebarWrapRef} className="hidden md:block" style={{ opacity: 0, transform: "translateX(-16px)" }}>
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* ── Main Content Area ───────────────────────────────── */}
        <div ref={contentRef} className="flex flex-col h-full flex-1 overflow-hidden min-w-0" style={{ opacity: 0, transform: "translateY(8px)" }}>

          {/* Top bar — matches chat page */}
          <div className="flex items-center justify-between px-4 md:px-6 py-2 border-b border-white/[0.05] flex-shrink-0 bg-[#050505]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1.5 rounded-lg text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-4 h-4 text-gold-500/50" />
                <span className="text-[13px] font-semibold text-white/70 tracking-[-0.02em]">Projects</span>
                {!isLoading && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/35 tabular-nums">
                    {projects.length}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 h-8 md:h-9 px-3 md:px-4 rounded-lg bg-gold-500/[0.08] hover:bg-gold-500/[0.12] border border-gold-500/20 hover:border-gold-500/35 text-gold-500 font-bold text-[12px] md:text-[13px] transition-[background-color,border-color] duration-[180ms] cursor-pointer tracking-[-0.02em]"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Project</span>
            </button>
          </div>

          {/* ── Content with BGPattern ───────────────────────── */}
          <div className="relative flex flex-col flex-1 overflow-hidden min-w-0">
            <BGPattern mask="fade-edges" size={28} fill="rgba(255,255,255,0.03)" />

            <div className="relative z-[1] flex-1 overflow-y-auto chat-scroll">
              <div className="w-full max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">

                {/* Page heading */}
                <div className="mb-6 md:mb-8">
                  <p className="text-[10px] font-mono text-gold-500/40 mb-1.5 tracking-[0.15em] uppercase font-bold">Workspace</p>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-white/90 tracking-[-0.03em]">Your Projects</h1>
                  {!isLoading && (
                    <p className="text-[13px] text-white/35 mt-1 font-medium">
                      {projects.length === 0
                        ? "No projects yet — create your first one"
                        : `${projects.length} ${projects.length === 1 ? "project" : "projects"} in your workspace`}
                    </p>
                  )}
                </div>

                {/* Search */}
                {!isLoading && projects.length > 0 && (
                  <div className="relative mb-5 md:mb-6">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 pointer-events-none" />
                    <input
                      placeholder="Search projects..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 h-9 md:h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[13px] text-white/65 placeholder:text-white/25 outline-none transition-[border-color,background-color] duration-[180ms] focus:border-gold-500/30 focus:bg-white/[0.05]"
                    />
                  </div>
                )}

                {/* Loading skeletons */}
                {isLoading ? (
                  <div className="flex flex-col gap-2.5">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 md:gap-4 py-4 md:py-4.5 px-4 md:px-5 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                        style={{
                          opacity: 1 - i * 0.15,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                        }}
                      >
                        <Skeleton className="hidden sm:block h-10 w-10 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2.5">
                          <Skeleton className="h-3.5 w-[35%]" />
                          <Skeleton className="h-3 w-[55%]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : projects.length === 0 ? (
                  /* ── Empty state ──────────────────── */
                  <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center px-4">
                    <div className="group relative w-full max-w-sm mb-6 md:mb-8 rounded-xl overflow-hidden border border-white/[0.08] hover:border-gold-500/20 transition-[border-color] duration-700 cursor-pointer" onClick={() => setOpen(true)}>
                      <img
                        src="/ART/drafting-table.jpg"
                        alt="An architect's drafting table awaits"
                        className="w-full h-auto object-cover opacity-75 group-hover:opacity-90 group-hover:scale-[1.03] transition-[opacity,transform] duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{
                        background: "radial-gradient(ellipse at center bottom, rgba(230,179,62,0.08) 0%, transparent 70%)"
                      }} />
                      <div className="absolute bottom-5 left-5 right-5">
                        <div className="w-6 h-px bg-gold-500/50 mb-3" />
                        <p className="text-white/90 font-medium text-sm md:text-base tracking-tight">Your workspace is ready</p>
                        <p className="text-white/40 text-xs mt-1 tracking-wide">The instruments await your first creation</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl bg-gold-500/[0.08] hover:bg-gold-500/[0.12] border border-gold-500/20 hover:border-gold-500/35 text-gold-500 font-bold text-sm transition-[background-color,border-color] duration-[180ms] cursor-pointer"
                    >
                      <Plus size={15} />
                      Create Project
                    </button>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Hash className="w-5 h-5 text-white/[0.06] mb-2" />
                    <p className="text-[13px] text-white/35 font-medium">No projects match &ldquo;{search}&rdquo;</p>
                  </div>
                ) : (
                  /* ── Project list ──────────────────── */
                  <div className="flex flex-col gap-2">
                    {filtered.map(
                      (
                        { name, description, _id, createdAt },
                        index
                      ) => (
                        <Link
                          key={_id}
                          href={`/chat/${_id}`}
                          className="group flex items-center gap-3 md:gap-4 py-3.5 md:py-4 px-4 md:px-5 rounded-xl border border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.05] hover:border-gold-500/15 transition-[background-color,border-color,box-shadow] duration-[180ms]"
                          style={{
                            animation: `fade-slide-up 0.38s ${index * 0.05}s cubic-bezier(0.22, 1, 0.36, 1) both`,
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                          }}
                        >
                          <div className="flex h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-gold-500/[0.06] border border-gold-500/10 items-center justify-center flex-shrink-0">
                            <FolderOpen size={15} className="text-gold-500/60" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[13px] font-semibold text-white/80 truncate group-hover:text-white/95 transition-colors tracking-[-0.01em]">
                              {name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              {description && (
                                <p className="text-[12px] text-white/30 truncate flex-1 min-w-0">
                                  {description}
                                </p>
                              )}
                              {createdAt && (
                                <span className="hidden sm:inline text-[10px] text-white/20 flex-shrink-0 font-mono tabular-nums">
                                  {new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setConfirmDeleteId(_id)
                            }}
                            className="h-8 w-8 flex items-center justify-center rounded-lg text-white/10 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-[color,background-color,opacity] duration-[180ms] cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProjectPage
