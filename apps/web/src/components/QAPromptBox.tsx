"use client"

import { useState, useRef, useEffect } from "react"
import { Send, ChevronLeft, ChevronRight } from "lucide-react"

interface QAPromptBoxProps {
  question: string
  options: string[]
  questionNumber: number
  totalQuestions: number
  onAnswer: (answer: string) => void
}

export function QAPromptBox({ question, options, questionNumber, totalQuestions, onAnswer }: QAPromptBoxProps) {
  const [otherText, setOtherText] = useState("")
  const [hoveredOption, setHoveredOption] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setOtherText("")
  }, [question])

  function handleOptionClick(option: string) {
    onAnswer(option)
  }

  function handleSubmit() {
    if (!otherText.trim()) return
    onAnswer(otherText.trim())
    setOtherText("")
  }

  return (
    <div className="w-full max-w-3xl">
      <div
        className="overflow-hidden border border-white/[0.08]"
        style={{ backgroundColor: "#0A0A0A", borderRadius: "16px" }}
      >
        {/* Outer wrapper */}
        <div className="p-2">
          {/* Question header */}
          <div className="flex items-center gap-2 px-4 py-3">
            <p className="flex-1 text-[15px] font-semibold text-white/85 tracking-[-0.02em]">
              {question}
            </p>
            {totalQuestions > 1 && (
              <span className="text-[12px] text-white/25 font-mono tabular-nums flex-shrink-0">
                {questionNumber}/{totalQuestions}
              </span>
            )}
          </div>

          {/* Options */}
          {options.length > 0 && (
            <div className="px-3 pb-2">
              <div
                className="overflow-hidden border border-white/[0.06]"
                style={{ borderRadius: "12px" }}
              >
                {options.map((option, i) => (
                  <button
                    key={option}
                    onClick={() => handleOptionClick(option)}
                    onMouseEnter={() => setHoveredOption(i)}
                    onMouseLeave={() => setHoveredOption(null)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer"
                    style={{
                      backgroundColor: hoveredOption === i ? "rgba(255,255,255,0.04)" : "transparent",
                      borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    }}
                  >
                    <span
                      className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-[13px] font-semibold text-white/40"
                      style={{ backgroundColor: "#1A1A1A", borderRadius: "6px" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[14px] font-medium text-white/55">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Free text input */}
          <div
            className="flex items-center gap-2 px-4 py-3 mx-1 mb-1"
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <input
              ref={inputRef}
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={options.length > 0 ? "Or type your own answer..." : "Type your answer..."}
              className="flex-1 bg-transparent text-[14px] text-white/80 placeholder:text-white/25 outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!otherText.trim()}
              className={`w-8 h-8 flex items-center justify-center flex-shrink-0 transition-all ${
                otherText.trim()
                  ? "text-gold-500 hover:bg-gold-500/10"
                  : "text-white/15"
              }`}
              style={{ borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
