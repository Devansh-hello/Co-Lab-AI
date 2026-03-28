"use client"

import { useState } from "react"
import { CreateProjectModal } from "../components/CreateProject"
import { Button } from "../components/ui/button"
import { Header } from "../components/header"
import { GridOverlay } from "../components/GridOverlay"
import { Plus, ArrowRight, FolderOpen, Trash2, Search } from "lucide-react"
import { Separator } from "../components/ui/separator"
import { Skeleton } from "../components/ui/skeleton"
import useContent from "../hooks/useContent"
import { Link } from "react-router-dom"
import { deleteProject } from "../functions/send"

function ProjectPage() {
  const [open, setOpen] = useState(false)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[90%] max-w-sm bg-card border border-border/60 rounded-xl p-5 md:p-6 flex flex-col gap-3 md:gap-4 animate-spring-in shadow-elevation-3 text-center">
            <div className="p-3 rounded-xl bg-destructive/10 w-fit mx-auto">
              <Trash2 size={22} className="text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Delete Project?</h2>
            <p className="text-sm text-muted-foreground">This will permanently delete the project and all its messages.</p>
            <div className="flex gap-3 mt-1">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="flex-1 border-border/50 hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="flex-1 bg-destructive hover:bg-destructive/80 text-destructive-foreground font-semibold"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col min-h-screen w-full bg-background bg-grainy">
        <GridOverlay />
        <Header />

        <div className="flex-1 w-full max-w-4xl mx-auto px-6 md:px-10 py-8 md:py-12 relative z-[1]">
          {/* Page header */}
          <div className="flex items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <p className="text-[10px] font-mono text-[#D4AF37]/50 mb-1 tracking-[0.15em] uppercase font-bold">Workspace</p>
              <h1 className="text-xl md:text-3xl font-bold text-foreground tracking-tight">Projects</h1>
              {!isLoading && (
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                  {projects.length} {projects.length === 1 ? "project" : "projects"}
                </p>
              )}
            </div>
            <button
              onClick={() => setOpen(true)}
              className="group inline-flex items-center justify-center gap-1.5 h-9 md:h-10 px-4 md:px-5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/30 hover:border-[#D4AF37]/50 text-[#D4AF37] font-bold text-xs md:text-sm backdrop-blur-md transition-all"
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
                className="w-full pl-9 h-9 md:h-10 rounded-lg glass-input text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-[#D4AF37]/30 focus:shadow-input-focus"
              />
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 md:gap-4 py-3.5 md:py-4 px-3 md:px-4 rounded-xl border border-white/[0.04] bg-white/[0.01]">
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
              <div className="group relative w-full max-w-sm mb-6 md:mb-8 rounded-2xl overflow-hidden border border-border/20 hover:border-[#D4AF37]/20 transition-colors duration-700 cursor-pointer" onClick={() => setOpen(true)}>
                <img
                  src="/ART/drafting-table.jpg"
                  alt="An architect's drafting table awaits"
                  className="w-full h-auto object-cover opacity-75 group-hover:opacity-90 group-hover:scale-[1.03] transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
                {/* Gold vignette glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{
                  background: "radial-gradient(ellipse at center bottom, rgba(212,175,55,0.08) 0%, transparent 70%)"
                }} />
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="w-6 h-px bg-[#D4AF37]/50 mb-3" />
                  <p className="text-white/90 font-medium text-sm md:text-base tracking-tight">Your workspace is ready</p>
                  <p className="text-white/40 text-xs mt-1 tracking-wide">The instruments await your first creation</p>
                </div>
              </div>
              <Button onClick={() => setOpen(true)} size="sm" className="font-semibold">
                <Plus size={15} className="mr-1.5" />
                Create Project
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-muted-foreground">No projects match "{search}"</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map(
                (
                  { name, description, _id, createdAt },
                  index
                ) => (
                  <div key={_id}>
                    <div
                      className="group flex items-center gap-3 md:gap-4 py-3.5 md:py-4 px-3 md:px-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#D4AF37]/15 transition-all"
                      style={{ animation: `fade-slide-up 0.3s ${index * 0.05}s ease both` }}
                    >
                      <Link to={`/chat/${_id}`} className="flex-1 min-w-0 flex items-center gap-3 md:gap-4">
                        <div className="hidden sm:flex h-10 w-10 rounded-lg bg-[#D4AF37]/8 border border-[#D4AF37]/15 items-center justify-center flex-shrink-0">
                          <FolderOpen size={16} className="text-[#D4AF37]/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-foreground truncate">
                            {name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {description && (
                              <p className="text-xs text-muted-foreground truncate flex-1 min-w-0">
                                {description}
                              </p>
                            )}
                            {createdAt && (
                              <span className="hidden sm:inline text-[11px] text-muted-foreground/30 flex-shrink-0">
                                {new Date(createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault()
                            setConfirmDeleteId(_id)
                          }}
                          className="h-8 w-8 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 md:opacity-0 md:group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </Button>
                        <Link to={`/chat/${_id}`} className="p-1.5">
                          <ArrowRight size={15} className="text-muted-foreground/25 group-hover:text-muted-foreground/60 transition-colors" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ProjectPage
