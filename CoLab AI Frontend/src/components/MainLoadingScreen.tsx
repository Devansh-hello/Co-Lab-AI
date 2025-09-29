"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Loader2, Sparkles } from "lucide-react"

const MainLoadingScreen: React.FC<{ isExiting?: boolean }> = ({ isExiting = false }) => {
  const [loadingText, setLoadingText] = useState("Initializing")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Animated loading text
    const textStates = [
      "Initializing",
      "Initializing.",
      "Initializing..",
      "Initializing...",
      "Loading your session",
      "Loading your session.",
      "Loading your session..",
      "Loading your session...",
      "Almost ready",
      "Almost ready.",
      "Almost ready..",
      "Almost ready...",
    ]

    let textIndex = 0
    const textInterval = setInterval(() => {
      setLoadingText(textStates[textIndex % textStates.length])
      textIndex++
    }, 200)

    // Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev
        return prev + Math.random() * 15
      })
    }, 100)

    return () => {
      clearInterval(textInterval)
      clearInterval(progressInterval)
    }
  }, [])

  // Complete progress when exiting
  useEffect(() => {
    if (isExiting) {
      setProgress(100)
      setLoadingText("Ready!")
    }
  }, [isExiting])

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-[#ECEEDF] via-[#E8EAD8] to-[#D9C4B0]">
      <div className="relative">
        <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl p-12 shadow-2xl">
          <div className="text-center space-y-6">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-[#8B7355] animate-spin mx-auto" />
              <Sparkles className="h-6 w-6 text-[#CFAB8D] absolute -top-1 -right-1 animate-pulse" />
            </div>

            <div className="space-y-4">
              <p className="text-2xl font-semibold text-[#5D4E37] font-mono">{loadingText}</p>

              <div className="w-64 mx-auto">
                <div className="flex justify-between text-sm text-[#8B7355] mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-[#D9C4B0]/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#CFAB8D] to-[#8B7355] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#CFAB8D]/10 to-[#8B7355]/10 animate-pulse -z-10" />
      </div>
    </div>
  )
}

export default MainLoadingScreen
