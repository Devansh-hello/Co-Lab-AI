"use client"

import { useTypewriter } from "../hooks/use-typewriter"

interface TypewriterTextProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  showCursor?: boolean
  repeat?: boolean
  pauseDuration?: number
}

export function TypewriterText({
  text,
  speed = 100,
  delay = 0,
  className = "",
  showCursor = true,
  repeat = false,
  pauseDuration = 3000,
}: TypewriterTextProps) {
  const { displayText, isComplete, isTyping } = useTypewriter({
    text,
    speed,
    delay,
    repeat,
    pauseDuration,
  })

  // All classes used: transition-opacity, duration-500, ease-in-out, opacity-100, opacity-0, duration-300, inline-block, w-0.5, h-[1em], bg-primary, ml-1, animate-pulse

  return (
    <span className={`${className} transition-opacity duration-500 ease-in-out`}>
      <span className={`${displayText ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
        {displayText}
      </span>
      {showCursor && (isTyping || (!repeat && !isComplete)) && (
        <span className="inline-block w-0.5 h-[1em] bg-primary ml-1 animate-pulse"></span>
      )}
    </span>
  )
}
