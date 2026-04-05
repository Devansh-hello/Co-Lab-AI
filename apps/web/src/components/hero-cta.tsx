"use client"

import { useRef } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

export function HeroCTA() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    const els = ref.current.querySelectorAll(".cta-item")
    gsap.set(els, { opacity: 0, y: 12 })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            gsap.to(els, {
              opacity: 1, y: 0,
              duration: 0.25, stagger: 0.06, ease: "power2.out",
            })
            observer.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, { scope: ref })

  return (
    <section ref={ref} className="py-12 md:py-16 px-4 md:px-8 lg:px-12 border-b border-white/[0.04]">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <p className="cta-item text-[14px] md:text-[15px] text-white/65 leading-relaxed max-w-md" style={{ opacity: 0 }}>
              6 specialized agents plan, build, review, test, and grade your full-stack app — in parallel. Quality scoring, feedback loops, and in-browser preview.
            </p>
            <div className="cta-item flex flex-wrap gap-2.5 flex-shrink-0" style={{ opacity: 0 }}>
              <Link
                href="/projects"
                className="group inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-bold text-[13px] transition-[background] duration-150 glow-gold hover:glow-gold-strong relative overflow-hidden shine-gold"
              >
                Start Building
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg border border-white/[0.1] text-white/60 hover:text-white hover:border-white/20 hover:bg-white/[0.04] font-semibold text-[13px] transition-[color,border-color,background] duration-150"
              >
                Create Account
              </Link>
              <Link
                href="/benchmarks"
                className="inline-flex items-center justify-center gap-2 h-10 px-5 text-white/55 hover:text-white/70 font-medium text-[13px] transition-colors duration-150"
              >
                View Benchmarks →
              </Link>
            </div>
          </div>

          <div className="cta-item flex items-center gap-5 text-[9px] font-mono text-white/25 uppercase tracking-[0.12em]" style={{ opacity: 0 }}>
            <span><span className="text-white/65 text-[12px] font-bold tabular-nums">6</span> Agents</span>
            <span className="w-px h-2.5 bg-white/10" />
            <span><span className="text-white/65 text-[12px] font-bold tabular-nums">19</span> Papers</span>
            <span className="w-px h-2.5 bg-white/10" />
            <span><span className="text-gold-500 text-[12px] font-bold tabular-nums">A</span> Quality</span>
          </div>
        </div>
      </div>
    </section>
  )
}
