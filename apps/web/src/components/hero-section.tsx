"use client"

import { useRef, useEffect } from "react"
import { animate } from "animejs"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { CreationHands } from "./CreationHands"

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!heroRef.current) return

    const line1 = heroRef.current.querySelector(".title-line-1")
    const line2 = heroRef.current.querySelector(".title-line-2")
    const sub = heroRef.current.querySelector(".hero-sub")
    const cta = heroRef.current.querySelector(".hero-cta")

    if (line1) {
      animate(line1, { opacity: [0, 1], duration: 2000, delay: 600, ease: "inOutSine" })
    }
    if (line2) {
      animate(line2, { opacity: [0, 1], duration: 2000, delay: 1000, ease: "inOutSine" })
    }
    if (sub) {
      animate(sub, { opacity: [0, 1], duration: 1500, delay: 1800, ease: "inOutSine" })
    }
    if (cta) {
      animate(cta, { opacity: [0, 1], translateY: [16, 0], duration: 800, delay: 2200, ease: "outExpo" })
    }
  }, [])

  return (
    <section ref={heroRef} className="relative h-auto pt-16 pb-10 md:h-[80vh] md:py-0 min-h-0 md:min-h-[420px] overflow-hidden">

      {/* ── ASCII Art (hidden on mobile — crops badly on narrow viewports) ── */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <CreationHands
          imageSrc="/creation-hands.jpg"
          color="#D4AF37"
          cellSize={6}
          parallaxMax={4}
          rotation={8}
          className="w-full h-full"
        />
      </div>

      {/* ── Mobile animated glow ── */}
      <div className="absolute inset-0 z-[1] md:hidden pointer-events-none overflow-hidden">
        <div
          className="absolute w-[350px] h-[350px] rounded-full blur-[90px] animate-pulse"
          style={{
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "radial-gradient(circle, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.10) 40%, transparent 70%)",
          }}
        />
        <div
          className="absolute w-[250px] h-[250px] rounded-full blur-[70px]"
          style={{
            top: "35%",
            left: "25%",
            transform: "translateX(-50%)",
            background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 65%)",
            animation: "pulse 3s ease-in-out infinite 1s",
          }}
        />
      </div>

      {/* ── Dark eclipse behind text (desktop only — no ASCII art on mobile) ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none hidden md:flex items-center justify-center">
        <div
          className="w-[700px] h-[500px] md:w-[900px] md:h-[600px]"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0.2) 60%, transparent 80%)",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-[2] h-full flex flex-col items-center justify-center text-center px-4">

        <h1 className="leading-[0.88] tracking-[-0.05em] mb-3">
          <span className="title-line-1 block text-[clamp(2rem,5.5vw,5.5rem)] font-black text-white" style={{ opacity: 0 }}>
            AI ENGINEERING
          </span>
          <span
            className="title-line-2 block text-[clamp(2rem,5.5vw,5.5rem)] font-black text-[#D4AF37]"
            style={{ opacity: 0, textShadow: "0 0 40px rgba(212,175,55,0.3), 0 0 80px rgba(212,175,55,0.1)" }}
          >
            TEAM.
          </span>
        </h1>

        <p className="hero-sub text-[clamp(0.95rem,1.6vw,1.2rem)] font-light italic text-white/55 mb-8" style={{ opacity: 0 }}>
          not a chatbot
        </p>

        <div className="hero-cta flex flex-wrap gap-3 justify-center" style={{ opacity: 0 }}>
          <Link
            to="/projects"
            className="group inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 hover:border-[#D4AF37]/60 text-[#D4AF37] font-bold text-[13px] backdrop-blur-md transition-all"
          >
            Start Building
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg border border-white/[0.12] text-white/60 hover:text-white hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md font-semibold text-[13px] transition-all"
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* ── Bottom fade ── */}
      <div className="absolute bottom-0 left-0 right-0 h-24 z-[1] pointer-events-none bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
