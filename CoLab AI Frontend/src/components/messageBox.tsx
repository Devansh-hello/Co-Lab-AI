"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Loader2, ChevronUp, Check, Settings2 } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

const BACKEND_MODELS = [
  {
    id: "openrouter",
    label: "GPT-OSS 120B",
    provider: "openrouter",
    model: "openai/gpt-oss-120b:free",
    icon: "https://openrouter.ai/favicon.ico",
  },
  {
    id: "anthropic",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    model: "claude-haiku-4-5",
    icon: "https://www.anthropic.com/favicon.ico",
  },
] as const

interface MessageBoxProps {
  onSendMessage: (message: string, provider: string, model: string) => void
  isGenerating: boolean
}

export const MessageBox: React.FC<MessageBoxProps> = ({ onSendMessage, isGenerating }) => {
  const [message, setMessage] = useState("")
  const [selectedModel, setSelectedModel] = useState(0)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Close picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setShowModelPicker(false)
      }
    }
    if (showModelPicker) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showModelPicker])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isGenerating) {
      const chosen = BACKEND_MODELS[selectedModel]
      onSendMessage(message.trim(), chosen.provider, chosen.model)
      setMessage("")
    }
  }

  const currentModel = BACKEND_MODELS[selectedModel]

  return (
    <div className="w-full max-w-4xl relative">
      {/* Model picker popover */}
      {showModelPicker && (
        <div
          ref={pickerRef}
          className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-xl p-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 min-w-[220px] animate-spring-in"
        >
          <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wider">
            Select Backend Model
          </p>
          {BACKEND_MODELS.map((m, i) => (
            <button
              key={m.id}
              type="button"
              disabled={isGenerating}
              onClick={() => { setSelectedModel(i); setShowModelPicker(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all group
                ${selectedModel === i
                  ? "bg-primary/12 text-primary"
                  : "text-foreground hover:bg-white/8 hover:text-foreground"
                } disabled:opacity-50`}
            >
              <img src={m.icon} alt="" className="w-4.5 h-4.5 rounded-sm flex-shrink-0" />
              <span className="text-sm font-medium flex-1 text-left">{m.label}</span>
              {selectedModel === i && <Check className="w-3 h-3 text-primary" />}
            </button>
          ))}
        </div>
      )}

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2.5 w-full px-3 py-2.5 backdrop-blur-xl bg-card/70 rounded-2xl border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
      >
        {/* Model toggle button */}
        <button
          ref={btnRef}
          type="button"
          onClick={() => setShowModelPicker(s => !s)}
          disabled={isGenerating}
          title="Select model"
          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl flex-shrink-0 transition-all group disabled:opacity-50
            ${showModelPicker ? "bg-primary/12 text-primary" : "hover:bg-white/8 text-muted-foreground hover:text-foreground"}`}
        >
          <img src={currentModel.icon} alt="" className="w-4 h-4 rounded-sm" />
          <Settings2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
          <ChevronUp className={`w-3.5 h-3.5 opacity-60 transition-transform duration-300 ${showModelPicker ? "rotate-180" : ""}`} />
        </button>

        {/* Divider */}
        <div className="w-px h-7 bg-white/10 flex-shrink-0" />

        {/* Text input */}
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isGenerating ? "AI is generating..." : "Describe your project idea..."}
          disabled={isGenerating}
          className="flex-1 h-11 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base text-foreground placeholder:text-muted-foreground/60 disabled:opacity-50 px-2"
        />

        {/* Send button */}
        <Button
          type="submit"
          disabled={isGenerating || !message.trim()}
          className="h-10 w-10 p-0 rounded-xl bg-primary hover:bg-gold-600 text-primary-foreground disabled:opacity-35 transition-bouncy hover:scale-110 active:scale-90 shadow-gold-glow flex-shrink-0 shine-effect shine-gold"
        >
          {isGenerating
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />
          }
        </Button>
      </form>
    </div>
  )
}
