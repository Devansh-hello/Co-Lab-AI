"use client"

import { Button } from "./ui/button"
import { ArrowRight } from "lucide-react"
import { TypewriterText } from "./typewriter-text"
import { TerminalWindow } from "./TerminalWindow"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"

const phrases = [
  "Plans Your Architecture",
  "Generates Code in Parallel",
  "Reviews & Self-Corrects",
  "Delivers via IDE",
]

// Each line: text, optional agent label, status chip, delay ms before it appears
type LineStatus = "ok" | "running" | "done" | "wait" | "none"
interface TLine {
  agent?: string
  agentColor?: string
  text: string
  status: LineStatus
  delay: number
  isCommand?: boolean
  isSuccess?: boolean
  isBlank?: boolean
}

const lines: TLine[] = [
  { text: "$ colab-minds build \"e-commerce store with admin dashboard\"", status: "none", delay: 300, isCommand: true },
  { text: "  Initializing Co-Lab Minds v1.0.0...", status: "none", delay: 650 },
  { text: "", status: "none", delay: 750, isBlank: true },
  { agent: "COORDINATOR", agentColor: "text-primary",    text: "Analyzing prompt & selecting tech stack",   status: "ok",      delay: 950  },
  { agent: "COORDINATOR", agentColor: "text-primary",    text: "Stack: React + Node.js + PostgreSQL",       status: "ok",      delay: 1200 },
  { agent: "COORDINATOR", agentColor: "text-primary",    text: "Spawning specialized agents...",            status: "ok",      delay: 1450 },
  { text: "", status: "none", delay: 1550, isBlank: true },
  { agent: "FRONTEND",    agentColor: "text-blue-400",   text: "Generating UI components",                  status: "running", delay: 1750 },
  { agent: "BACKEND",     agentColor: "text-emerald-400",text: "Generating API routes",                     status: "running", delay: 1900 },
  { text: "", status: "none", delay: 2000, isBlank: true },
  { agent: "FRONTEND",    agentColor: "text-blue-400",   text: "src/components/App.tsx",                    status: "done",    delay: 2350 },
  { agent: "FRONTEND",    agentColor: "text-blue-400",   text: "src/components/Dashboard.tsx",              status: "done",    delay: 2600 },
  { agent: "BACKEND",     agentColor: "text-emerald-400",text: "src/routes/products.js",                    status: "done",    delay: 2800 },
  { agent: "BACKEND",     agentColor: "text-emerald-400",text: "src/routes/auth.js",                        status: "done",    delay: 3000 },
  { text: "", status: "none", delay: 3100, isBlank: true },
  { agent: "REVIEW",      agentColor: "text-purple-400", text: "Cross-checking API consistency",            status: "ok",      delay: 3300 },
  { agent: "REVIEW",      agentColor: "text-purple-400", text: "docs/README.md",                            status: "done",    delay: 3550 },
  { text: "", status: "none", delay: 3650, isBlank: true },
  { text: "  ✓ Build complete — 8 files generated in 4.2s", status: "none", delay: 3850, isSuccess: true },
]

const statusChip: Record<LineStatus, { label: string; cls: string }> = {
  ok:      { label: "[ok]",        cls: "text-emerald-400/80" },
  running: { label: "[running...]", cls: "text-yellow-400/90 animate-pulse" },
  done:    { label: "[done ✓]",   cls: "text-primary/90" },
  wait:    { label: "[wait]",      cls: "text-white/20" },
  none:    { label: "",            cls: "" },
}

