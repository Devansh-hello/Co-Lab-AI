"use client"

import { useRef } from "react"
import { GitMerge, Brain, ShieldCheck, Users, Globe, Zap, FlaskConical, RotateCcw } from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

const features = [
  {
    icon: GitMerge,
    title: "Parallel Code Generation",
    description: "Frontend and Backend agents run simultaneously, sharing an API contract for compatible endpoints and response shapes.",
    iconColor: "var(--color-gold-500)",
  },
  {
    icon: Brain,
    title: "API Contract Specification",
    description: "The Orchestrator writes a formal contract before any code is generated. Both agents implement the same spec.",
    iconColor: "var(--color-gold-500)",
  },
  {
    icon: ShieldCheck,
    title: "Quality Grading (A-F)",
    description: "Every generation is scored across 5 dimensions: completeness, security, compatibility, code quality, and test coverage.",
    iconColor: "var(--color-gold-500)",
  },
  {
    icon: FlaskConical,
    title: "Independent Test Generation",
    description: "The Test Agent generates tests against the specification, not the code. Tests check what SHOULD work, not what DOES.",
    iconColor: "var(--color-gold-500)",
  },
  {
    icon: RotateCcw,
    title: "Feedback Loop",
    description: "When quality is low, the system identifies specific issues, classifies which agent should fix them, and runs targeted repairs.",
    iconColor: "var(--color-gold-500)",
  },
  {
    icon: Users,
    title: "Human-in-the-Loop",
    description: "You review the plan before code is generated. Two confirmation gates prevent wasted computation.",
    iconColor: "var(--color-gold-500)",
  },
  {
    icon: Globe,
    title: "Multi-Provider Routing",
    description: "Mix and match: GPT for frontend, Claude for backend, Gemini for review. Each agent can use a different model.",
    iconColor: "var(--color-gold-500)",
  },
  {
    icon: Zap,
    title: "In-Browser Execution",
    description: "Preview generated apps live via WebContainer — no setup, no install, no leaving the browser.",
    iconColor: "var(--color-gold-500)",
  },
]

export function FeaturesSection() {
  const gridRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const cards = gridRef.current!.querySelectorAll(".feature-card")
    gsap.set(cards, { opacity: 0, y: 10 })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            gsap.to(cards, {
              opacity: 1, y: 0,
              duration: 0.25, stagger: 0.04, ease: "power2.out",
            })
            observer.disconnect()
          }
        })
      },
      { threshold: 0.05 }
    )
    observer.observe(gridRef.current!)
    return () => observer.disconnect()
  }, { scope: gridRef })

  return (
    <section id="features" className="relative py-16 md:py-24 px-4 md:px-8">
      {/* Centered gold atmosphere behind cards */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[700px] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(212,175,55,0.05) 0%, rgba(212,175,55,0.02) 40%, transparent 65%)" }} />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-10 md:mb-14">
          <p className="text-[11px] font-mono text-gold-500/60 mb-3 tracking-[0.15em] uppercase font-bold">
            Research-Driven Features
          </p>
          <h2 className="text-[clamp(1.4rem,3vw,2.2rem)] font-black text-white tracking-[-0.03em] leading-[1.05] mb-3">
            Built on 19 papers from{" "}
            <span className="text-white/45">ICLR, NeurIPS, ACL & more</span>
          </h2>
          <p className="text-[14px] text-white/55 max-w-xl leading-relaxed">
            Every architectural decision has a citation. A system designed using peer-reviewed advances in multi-agent AI research.
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={i}
                className="feature-card group relative rounded-xl glass-shine border border-white/[0.07] hover:border-gold-500/25 hover:shadow-elevation-2 transition-[border-color,box-shadow] duration-200 overflow-hidden p-3.5 sm:p-5 md:p-6"
                style={{ opacity: 0 }}
              >
                <div className="relative z-10">
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4"
                    style={{ backgroundColor: feature.iconColor + "12", border: `1px solid ${feature.iconColor}20` }}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: feature.iconColor }} />
                  </div>
                  <h3 className="font-bold text-white tracking-[-0.02em] mb-1.5 sm:mb-2 text-[13px] sm:text-[15px]">
                    {feature.title}
                  </h3>
                  <p className="text-white/55 leading-relaxed text-[12px] sm:text-[13px]">
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
