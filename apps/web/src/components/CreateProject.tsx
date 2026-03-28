"use client"

import type React from "react"
import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Sparkles, X } from "lucide-react"
import { sendProject } from "../functions/send"

interface ProjectModalProps {
  open: boolean
  onclose?: () => void
}

export function CreateProjectModal({ open, onclose }: ProjectModalProps) {
  const nameRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleCreate() {
    const name = nameRef.current?.value
    const description = descRef.current?.value

    if (!name || !description) return

    setLoading(true)
    try {
      const response = await sendProject(name, description)

      if (response && response.status == 200) {
        const projectId = response.res?.projectId
        onclose?.()
        if (projectId) {
          sessionStorage.setItem(`autostart_${projectId}`, `Project: ${name}\n\n${description}`)
          navigate(`/chat/${projectId}?autostart=true`)
        } else {
          window.location.href = "/projects"
        }
        return
      }
    } catch (err) {
      console.error("[createProject]", err)
    }
    setLoading(false)
  }

  function onNameKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") descRef.current?.focus()
  }

  function onDescKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleCreate()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[92%] max-w-md bg-[#0c0c0c] border border-white/[0.08] rounded-2xl p-5 md:p-6 flex flex-col gap-4 md:gap-5 animate-spring-in shadow-elevation-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
              <Sparkles size={14} className="text-[#D4AF37]" />
            </div>
            <h2 className="text-lg font-semibold text-white">New Project</h2>
          </div>
          <button
            onClick={onclose}
            className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <label className="block text-[11px] font-mono font-bold text-white/40 tracking-[0.1em] uppercase">Project Name</label>
            <input
              placeholder="My Awesome Project"
              className="w-full h-10 px-4 rounded-xl glass-input text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-[#D4AF37]/30 focus:shadow-input-focus"
              ref={nameRef}
              onKeyDown={onNameKey}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-mono font-bold text-white/40 tracking-[0.1em] uppercase">Description</label>
            <textarea
              placeholder="Describe what you want to build..."
              className="w-full px-4 py-3 rounded-xl glass-input text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-[#D4AF37]/30 focus:shadow-input-focus resize-none"
              rows={3}
              ref={descRef}
              onKeyDown={onDescKey}
            />
            <p className="text-[11px] text-white/20 font-mono">Enter to create · Shift+Enter for new line</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onclose}
            disabled={loading}
            className="flex-1 h-10 rounded-xl border border-white/[0.1] text-white/50 hover:text-white hover:border-white/20 hover:bg-white/[0.04] font-semibold text-sm transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 h-10 rounded-xl bg-[#D4AF37] hover:bg-[#E0C050] text-black font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shine-gold"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
