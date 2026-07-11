"use client"

import { useRef } from "react"
import { ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

const AGENT_DOTS = [
  { label: "Orchestrator", color: "bg-gold-500" },
  { label: "Frontend", color: "bg-emerald-400" },
  { label: "Backend", color: "bg-blue-400" },
  { label: "Review", color: "bg-purple-400" },
  { label: "Test", color: "bg-amber-400" },
] as const

export function CTASplit() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (!sectionRef.current) return
    const els = sectionRef.current.querySelectorAll(".cta-reveal")
    gsap.set(els, { opacity: 0, y: 16 })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(els, {
              opacity: 1,
              y: 0,
              duration: 0.3,
              stagger: 0.08,
              ease: "power2.out",
            })
            observer.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, { scope: sectionRef })

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-32 px-4 md:px-8 overflow-hidden"
    >
      {/* Background landscape image */}
      <img
        src="/ART/landscape.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
        style={{ filter: "sepia(0.5) saturate(1.3) brightness(0.7)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 pointer-events-none" />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "900px",
          height: "700px",
          background: "radial-gradient(ellipse at center, rgba(230,179,62,0.10) 0%, transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-5xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">

          {/* Left: Headline + CTA */}
          <div className="text-center lg:text-left">
            <h2
              className="cta-reveal text-[clamp(1.75rem,4.5vw,3.5rem)] font-black text-white tracking-[-0.04em] leading-[0.95] mb-5"
              style={{ opacity: 0 }}
            >
              Stop prompting.
              <br />
              <span className="text-gold-500">Start shipping.</span>
            </h2>
            <p
              className="cta-reveal text-[14px] text-white/55 mb-8 max-w-md leading-relaxed mx-auto lg:mx-0"
              style={{ opacity: 0 }}
            >
              Describe your app. Review the plan. Get production-ready code
              with tests, grading, and a live preview — all in one session.
            </p>
            <div className="cta-reveal" style={{ opacity: 0 }}>
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 h-14 px-10 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-bold text-[16px] tracking-[-0.01em] transition-[background] duration-150 glow-gold-strong relative overflow-hidden shine-gold"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-150" />
              </Link>
            </div>
          </div>

          {/* Right: Mini project card mockup */}
          <div
            className="cta-reveal flex justify-center lg:justify-end"
            style={{ opacity: 0 }}
          >
            <div className="animate-float">
              <div
                className="relative w-full max-w-[320px] rounded-2xl border border-white/[0.08] glass-shine shadow-elevation-3 overflow-hidden"
                style={{ backgroundColor: "rgba(10,10,10,0.92)" }}
              >
                {/* Card header */}
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-bold text-white/90">
                      My Chat App
                    </h3>
                    {/* Quality badge */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-gold-500/40"
                      style={{
                        background: "radial-gradient(circle, rgba(230,179,62,0.15) 0%, rgba(230,179,62,0.05) 100%)",
                      }}
                    >
                      <span className="text-gold-500 font-black text-[15px]">A</span>
                    </div>
                  </div>

                  {/* Agent status dots */}
                  <div className="flex items-center gap-3 mb-4">
                    {AGENT_DOTS.map((agent) => (
                      <div key={agent.label} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${agent.color} relative`}>
                          <Check className="w-2 h-2 text-black absolute top-[1px] left-[1px]" strokeWidth={3} />
                        </span>
                        <span className="text-[9px] text-white/40 font-mono hidden sm:inline">
                          {agent.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.02]">
                  <span className="text-[11px] font-mono text-white/40">
                    6 files generated &middot; 32 tests passed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
