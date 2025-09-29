"use client"

import type React from "react"
import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = "javascript", filename }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden my-3 shadow-lg border border-gray-700">
      {filename && (
        <div className="bg-[#CFAB8D]/10 backdrop-blur-sm px-4 py-2 text-sm text-gray-300 border-b border-gray-700 flex justify-between items-center">
          <span className="font-mono font-medium">{filename}</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{language}</span>
        </div>
      )}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 px-3 py-1.5 text-xs bg-[#CFAB8D]/20 hover:bg-[#CFAB8D]/30 text-white rounded-md transition-all duration-200 backdrop-blur-sm border border-gray-600 flex items-center gap-1.5 font-medium"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
        <pre className="p-4 text-sm text-green-400 overflow-x-auto leading-relaxed">
          <code className="font-mono">{code}</code>
        </pre>
      </div>
    </div>
  )
}
