"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
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
  const [errors, setErrors] = useState<{ name?: boolean; desc?: boolean }>({})
  const router = useRouter()

  // Close on ESC
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onclose?.()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onclose])

  // Auto-focus name field on open
  useEffect(() => {
    if (open) setTimeout(() => nameRef.current?.focus(), 100)
  }, [open])

  async function handleCreate() {
    const name = nameRef.current?.value?.trim()
    const description = descRef.current?.value?.trim()

    const newErrors = { name: !name, desc: !description }
    if (newErrors.name || newErrors.desc) {
      setErrors(newErrors)
      if (newErrors.name) nameRef.current?.focus()
      else if (newErrors.desc) descRef.current?.focus()
      return
    }
    setErrors({})

    setLoading(true)
    try {
      const response = await sendProject(name, description)

      if (response && response.status == 200) {
        const projectId = response.res?.projectId
        onclose?.()
        if (projectId) {
          sessionStorage.setItem(`autostart_${projectId}`, `Project: ${name}\n\n${description}`)
          router.push(`/chat/${projectId}?autostart=true`)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-overlay-in" onClick={onclose}>
      <div
        className="w-[92%] max-w-md bg-[#0c0c0c] border border-white/[0.08] rounded-xl p-5 md:p-6 flex flex-col gap-5 animate-popover-in shadow-elevation-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
              <Sparkles size={14} className="text-gold-500" />
            </div>
            <h2 className="text-lg font-semibold text-white">New Project</h2>
          </div>
          <button
            onClick={onclose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <label className="block text-[11px] font-mono font-bold text-white/40 tracking-[0.15em] uppercase">
              Project Name
            </label>
            <input
              placeholder="My Awesome Project"
              className={`w-full h-10 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-gold-500/40 focus:bg-white/[0.06] ${errors.name ? "!border-red-500/50" : ""}`}
              ref={nameRef}
              onKeyDown={onNameKey}
              onChange={() => errors.name && setErrors(e => ({ ...e, name: false }))}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-mono font-bold text-white/40 tracking-[0.15em] uppercase">
              Description
            </label>
            <textarea
              placeholder="Describe what you want to build..."
              className={`w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-gold-500/40 focus:bg-white/[0.06] resize-none ${errors.desc ? "!border-red-500/50" : ""}`}
              rows={3}
              ref={descRef}
              onKeyDown={onDescKey}
              onChange={() => errors.desc && setErrors(e => ({ ...e, desc: false }))}
            />
            <p className="text-[11px] text-white/30 font-mono">
              Enter to create · Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-white/[0.06]" />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onclose}
            disabled={loading}
            className="flex-1 h-10 rounded-lg border border-white/[0.1] text-white/50 hover:text-white hover:border-white/20 hover:bg-white/[0.04] font-semibold text-sm transition-[color,border-color,background-color] duration-[180ms] disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 h-10 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-bold text-sm transition-[background-color,opacity] duration-[180ms] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
