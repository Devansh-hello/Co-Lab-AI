"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "./ui/button"

interface UnderstandingCardProps {
  summary: string
  projectName: string
  hasQuestions: boolean
  onConfirm: () => void
  onReject: () => void
}

export function UnderstandingCard({ summary, hasQuestions, onConfirm, onReject }: UnderstandingCardProps) {
  const [responded, setResponded] = useState(false)

  function handleConfirm() {
    setResponded(true)
    onConfirm()
  }

  function handleReject() {
    setResponded(true)
    onReject()
  }

  if (responded) {
    return (
      <div className="flex items-center gap-2 text-white/30 text-sm animate-spring-in">
        <Check className="w-4 h-4 text-white/25" />
        <span>Project understood</span>
      </div>
    )
  }

  return (
    <div className="max-w-2xl animate-spring-in">
      {/* AI text — no bubble */}
      <p className="text-sm text-white/75 leading-relaxed mb-5">
        {summary}
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleConfirm}
          className="text-xs h-9 px-4 bg-[#D4AF37] hover:bg-[#E0C050] text-black border-0"
        >
          {hasQuestions ? "Yes, continue" : "Yes, build this"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReject}
          className="text-xs h-9 px-4 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
