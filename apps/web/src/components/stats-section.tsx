"use client"

import { useRef, useEffect } from "react"
import { animate, stagger } from "animejs"

const stats = [
  { value: 6,  suffix: "",  label: "Specialized Agents",  detail: "Plan, Build, Review, Test, Grade, Fix" },
  { value: 19, suffix: "",  label: "Research Papers",      detail: "From ICLR, NeurIPS, ACL, EMNLP, FSE" },
  { value: 76, suffix: "%", label: "Token Reduction",      detail: "On test agent via smart compression" },
  { value: 5,  suffix: "",  label: "Quality Dimensions",   detail: "Completeness, Security, Compatibility..." },
]

const providers = ["OpenAI", "Anthropic", "Google", "OpenRouter", "GLM"]

function AnimatedStat({ value, suffix, label, detail, index }: {
  value: number; suffix: string; label: string; detail: string; index: number
}) {
  const numRef = useRef<HTMLSpanElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!numRef.current || !cardRef.current) return

    // Card entrance
    animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 600,
      delay: 200 + index * 120,
      ease: "outExpo",
    })

    // Counter
    const obj = { v: 0 }
    animate(obj, {
      v: value,
      duration: 1800,
      delay: 500 + index * 120,
      ease: "outExpo",
      onUpdate: () => {
        if (numRef.current) numRef.current.textContent = Math.round(obj.v).toString()
      },
    })
  }, [value, index])

  return (
    <div ref={cardRef} className="text-center group" style={{ opacity: 0 }}>
      <div className="text-[clamp(2.5rem,5vw,4rem)] font-black text-white/90 tracking-tighter tabular-nums leading-none mb-2">
        <span ref={numRef}>0</span>
        <span className="text-[#D4AF37]">{suffix}</span>
      </div>
      <div className="text-[13px] font-semibold text-white/70 mb-1 tracking-[-0.01em]">{label}</div>
      <div className="text-[11px] text-white/55 font-medium leading-relaxed">{detail}</div>
    </div>
  )
}

export function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    const providers = sectionRef.current.querySelectorAll(".provider-name")
    animate(providers, {
      opacity: [0, 0.35],
      translateX: [-8, 0],
      duration: 500,
      delay: stagger(80, { start: 100 }),
      ease: "outQuart",
    })
  }, [])

  return (
    <section ref={sectionRef} className="py-14 md:py-20 px-4 md:px-6 border-y border-white/[0.04]">
      <div className="container mx-auto">
        {/* Provider strip */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-14 mb-10 md:mb-14 flex-wrap">
          <span className="text-[10px] text-white/55 uppercase tracking-[0.15em] font-mono w-full sm:w-auto text-center">Powered by</span>
          {providers.map((name) => (
            <span key={name} className="provider-name text-sm md:text-base font-semibold text-white/50 hover:text-white/75 transition-colors cursor-default" style={{ opacity: 0 }}>
              {name}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.04] mb-10 md:mb-14" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <AnimatedStat key={stat.label} {...stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
