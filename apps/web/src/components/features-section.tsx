"use client"

import { useRef, useEffect } from "react"
import { GitMerge, Brain, ShieldCheck, Users, Globe, Zap, FlaskConical, RotateCcw } from "lucide-react"
import { animate, stagger } from "animejs"

const features = [
  {
    icon: GitMerge,
    title: "Parallel Code Generation",
    description: "Frontend and Backend agents run simultaneously, sharing an API contract for compatible endpoints and response shapes.",
    iconColor: "#3b82f6",
  },
  {
    icon: Brain,
    title: "API Contract Specification",
    description: "The Orchestrator writes a formal contract before any code is generated. Both agents implement the same spec.",
    iconColor: "#D4AF37",
  },
  {
    icon: ShieldCheck,
    title: "Quality Grading (A-F)",
    description: "Every generation is scored across 5 dimensions: completeness, security, compatibility, code quality, and test coverage.",
    iconColor: "#10b981",
  },
  {
    icon: FlaskConical,
    title: "Independent Test Generation",
    description: "The Test Agent generates tests against the specification, not the code. Tests check what SHOULD work, not what DOES.",
    iconColor: "#f59e0b",
  },
  {
    icon: RotateCcw,
    title: "Feedback Loop",
    description: "When quality is low, the system identifies specific issues, classifies which agent should fix them, and runs targeted repairs.",
    iconColor: "#ef4444",
  },
  {
    icon: Users,
    title: "Human-in-the-Loop",
    description: "You review the plan before code is generated. Two confirmation gates prevent wasted computation.",
    iconColor: "#a855f7",
  },
  {
    icon: Globe,
    title: "Multi-Provider Routing",
    description: "Mix and match: GPT for frontend, Claude for backend, Gemini for review. Each agent can use a different model.",
    iconColor: "#06b6d4",
  },
  {
    icon: Zap,
    title: "In-Browser Execution",
    description: "Preview generated apps live via WebContainer — no setup, no install, no leaving the browser.",
    iconColor: "#f97316",
  },
]

export function FeaturesSection() {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!gridRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const cards = gridRef.current!.querySelectorAll(".feature-card")
            animate(cards, {
              opacity: [0, 1],
              translateY: [30, 0],
              scale: [0.97, 1],
              duration: 600,
              delay: stagger(70, { start: 100 }),
              ease: "outExpo",
            })
            observer.disconnect()
          }
        })
      },
      { threshold: 0.15 }
    )

    observer.observe(gridRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" className="py-12 md:py-18 px-4 md:px-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12 max-w-2xl">
          <p className="text-[11px] font-mono text-[#D4AF37]/60 mb-3 tracking-[0.15em] uppercase font-bold">
            Research-Driven Features
          </p>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-black text-white tracking-[-0.03em] leading-[1.05] mb-3">
            Built on 19 papers from
            <br />
            <span className="text-white/45">ICLR, NeurIPS, ACL & more</span>
          </h2>
          <p className="text-[14px] text-white/55 leading-relaxed font-medium">
            Every architectural decision has a citation. A system designed using the latest advances in multi-agent AI research.
          </p>
        </div>

        {/* Grid — 2 cols mobile, 4 cols desktop */}
        <div ref={gridRef} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={i}
                className="feature-card group relative rounded-2xl glass-shine hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-elevation-2 transition-all duration-300 overflow-hidden corner-accents p-3.5 sm:p-5 md:p-6"
                style={{ opacity: 0 }}
              >
                {/* Subtle hover glow */}
                <div
                  className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${feature.iconColor}12, transparent)` }}
                />

                <div className="relative z-10">
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: feature.iconColor + "12", border: `1px solid ${feature.iconColor}20` }}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: feature.iconColor }} />
                  </div>
                  <h3 className="font-bold text-white tracking-[-0.02em] mb-1.5 sm:mb-2 text-[13px] sm:text-[15px]">
                    {feature.title}
                  </h3>
                  <p className="text-white/55 leading-relaxed font-medium text-[11px] sm:text-[13px]">
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
