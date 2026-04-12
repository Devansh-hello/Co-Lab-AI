"use client"

import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

const BLOBS = [
  // Hero area — center and edges
  { cx: "50%", cy: "18%", w: 650, h: 500, color: "rgba(230,179,62,0.16)", blur: 65 },
  { cx: "10%", cy: "12%", w: 450, h: 400, color: "rgba(240,202,79,0.10)", blur: 80 },
  { cx: "90%", cy: "14%", w: 450, h: 380, color: "rgba(191,149,48,0.10)", blur: 80 },
  // Hero bottom edge bleed
  { cx: "30%", cy: "30%", w: 500, h: 400, color: "rgba(230,179,62,0.12)", blur: 75 },
  { cx: "70%", cy: "28%", w: 480, h: 380, color: "rgba(245,210,90,0.09)", blur: 80 },
  // Mid page
  { cx: "15%", cy: "45%", w: 400, h: 450, color: "rgba(191,149,48,0.08)", blur: 85 },
  { cx: "80%", cy: "40%", w: 500, h: 380, color: "rgba(245,210,90,0.06)", blur: 95 },
  // Lower page
  { cx: "35%", cy: "70%", w: 450, h: 400, color: "rgba(230,179,62,0.07)", blur: 85 },
  { cx: "70%", cy: "75%", w: 400, h: 350, color: "rgba(240,202,79,0.06)", blur: 90 },
  { cx: "50%", cy: "90%", w: 500, h: 400, color: "rgba(191,149,48,0.08)", blur: 80 },
]

export function WavyGoldGlow() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (prefersReducedMotion || !containerRef.current) return

    const blobs = containerRef.current.querySelectorAll(".glow-blob")

    blobs.forEach((blob, i) => {
      const duration = 16 + i * 2.5
      const xRange = 60 + i * 15
      const yRange = 40 + i * 12

      gsap.to(blob, {
        x: `+=${xRange}`,
        y: `+=${yRange}`,
        scale: 1.05 + i * 0.02,
        duration,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      })

      gsap.to(blob, {
        rotation: 10 + i * 5,
        duration: duration * 1.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      })
    })
  }, { scope: containerRef })

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    >
      {BLOBS.map((blob, i) => (
        <div
          key={i}
          className="glow-blob absolute"
          style={{
            left: blob.cx,
            top: blob.cy,
            width: blob.w,
            height: blob.h,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(ellipse at center, ${blob.color} 0%, transparent 70%)`,
            filter: `blur(${blob.blur}px)`,
            willChange: "transform",
            borderRadius: i % 2 === 0 ? "40% 60% 55% 45% / 55% 45% 60% 40%" : "55% 45% 50% 50% / 45% 55% 45% 55%",
          }}
        />
      ))}
      {/* Grain overlay */}
      <div
        className="absolute inset-0 bg-grainy-heavy pointer-events-none"
        style={{ mixBlendMode: "overlay", opacity: 0.5 }}
      />
    </div>
  )
}
