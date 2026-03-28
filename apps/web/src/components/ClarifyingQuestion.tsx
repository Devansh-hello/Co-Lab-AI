"use client"

import { useState } from "react"
import { Send } from "lucide-react"

interface ClarifyingQuestionProps {
  question: string
  options: string[]
  questionNumber: number
  totalQuestions: number
  onAnswer: (answer: string) => void
  answered?: string
}

export function ClarifyingQuestion({
  question,
  options,
  questionNumber,
  totalQuestions,
  onAnswer,
  answered,
}: ClarifyingQuestionProps) {
  const [otherText, setOtherText] = useState("")

  function handleOptionClick(option: string) {
    if (answered) return
    onAnswer(option)
  }

  function handleOtherSubmit() {
    if (!otherText.trim() || answered) return
    onAnswer(otherText.trim())
  }

  if (answered) {
    return (
      <div className="flex items-start gap-2 animate-spring-in">
        <div className="flex flex-col items-center">
          <div className="w-5 h-5 rounded-full border border-white/15 flex items-center justify-center">
            <span className="text-[10px] text-white/30">{questionNumber}</span>
          </div>
          {questionNumber < totalQuestions && <div className="w-px h-4 bg-white/10" />}
        </div>
        <div>
          <p className="text-xs text-white/30 mb-0.5">{question}</p>
          <p className="text-sm text-white/75">{answered}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl animate-spring-in">
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden shadow-elevation-1">
        {/* Question header */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-sm font-medium text-white/80">{question}</p>
        </div>

        {/* Option rows */}
        <div className="flex flex-col">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => handleOptionClick(option)}
              className="w-full flex items-center gap-3 px-5 py-3 border-t border-white/[0.06] text-sm text-white/75 hover:bg-white/[0.04] hover:text-white/80 transition-colors text-left"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white/15 flex-shrink-0" />
              {option}
            </button>
          ))}
        </div>

        {/* Other input */}
        <div className="border-t border-white/[0.06] flex items-center">
          <input
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleOtherSubmit()}
            placeholder="If something else, type here..."
            className="flex-1 bg-transparent px-5 py-3 text-sm text-white/75 placeholder:text-white/20 outline-none"
          />
          {otherText.trim() && (
            <button
              onClick={handleOtherSubmit}
              className="px-4 py-3 text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
