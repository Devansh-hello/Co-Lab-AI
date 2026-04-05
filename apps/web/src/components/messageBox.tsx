"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Loader2 } from "lucide-react"

interface MessageBoxProps {
  onSendMessage: (message: string) => void
  isGenerating: boolean
  hasMessages?: boolean
}

export const MessageBox: React.FC<MessageBoxProps> = ({ onSendMessage, isGenerating, hasMessages }) => {
  const [message, setMessage] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px"
    }
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isGenerating) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const hasContent = message.trim().length > 0

  return (
    <div className="w-full max-w-3xl relative">
      {/* Agent running indicator */}
      {isGenerating && (
        <div className="flex items-center gap-2 px-4 mb-2 animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-[#52d68c] animate-agent-pulse" />
          <span className="text-[13px] font-medium text-[#52d68c] tracking-tight">
            Agent is running
          </span>
        </div>
      )}

      {/* Outer wrapper */}
      <div className={`
        rounded-[20px] border transition-all duration-300
        ${isFocused || hasContent
          ? "bg-[#050505]/80 backdrop-blur-xl border-[#3a3420] shadow-[0_0_0_1px_rgba(212,175,55,0.06),0_-4px_24px_rgba(0,0,0,0.4),0_-1px_4px_rgba(0,0,0,0.2)]"
          : "bg-[#050505]/70 backdrop-blur-xl border-white/[0.12] shadow-message-box"
        }
        p-1.5
      `}>
        {/* Inner input area */}
        <form
          onSubmit={handleSubmit}
          className={`
            flex items-end gap-2 w-full px-4 py-3 rounded-2xl border transition-all duration-200
            ${isFocused
              ? "bg-[#111]/60 border-transparent"
              : "bg-[#111]/50 border-transparent"
            }
          `}
        >
          {/* Textarea input */}
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={isGenerating ? "Agent is working..." : hasMessages ? "Send a follow-up..." : "What do you want to build?"}
            disabled={isGenerating}
            rows={1}
            data-no-focus-ring
            className={`
              flex-1 bg-transparent border-0 resize-none
              text-[15px] font-medium leading-relaxed tracking-[-0.01em]
              placeholder:text-white/25 disabled:text-white/20
              min-h-[24px] max-h-[120px] py-0.5
              ${isGenerating ? "text-white/30" : "text-white/90"}
            `}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={isGenerating || !hasContent}
            className={`
              flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-all duration-200 mb-0.5
              ${hasContent && !isGenerating
                ? "bg-gold-500 text-black hover:bg-gold-400 shadow-[0_0_16px_rgba(212,175,55,0.2)]"
                : isGenerating
                  ? "bg-transparent text-white/20"
                  : "bg-transparent text-white/15 border border-white/[0.12]"
              }
              disabled:cursor-default
            `}
          >
            {isGenerating
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />
            }
          </button>
        </form>
      </div>
    </div>
  )
}
