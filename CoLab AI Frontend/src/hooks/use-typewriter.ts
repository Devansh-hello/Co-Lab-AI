"use client"

import { useState, useEffect } from "react"

interface UseTypewriterOptions {
  text: string
  speed?: number
  delay?: number
  pauseDuration?: number
  repeat?: boolean
}

export function useTypewriter({
  text,
  speed = 100,
  delay = 0,
  pauseDuration = 3000,
  repeat = false,
}: UseTypewriterOptions) {
  const [displayText, setDisplayText] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const startCycle = () => {
      let currentIndex = 0
      setIsComplete(false)
      setIsTyping(true)
      setDisplayText("")

      const typeNextCharacter = () => {
        if (currentIndex < text.length) {
          setDisplayText(text.slice(0, currentIndex + 1))
          currentIndex++
          timeoutId = setTimeout(typeNextCharacter, speed)
        } else {
          setIsComplete(true)
          setIsTyping(false)

          if (repeat) {
            timeoutId = setTimeout(() => {
              startCycle()
            }, pauseDuration)
          }
        }
      }

      typeNextCharacter()
    }

    timeoutId = setTimeout(startCycle, delay)

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [text, speed, delay, pauseDuration, repeat])

  return { displayText, isComplete, isTyping }
}
