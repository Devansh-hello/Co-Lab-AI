"use client"

import { useState } from "react"
import { CreateProjectModal } from "../components/CreateProject"
import { Button } from "../components/ui/button"
import { Header } from "../components/header"
import { Plus, ArrowRight, Edit3, FolderOpen, Trash2 } from "lucide-react"
import useContent from "../hooks/useContent"
import { Link } from "react-router-dom"
import { deleteProject } from "../functions/send"

function ProjectPage() {
  const [open, setOpen] = useState(false)
  const projects = useContent()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await deleteProject(id)
      window.location.reload()
    } catch (err) {
      console.error("[deleteProject]", err)
    } finally {
      setDeleting(false)
      setConfirmDeleteId(null)
    }
  }

  return (
    <>
      <CreateProjectModal
        open={open}
        onclose={() => setOpen(false)}
      />

      {/* Delete Confirmation Overlay */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay transition-all duration-300">
          <div className="glass w-[90%] max-w-sm rounded-2xl p-8 flex flex-col gap-5 animate-spring-in shadow-directional text-center">
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 w-fit mx-auto">
              <Trash2 size={24} className="text-destructive" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Delete Project?</h2>
            <p className="text-sm text-muted-foreground">This will permanently delete the project and all its messages. This action cannot be undone.</p>
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border-border hover:bg-white/5 text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="flex-1 rounded-xl bg-destructive hover:bg-destructive/80 text-destructive-foreground font-semibold"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col grow p-6 gap-8 min-h-screen w-full bg-background bg-grainy items-center">
        <Header />

        <div className="flex flex-col w-full max-w-5xl gap-8">
          {/* Title Bar */}
          <div className="glass flex flex-row justify-between items-center px-8 py-6 rounded-2xl shadow-directional relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <FolderOpen size={22} className="text-primary" />
              </div>
              <div>
                <h1 className="text-foreground text-2xl font-bold tracking-wide">Your Projects</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Manage and open your workspaces</p>
              </div>
            </div>

            <Button
              onClick={() => setOpen(true)}
              className="bg-primary hover:bg-gold-600 text-primary-foreground font-semibold px-6 py-3 rounded-xl transition-bouncy duration-300 hover:-translate-y-1 hover:scale-105 shadow-gold-glow flex items-center gap-2"
            >
              <Plus size={18} />
              New Project
            </Button>
          </div>

          {/* Project Grid */}
          {projects.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-20 rounded-2xl">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 mb-4">
                <FolderOpen size={32} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg font-medium">No projects yet</p>
              <p className="text-muted-foreground/60 text-sm mt-1">Create your first project to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.map(({ name, description, _id }: { name: string; description: string; _id: string }, index: number) => (
                <div
                  key={_id}
                  className="group glass-card rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-gold-glow shine-effect"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors duration-300">
                        {name}
                      </h2>
                      {description && (
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                    <Link
                      to={"/chat/" + _id}
                      className="flex items-center gap-2 text-sm font-medium text-primary/80 hover:text-primary transition-colors duration-200 group/link"
                    >
                      Open Project
                      <ArrowRight size={14} className="transition-transform duration-200 group-hover/link:translate-x-1" />
                    </Link>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all duration-200"
                      >
                        <Edit3 size={13} />
                        Edit
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDeleteId(_id)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all duration-200"
                      >
                        <Trash2 size={13} />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ProjectPage
