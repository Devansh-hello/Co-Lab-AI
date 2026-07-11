"use client"

import { useRef } from "react"
import { GitMerge, Brain, Zap, ShieldCheck, FlaskConical, RotateCcw, Users, Globe } from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

interface Feature {
  icon: typeof GitMerge
  title: string
  description: string
}

interface FeatureGroup {
  name: string
  description: string
  features: Feature[]
}

const GROUPS: FeatureGroup[] = [
  {
    name: "Generation",
    description: "From prompt to production code",
    features: [
      {
        icon: GitMerge,
        title: "Parallel Code Generation",
        description: "Frontend and Backend agents run simultaneously, sharing an API contract for compatible endpoints.",
      },
      {
        icon: Brain,
        title: "API Contract Specification",
        description: "The Orchestrator writes a formal contract before any code is generated. Both agents implement the same spec.",
      },
      {
        icon: Zap,
        title: "In-Browser Execution",
        description: "Preview generated apps live via WebContainer — no setup, no install, no leaving the browser.",
      },
    ],
  },
  {
    name: "Quality",
    description: "Every line graded and tested",
    features: [
      {
        icon: ShieldCheck,
        title: "Quality Grading (A\u2013F)",
        description: "Every generation is scored across 5 dimensions: completeness, security, compatibility, code quality, and test coverage.",
      },
      {
        icon: FlaskConical,
        title: "Independent Test Generation",
        description: "The Test Agent generates tests against the specification, not the code. Tests check what SHOULD work, not what DOES.",
      },
      {
        icon: RotateCcw,
        title: "Feedback Loop",
        description: "When quality is low, the system identifies specific issues, classifies which agent should fix them, and runs targeted repairs.",
      },
    ],
  },
  {
    name: "Intelligence",
    description: "Human oversight, multi-model power",
    features: [
      {
        icon: Users,
        title: "Human-in-the-Loop",
        description: "You review the plan before code is generated. Two confirmation gates prevent wasted computation.",
      },
      {
        icon: Globe,
        title: "Multi-Provider Routing",
        description: "Mix and match: GPT for frontend, Claude for backend, Gemini for review. Each agent can use a different model.",
      },
    ],
  },
]

export function FeaturesGrouped() {
  const gridRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!gridRef.current) return
    const cards = gridRef.current.querySelectorAll(".fg-card")
    gsap.set(cards, { opacity: 0, y: 10 })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(cards, {
              opacity: 1,
              y: 0,
              duration: 0.25,
              stagger: 0.04,
              ease: "power2.out",
            })
            observer.disconnect()
          }
        })
      },
      { threshold: 0.05 }
    )
    observer.observe(gridRef.current)
    return () => observer.disconnect()
  }, { scope: gridRef })

  return (
    <section id="features" className="relative py-16 md:py-24 px-4 md:px-8 overflow-hidden">
      {/* Gold radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[700px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(230,179,62,0.05) 0%, rgba(230,179,62,0.02) 40%, transparent 65%)" }}
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Section header */}
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

        {/* 3-column grouped grid */}
        <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {GROUPS.map((group) => (
            <div key={group.name}>
              {/* Column header */}
              <div className="mb-4 pb-3 border-b border-white/[0.06]">
                <h3 className="text-[13px] font-mono text-gold-500 uppercase tracking-wider font-bold mb-1">
                  {group.name}
                </h3>
                <p className="text-[12px] text-white/40">
                  {group.description}
                </p>
              </div>

              {/* Feature cards stacked */}
              <div className="space-y-3">
                {group.features.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div
                      key={feature.title}
                      className="fg-card group relative rounded-xl glass-shine border border-white/[0.07] hover:border-gold-500/25 hover:shadow-elevation-2 transition-[border-color,box-shadow] duration-200 overflow-hidden p-4 md:p-5"
                      style={{ opacity: 0 }}
                    >
                      <div className="relative z-10">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                          style={{ backgroundColor: "rgba(230,179,62,0.07)", border: "1px solid rgba(230,179,62,0.13)" }}
                        >
                          <Icon className="w-4 h-4 text-gold-500" />
                        </div>
                        <h4 className="font-bold text-white tracking-[-0.02em] mb-1.5 text-[13px] sm:text-[14px]">
                          {feature.title}
                        </h4>
                        <p className="text-white/55 leading-relaxed text-[12px] sm:text-[13px]">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
