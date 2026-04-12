"use client"

import { ArrowRight, ChevronDown } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CreationHands } from "./CreationHands"

export function HeroSection() {
  const pathname = usePathname()
  const router = useRouter()

  function scrollToWorkflow() {
    const el = document.getElementById("workflow")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    } else if (pathname !== "/") {
      router.push("/#workflow")
    }
  }

  return (
    <section className="relative h-auto pt-16 pb-10 md:h-[80vh] md:py-0 min-h-0 md:min-h-[420px] overflow-hidden">

      {/* ASCII Art (hidden on mobile) */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <CreationHands
          imageSrc="/creation-hands.jpg"
          cellSize={8}
          rotation={8}
          maxBrightness={0.76}
          className="w-full h-full"
        />
      </div>

      {/* Mobile ambient glow */}
      <div className="absolute inset-0 z-[1] md:hidden pointer-events-none overflow-hidden">
        <div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            top: "5%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "radial-gradient(circle, rgba(230,179,62,0.12) 0%, rgba(230,179,62,0.05) 45%, transparent 70%)",
          }}
        />
      </div>

      {/* Dark eclipse behind text (desktop only) */}
      <div className="absolute inset-0 z-[1] pointer-events-none hidden md:flex items-center justify-center">
        <div
          className="w-[700px] h-[500px] md:w-[900px] md:h-[600px]"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0.2) 60%, transparent 80%)",
          }}
        />
      </div>

      {/* Content — CSS-only reveals, 300ms max */}
      <div className="relative z-[2] h-full flex flex-col items-center justify-center text-center px-4">

        <h1 className="relative font-display leading-[0.88] tracking-[-0.05em] mb-4 animate-fade-slide-up" style={{ animationDuration: "0.3s" }}>
          <span className="block text-[clamp(2rem,5.5vw,5.5rem)] font-extrabold text-white">
            AI ENGINEERING
          </span>
          <span
            className="block text-[clamp(2rem,5.5vw,5.5rem)] font-extrabold text-gold-500 text-glow-gold"
          >
            TEAM.
          </span>
        </h1>

        <p
          className="text-[clamp(0.9rem,1.5vw,1.15rem)] text-white/60 mb-8 max-w-lg leading-relaxed animate-fade-slide-up"
          style={{ animationDuration: "0.3s", animationDelay: "0.08s", animationFillMode: "both" }}
        >
          AI agents that plan, code, test, and review your full-stack
          applications — in parallel.
        </p>

        <div
          className="flex flex-wrap gap-3 justify-center animate-fade-slide-up"
          style={{ animationDuration: "0.3s", animationDelay: "0.14s", animationFillMode: "both" }}
        >
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 h-11 px-7 rounded-lg bg-gold-500/20 hover:bg-gold-500/35 border border-gold-500/40 hover:border-gold-500/70 text-gold-500 font-bold text-[14px] backdrop-blur-md transition-[background,border-color] duration-150"
          >
            Start Building
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
          </Link>
          <button
            onClick={scrollToWorkflow}
            className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-lg border border-white/[0.12] text-white/60 hover:text-white hover:border-white/30 bg-white/[0.04] hover:bg-white/[0.1] backdrop-blur-md font-semibold text-[14px] transition-[color,border-color,background] duration-150 cursor-pointer"
          >
            See How It Works
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

      </div>

    </section>
  )
}
