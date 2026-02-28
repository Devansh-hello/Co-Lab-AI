"use client"

import type React from "react"
import { useState } from "react"
import { Send, Loader2 } from "lucide-react"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isGenerating) {
      const chosen = BACKEND_MODELS[selectedModel]
      onSendMessage(message.trim(), chosen.provider, chosen.model)
      setMessage("")
    }
  }

  return (
    <div className="w-full max-w-4xl flex flex-col items-center justify-center p-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full backdrop-blur-xl bg-card/60 p-4 rounded-[2rem] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex gap-2 text-sm items-center">
          <span className="text-xs text-muted-foreground font-medium px-2 whitespace-nowrap">Backend Model:</span>
          <div className="flex gap-1.5">
            {BACKEND_MODELS.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModel(i)}
                disabled={isGenerating}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${selectedModel === i
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)] shadow-gold-glow scale-105"
                  : "bg-white/5 backdrop-blur-sm text-foreground border-white/10 hover:border-primary/50"
                  } disabled:opacity-50`}
              >
                <img src={m.icon} alt="" className={`w-4 h-4 rounded-sm ${selectedModel === i && m.id !== "anthropic" ? "brightness-0" : ""}`} />
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 relative">
          <div className="flex-1 relative">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isGenerating ? "AI is working..." : "Describe your project idea..."}
              disabled={isGenerating}
              className="w-full h-auto min-h-[60px] px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:shadow-gold-glow disabled:opacity-50 transition-bouncy font-medium text-foreground placeholder:text-muted-foreground text-lg tracking-wide"
            />
          </div>
          <Button
            type="submit"
            disabled={isGenerating || !message.trim()}
            className="h-[60px] px-6 bg-gradient-to-r from-primary to-gold-600 hover:opacity-90 text-primary-foreground rounded-full disabled:opacity-50 transition-bouncy hover:scale-105 hover:-translate-y-0.5 shadow-gold-glow font-bold flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
