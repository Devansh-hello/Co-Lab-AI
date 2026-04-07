"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Square } from "lucide-react"

interface MessageBoxProps {
  onSendMessage: (message: string) => void
  onStop?: () => void
  isGenerating: boolean
  hasMessages?: boolean
}

export const MessageBox: React.FC<MessageBoxProps> = ({ onSendMessage, onStop, isGenerating, hasMessages }) => {
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
      {/* Outer wrapper — glass pill */}
      <div className={`
        rounded-[20px] border transition-all duration-300
        ${isFocused || hasContent
          ? "bg-white/[0.06] backdrop-blur-2xl border-[#3a3420]/60 shadow-[0_0_0_1px_rgba(212,175,55,0.06),0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "bg-white/[0.04] backdrop-blur-2xl border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]"
        }
        p-1.5
      `}>
        {/* Inner input area */}
        <form
          onSubmit={handleSubmit}
          className={`
            flex ${hasContent ? "items-end" : "items-center"} gap-2 w-full px-4 py-3 rounded-2xl border transition-all duration-200
            ${isFocused
              ? "bg-white/[0.04] border-white/[0.06]"
              : "bg-white/[0.02] border-transparent"
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

          {/* Send / Stop button */}
          {isGenerating && onStop ? (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-all duration-200
                bg-white/[0.08] text-white/60 hover:bg-red-500/20 hover:text-red-400 border border-white/[0.1]"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!hasContent}
              className={`
                flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-all duration-200
                ${hasContent
                  ? "bg-gold-500 text-black hover:bg-gold-400 shadow-[0_0_16px_rgba(212,175,55,0.2)]"
                  : "bg-transparent text-white/15 border border-white/[0.12]"
                }
                disabled:cursor-default
              `}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
