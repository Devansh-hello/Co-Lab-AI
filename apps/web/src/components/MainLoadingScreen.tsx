"use client"

import { useRef, useEffect } from "react"
import { LumaSpin } from "./ui/luma-spin"

/**
 * Full-screen loading screen with LumaSpin animation and glitch text.
 * Used for app init, protected route verification, and chat loading.
 */
export default function MainLoadingScreen({ label = "Initializing" }: { label?: string }) {
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&"
    const original = label.toUpperCase()
    let frame = 0
    let settled = 0

    const interval = setInterval(() => {
      if (!textRef.current) return
      frame++

      if (frame % 3 === 0 && settled < original.length) settled++

      let display = ""
      for (let i = 0; i < original.length; i++) {
        if (original[i] === " ") {
          display += " "
        } else if (i < settled) {
          display += original[i]
        } else {
          display += chars[Math.floor(Math.random() * chars.length)]
        }
      }
      textRef.current.textContent = display

      if (settled >= original.length) {
        textRef.current.textContent = original
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [label])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-8">
        <LumaSpin />

        <span
          ref={textRef}
          className="text-[11px] font-mono font-bold tracking-[0.25em] text-gray-400"
        >
          {label.toUpperCase()}
        </span>
      </div>
    </div>
  )
}
