"use client"

import type React from "react"
import { useState } from "react"
import { Send, Loader2 } from "lucide-react"

interface MessageBoxProps {
  onSendMessage: (message: string) => void
  isGenerating: boolean
  currentStatus: string
}

export const MessageBox: React.FC<MessageBoxProps> = ({ onSendMessage, isGenerating, currentStatus }) => {
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isGenerating) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }

  return (
    <div className="w-full max-w-4xl items-center justify-center">
      {isGenerating && (
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D9C4B0]/80 backdrop-blur-sm border border-[#CFAB8D]/50 rounded-lg shadow-sm">
            <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
            <span className="text-sm text-amber-800 font-medium">{currentStatus}</span>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isGenerating ? "AI is working..." : "Describe your project idea..."}
            disabled={isGenerating}
            className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-[#CFAB8D]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CFAB8D] focus:border-transparent disabled:bg-[#D9C4B0]/20 disabled:cursor-not-allowed transition-all duration-200 shadow-sm font-medium text-gray-800 placeholder-gray-500"
          />
        </div>
        <button
          type="submit"
          disabled={isGenerating || !message.trim()}
          className="px-6 py-3 bg-[#CFAB8D] hover:bg-[#C19B7A] text-amber-900 rounded-lg disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-sm font-medium flex items-center gap-2 backdrop-blur-sm"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  )
}
