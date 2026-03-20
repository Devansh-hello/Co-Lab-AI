"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Button } from "./ui/button"
import { X, Loader2, Sparkles } from "lucide-react"
import { sendProject, getPosts } from "../functions/send"

interface projectmodal {
  open: boolean
  onclose?: () => void
}

export function CreateProjectModal({ open, onclose }: projectmodal) {
  const projectNameRef = useRef<HTMLInputElement>(null)
  const projectDescriptionRef = useRef<HTMLTextAreaElement>(null)
  const [loading, setLoading] = useState<boolean>(false)

  async function createProject() {
    const name = projectNameRef.current?.value
    const description = projectDescriptionRef.current?.value

    if (!name || !description) return;

    setLoading(true)
    try {
      const response = await sendProject(name, description)

      if (response && response.status == 200) {
        // Get the newly created project ID and redirect to chat
        const projects = await getPosts()
        const latest = Array.isArray(projects)
          ? projects.sort((a: any, b: any) => new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime())[0]
          : null
        if (latest?._id) {
          window.location.href = `/chat/${latest._id}?autostart=1`
        } else {
          window.location.href = "/projects"
        }
      }

    } catch (err) {
      console.error("[createProject]", err)
    } finally {
      setLoading(false)
    }
  }

  function onNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      projectDescriptionRef.current?.focus()
    }
  }

  function onDescKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      createProject()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay transition-all duration-300">
      <div className="glass w-[90%] max-w-lg rounded-2xl p-8 flex flex-col gap-6 animate-spring-in shadow-directional">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles size={18} className="text-primary" />
            </div>
            <h1 className="font-sans text-xl font-semibold text-foreground tracking-wide">
              Create Project
            </h1>
          </div>
          <button
            onClick={onclose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors duration-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Form */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Project Name</label>
            <input
              className="w-full glass-input rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all duration-200"
              placeholder="e.g. My Awesome Project"
              ref={projectNameRef}
              onKeyDown={onNameKeyDown}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <textarea
              className="w-full glass-input rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all duration-200 resize-none leading-relaxed"
              placeholder="Describe what this project is about..."
              rows={4}
              ref={projectDescriptionRef}
              onKeyDown={onDescKeyDown}
            />
            <p className="text-xs text-muted-foreground/50">Press Shift+Enter for new line</p>
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={createProject}
          disabled={loading}
          className="w-full bg-primary hover:bg-gold-600 text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-300 shadow-gold-glow hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating...
            </>
          ) : (
            "Create Project"
          )}
        </Button>
      </div>
    </div>
  )
}
