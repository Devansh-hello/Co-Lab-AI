"use client"

import { useState } from "react"
import { CreateProjectModal } from "../components/CreateProject"
import { Sidebar } from "../components/sidebar"
import { Plus, FolderOpen, Trash2, Search, Menu } from "lucide-react"
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

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  )

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}>
          <div className="w-[90%] max-w-sm bg-[#0c0c0c] border border-white/[0.08] rounded-xl p-5 md:p-6 flex flex-col gap-4 animate-spring-in shadow-elevation-3 text-center" onClick={(e) => e.stopPropagation()}>
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

      <div className="flex flex-row h-screen w-screen bg-background overflow-hidden">
        <div className="hidden md:block"><Sidebar /></div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60 animate-overlay-in" onClick={() => setSidebarOpen(false)} />
            <div className="relative z-10 h-full w-[280px] animate-slide-in-left"><Sidebar /></div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto chat-scroll bg-grainy">
          <div className="w-full max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {/* Page header */}
          <div className="flex items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors cursor-pointer">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <p className="text-[11px] font-mono text-gold-500/50 mb-1 tracking-[0.15em] uppercase font-bold">Workspace</p>
                <h1 className="text-xl md:text-3xl font-bold text-foreground tracking-tight">Projects</h1>
                {!isLoading && (
                  <p className="text-[13px] text-white/40 mt-0.5 md:mt-1">
                    {projects.length} {projects.length === 1 ? "project" : "projects"}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="group inline-flex items-center justify-center gap-1.5 h-9 md:h-10 px-4 md:px-5 rounded-lg bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 hover:border-gold-500/50 text-gold-500 font-bold text-xs md:text-sm transition-all cursor-pointer"
            >
              <Plus size={15} />
              New Project
            </button>
          </div>

          {/* Search */}
          {!isLoading && projects.length > 0 && (
            <div className="relative mb-5 md:mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 h-9 md:h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-gold-500/40 focus:bg-white/[0.06]"
              />
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 md:gap-4 py-3.5 md:py-4 px-3 md:px-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
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
            <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center px-4">
              {/* Drafting table art */}
              <div className="group relative w-full max-w-sm mb-6 md:mb-8 rounded-xl overflow-hidden border border-white/[0.08] hover:border-gold-500/20 transition-colors duration-700 cursor-pointer" onClick={() => setOpen(true)}>
                <img
                  src="/ART/drafting-table.jpg"
                  alt="An architect's drafting table awaits"
                  className="w-full h-auto object-cover opacity-75 group-hover:opacity-90 group-hover:scale-[1.03] transition-all duration-700"
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
                className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-lg bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 hover:border-gold-500/50 text-gold-500 font-bold text-sm transition-all cursor-pointer"
              >
                <Plus size={15} />
                Create Project
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-white/40">No projects match &ldquo;{search}&rdquo;</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(
                (
                  { name, description, _id, createdAt },
                  index
                ) => (
                  <Link
                    key={_id}
                    href={`/chat/${_id}`}
                    className="group flex items-center gap-3 md:gap-4 py-3.5 md:py-4 px-3 md:px-4 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-gold-500/20 transition-all"
                    style={{ animation: `fade-slide-up 0.3s ${index * 0.05}s ease both` }}
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
                        {createdAt && (
                          <span className="hidden sm:inline text-[11px] text-white/25 flex-shrink-0 font-mono">
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
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </Link>
                )
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  )
}

export default ProjectPage