export function HeroSection() {
  const [phraseIdx, setPhraseIdx] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setPhraseIdx((i) => (i + 1) % phrases.length), 3500)
    return () => clearTimeout(t)
  }, [phraseIdx])

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto text-center">

        {/* CLI-style badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-primary/25 bg-primary/5 text-primary text-xs font-mono mb-8"
          style={{ animation: "fade-slide-up 0.5s 0s ease both" }}
        >
          <span className="text-primary/50">$</span>
          colab-minds
          <span className="text-muted-foreground/40 mx-1">--version</span>
          <span className="text-primary/70">1.0.0</span>
        </div>

        {/* Headline */}
        <h1
          className="text-5xl md:text-7xl font-bold text-foreground mb-5 leading-tight"
          style={{ animation: "fade-slide-up 0.6s 0.1s ease both" }}
        >
          Your Complete AI<br />
          <span className="text-primary">Engineering Team</span>
        </h1>

        {/* Cycling typewriter */}
        <div
          className="text-xl md:text-2xl font-medium text-muted-foreground mb-6 h-10 flex items-center justify-center gap-2"
          style={{ animation: "fade-slide-up 0.6s 0.2s ease both" }}
        >
          <span className="font-mono text-primary/40 text-lg select-none">&gt;</span>
          <TypewriterText
            key={phraseIdx}
            text={phrases[phraseIdx]}
            speed={55}
            delay={0}
            className="text-primary font-semibold"
            showCursor={true}
            repeat={false}
          />
        </div>

        {/* Description */}
        <p
          className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto"
          style={{ animation: "fade-slide-up 0.6s 0.3s ease both" }}
        >
          Type a natural language prompt — Co-Lab Minds deploys a distributed team of specialized AI agents that
          plan, build in parallel, review, and ship production-ready full-stack applications.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          style={{ animation: "fade-slide-up 0.6s 0.4s ease both" }}
        >
          <Button size="lg" className="group shine-effect shine-gold shadow-gold-glow font-mono" asChild>
            <Link to="/projects">
              <span className="text-primary-foreground/60 mr-1">$</span>
              colab-minds build
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="font-mono">
            --help
          </Button>
        </div>

        {/* Terminal Window */}
        <div
          className="max-w-3xl mx-auto text-left"
          style={{ animation: "fade-slide-up 0.7s 0.5s ease both" }}
        >
          <TerminalWindow title="colab-minds — agent pipeline">
            {lines.map((line, i) => {
              if (line.isBlank) {
                return (
                  <div
                    key={i}
                    className="h-3"
                    style={{ animation: `terminal-line-in 0.2s ${line.delay}ms ease both`, opacity: 0 }}
                  />
                )
              }

              const chip = statusChip[line.status]

              if (line.isCommand) {
                return (
                  <div
                    key={i}
                    className="text-white/90 mb-1"
                    style={{ animation: `terminal-line-in 0.3s ${line.delay}ms ease both`, opacity: 0 }}
                  >
                    <span className="text-primary">{line.text.split(" ")[0]}</span>
                    <span className="text-white/70"> {line.text.split(" ").slice(1).join(" ")}</span>
                  </div>
                )
              }

              if (line.isSuccess) {
                return (
                  <div
                    key={i}
                    className="text-primary font-semibold flex items-center gap-2"
                    style={{ animation: `terminal-line-in 0.3s ${line.delay}ms ease both`, opacity: 0 }}
                  >
                    {line.text}
                    {/* blinking cursor after last line */}
                    <span className="inline-block w-[9px] h-[14px] bg-primary ml-0.5 animate-blink-cursor" />
                  </div>
                )
              }

              if (line.agent) {
                return (
                  <div
                    key={i}
                    className="flex items-center gap-0"
                    style={{ animation: `terminal-line-in 0.25s ${line.delay}ms ease both`, opacity: 0 }}
                  >
                    <span className={`w-24 flex-shrink-0 text-[11px] font-bold tracking-wider ${line.agentColor}`}>
                      {line.agent}
                    </span>
                    <span className="text-white/55 flex-1 text-[13px]">{line.text}</span>
                    {chip.label && (
                      <span className={`text-[11px] ml-3 flex-shrink-0 ${chip.cls}`}>{chip.label}</span>
                    )}
                  </div>
                )
              }

              return (
                <div
                  key={i}
                  className="text-white/40 text-[12px]"
                  style={{ animation: `terminal-line-in 0.25s ${line.delay}ms ease both`, opacity: 0 }}
                >
                  {line.text}
                </div>
              )
            })}
          </TerminalWindow>
        </div>
      </div>
    </section>
  )
}
