"use client"

import { ArrowRight, ChevronDown } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CreationHands } from "../CreationHands"

/* ── Terminal animation lines ──────────────────────────────────── */
const TERMINAL_LINES = [
  { text: "> Describe your app...", color: "text-white/70", dot: null, delay: 0 },
  { text: "Orchestrator analyzing...", color: "text-white/50", dot: "bg-gold-500", delay: 1.2 },
  { text: "Frontend Agent  \u25B8 generating React components", color: "text-white/60", dot: "bg-emerald-400", delay: 2.4 },
  { text: "Backend Agent   \u25B8 generating Express API", color: "text-white/60", dot: "bg-blue-400", delay: 3.6 },
  { text: "Review Agent    \u25B8 quality check: Grade A", color: "text-white/60", dot: "bg-gold-500", delay: 4.8 },
  { text: "\u2713 Production code ready", color: "text-gold-500", dot: null, delay: 6.0 },
] as const

export function HeroSplit() {
  const pathname = usePathname()
  const router = useRouter()

  function scrollToWorkflow() {
    const el = document.getElementById("workflow")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    } else if (pathname !== "/test-home") {
      router.push("/test-home#workflow")
    }
  }

  return (
    <section className="relative min-h-0 md:min-h-[85vh] overflow-hidden hero-section">
      {/* ASCII Art Background (desktop only, very subtle) */}
      <div className="absolute inset-0 z-0 hidden lg:block opacity-30">
        <CreationHands
          imageSrc="/creation-hands.jpg"
          cellSize={8}
          rotation={8}
          maxBrightness={0.76}
          className="w-full h-full"
        />
      </div>

      {/* Mobile ambient glow */}
      <div className="absolute inset-0 z-[1] lg:hidden pointer-events-none overflow-hidden">
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

      {/* Dark vignette for readability */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none hidden lg:block"
        style={{
          background: "radial-gradient(ellipse 70% 80% at 30% 50%, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 50%, transparent 80%)",
        }}
      />

      {/* Content: 60/40 split */}
      <div className="relative z-[2] mx-auto max-w-6xl px-4 md:px-8 pt-20 pb-12 md:pt-28 md:pb-16">
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-16 items-center">

          {/* Left side (60%) — Headline + CTA */}
          <div className="text-center lg:text-left">
            <h1
              className="leading-[0.88] tracking-[-0.05em] mb-5 animate-fade-slide-up"
              style={{ animationDuration: "0.3s" }}
            >
              <span className="block text-[clamp(2rem,5.5vw,5.5rem)] font-black text-white">
                AI ENGINEERING
              </span>
              <span className="block text-[clamp(2rem,5.5vw,5.5rem)] font-black text-gold-500 text-glow-gold">
                TEAM.
              </span>
            </h1>

            <p
              className="text-[clamp(0.9rem,1.5vw,1.15rem)] text-white/60 mb-8 max-w-lg leading-relaxed mx-auto lg:mx-0 animate-fade-slide-up"
              style={{ animationDuration: "0.3s", animationDelay: "0.08s", animationFillMode: "both" }}
            >
              AI agents that plan, code, test, and review your full-stack
              applications — in parallel.
            </p>

            <div
              className="flex flex-wrap gap-3 justify-center lg:justify-start animate-fade-slide-up"
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

          {/* Right side (40%) — Terminal Animation */}
          <div
            className="animate-fade-slide-up"
            style={{ animationDuration: "0.3s", animationDelay: "0.2s", animationFillMode: "both" }}
          >
            <div className="relative rounded-xl border border-white/[0.08] bg-[#0a0a0a] shadow-elevation-2 overflow-hidden">
              {/* Terminal header bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                <span className="text-[10px] font-mono text-white/30 ml-2">co-lab terminal</span>
              </div>

              {/* Terminal body */}
              <div className="p-4 md:p-5 font-mono text-[12px] md:text-[13px] space-y-2.5 min-h-[220px]">
                {TERMINAL_LINES.map((line, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 terminal-hero-line"
                    style={{
                      opacity: 0,
                      animation: `terminalLineIn 0.4s ease-out forwards`,
                      animationDelay: `${line.delay}s`,
                    }}
                  >
                    {line.dot && (
                      <span
                        className={`w-2 h-2 rounded-full ${line.dot} shrink-0`}
                        style={{
                          animation: i === 1 ? "terminalDotPulse 1.5s ease-in-out infinite" : undefined,
                        }}
                      />
                    )}
                    {!line.dot && <span className="w-2 shrink-0" />}
                    <span className={line.color}>
                      {i === 0 ? (
                        <span className="terminal-typing">{line.text}</span>
                      ) : i === TERMINAL_LINES.length - 1 ? (
                        <span className="font-semibold" style={{ textShadow: "0 0 12px rgba(230,179,62,0.4)" }}>
                          {line.text}
                        </span>
                      ) : (
                        line.text
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 z-[1] pointer-events-none bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
