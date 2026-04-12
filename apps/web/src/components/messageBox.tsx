"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Square, ChevronLeft, ChevronRight } from "lucide-react"

interface MessageBoxProps {
  onSendMessage: (message: string) => void
  onStop?: () => void
  isGenerating: boolean
  hasMessages?: boolean
  // Q&A mode
  qaQuestion?: string
  qaOptions?: string[]
  qaQuestionNumber?: number
  qaTotalQuestions?: number
  onQAAnswer?: (answer: string) => void
  onQAPrev?: () => void
  onQANext?: () => void
  canQAPrev?: boolean
  canQANext?: boolean
}

export const MessageBox: React.FC<MessageBoxProps> = ({
  onSendMessage, onStop, isGenerating, hasMessages,
  qaQuestion, qaOptions, qaQuestionNumber, qaTotalQuestions, onQAAnswer,
  onQAPrev, onQANext, canQAPrev, canQANext,
}) => {
  const [message, setMessage] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [hoveredOption, setHoveredOption] = useState<number | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isQAMode = !!qaQuestion && !!onQAAnswer

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px"
    }
  }, [message])

  // Reset when question changes
  useEffect(() => {
    if (isQAMode) {
      setMessage("")
      setSelectedOption(null)
    }
  }, [qaQuestion])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isQAMode && onQAAnswer) {
      if (message.trim()) {
        onQAAnswer(message.trim())
        setMessage("")
        setSelectedOption(null)
      } else if (selectedOption !== null && qaOptions) {
        onQAAnswer(qaOptions[selectedOption])
        setSelectedOption(null)
      }
    } else if (!isGenerating && message.trim()) {
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

  const handleOptionClick = (i: number) => {
    if (selectedOption === i) {
      // Double click = submit
      if (onQAAnswer && qaOptions) onQAAnswer(qaOptions[i])
      setSelectedOption(null)
    } else {
      setSelectedOption(i)
      setMessage("")
    }
  }

  const hasContent = message.trim().length > 0
  const canSubmit = hasContent || selectedOption !== null

  return (
    <div className="w-full max-w-3xl relative">
      <div className={`
        rounded-[20px] border transition-all duration-300
        ${isFocused || hasContent || isQAMode
          ? "bg-white/[0.06] backdrop-blur-2xl border-[#3a3420]/60 shadow-[0_0_0_1px_rgba(230,179,62,0.06),0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "bg-white/[0.04] backdrop-blur-2xl border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]"
        }
        p-1.5
      `}>

        {/* Q&A Section */}
        {isQAMode && (
          <div className="mb-1.5">
            {/* Question header with prev/next */}
            <div className="flex items-center gap-2 px-4 py-2.5">
              <p className="flex-1 text-[14px] font-semibold text-white/80 tracking-[-0.02em]">
                {qaQuestion}
              </p>
              {(qaTotalQuestions ?? 0) > 1 && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={onQAPrev}
                    disabled={!canQAPrev}
                    className={`w-6 h-6 flex items-center justify-center transition-colors cursor-pointer ${canQAPrev ? "text-white/30 hover:text-white/60 hover:bg-white/[0.05]" : "text-white/10 cursor-default"}`}
                    style={{ borderRadius: "5px" }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-white/25 font-mono tabular-nums">
                    {qaQuestionNumber}/{qaTotalQuestions}
                  </span>
                  <button
                    onClick={onQANext}
                    disabled={!canQANext}
                    className={`w-6 h-6 flex items-center justify-center transition-colors cursor-pointer ${canQANext ? "text-white/30 hover:text-white/60 hover:bg-white/[0.05]" : "text-white/10 cursor-default"}`}
                    style={{ borderRadius: "5px" }}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Options */}
            {qaOptions && qaOptions.length > 0 && (
              <div className="px-1.5 pb-1">
                {qaOptions.map((option, i) => {
                  const isSelected = selectedOption === i
                  return (
                    <button
                      key={option}
                      onClick={() => handleOptionClick(i)}
                      onMouseEnter={() => setHoveredOption(i)}
                      onMouseLeave={() => setHoveredOption(null)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-100 cursor-pointer"
                      style={{
                        borderRadius: "12px",
                        backgroundColor: isSelected
                          ? "rgba(230,179,62,0.08)"
                          : hoveredOption === i ? "rgba(255,255,255,0.04)" : "transparent",
                        border: isSelected ? "1px solid rgba(230,179,62,0.20)" : "1px solid transparent",
                      }}
                    >
                      <span
                        className="w-7 h-7 flex items-center justify-center flex-shrink-0 text-[12px] font-semibold transition-colors"
                        style={{
                          backgroundColor: isSelected ? "rgba(230,179,62,0.15)" : "rgba(255,255,255,0.06)",
                          color: isSelected ? "#E6B33E" : "rgba(255,255,255,0.35)",
                          borderRadius: "6px",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span className={`text-[13px] font-medium transition-colors ${isSelected ? "text-gold-500/80" : "text-white/50"}`}>
                        {option}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Input area */}
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
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => { setMessage(e.target.value); if (e.target.value.trim()) setSelectedOption(null) }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={
              isQAMode
                ? selectedOption !== null
                  ? "Press Enter to confirm, or type your own..."
                  : qaOptions && qaOptions.length > 0 ? "Or type your own answer..." : "Type your answer..."
                : isGenerating ? "Agent is working..." : hasMessages ? "Send a follow-up..." : "What do you want to build?"
            }
            disabled={isGenerating && !isQAMode}
            rows={1}
            data-no-focus-ring
            className={`
              flex-1 bg-transparent border-0 resize-none
              text-[15px] font-medium leading-relaxed tracking-[-0.01em]
              placeholder:text-white/25 disabled:text-white/20
              min-h-[24px] max-h-[120px] py-0.5
              ${isGenerating && !isQAMode ? "text-white/30" : "text-white/90"}
            `}
          />

          {isGenerating && onStop && !isQAMode ? (
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
              disabled={!canSubmit}
              className={`
                flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-all duration-200
                ${canSubmit
                  ? "bg-gold-500 text-black hover:bg-gold-400 shadow-[0_0_16px_rgba(230,179,62,0.2)]"
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
