"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"

/**
 * Full-screen loading screen with animated logomark.
 */
export default function MainLoadingScreen({ label = "Initializing" }: { label?: string }) {
  const textRef = useRef<HTMLSpanElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Glitch text effect
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
        if (original[i] === " ") display += " "
        else if (i < settled) display += original[i]
        else display += chars[Math.floor(Math.random() * chars.length)]
      }
      textRef.current.textContent = display

      if (settled >= original.length) {
        textRef.current.textContent = original
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [label])

  // GSAP logomark animation
  useEffect(() => {
    if (!svgRef.current) return
    const paths = svgRef.current.querySelectorAll("path")

    // Animate paths drawing in
    paths.forEach((path, i) => {
      const len = path.getTotalLength?.() || 100
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 0.8,
        delay: i * 0.15,
        ease: "power2.out",
      })
    })

    // Continuous pulse
    gsap.to(svgRef.current, {
      opacity: 0.5,
      scale: 0.95,
      duration: 1.2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: 1,
    })

    return () => { gsap.killTweensOf(svgRef.current); gsap.killTweensOf(paths) }
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-6">
        <svg ref={svgRef} width="48" height="48" viewBox="0 0 32 32" fill="none">
          <path d="M8 6L2 16L8 26" stroke="#E6B33E" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
          <path d="M18 6L12 16L18 26" stroke="#E6B33E" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" opacity="0.45" />
          <path d="M22 6L30 26" stroke="#E6B33E" strokeWidth="2.5" strokeLinecap="square" />
        </svg>

        <span
          ref={textRef}
          className="text-[11px] font-mono font-bold tracking-[0.25em] text-white/30"
        >
          {label.toUpperCase()}
        </span>
      </div>
    </div>
  )
}
