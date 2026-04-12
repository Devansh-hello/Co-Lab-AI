"use client"

import { useRef } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

export function CTASection() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (!sectionRef.current) return
    const els = sectionRef.current.querySelectorAll(".cta-reveal")
    gsap.set(els, { opacity: 0, y: 16 })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            gsap.to(els, {
              opacity: 1, y: 0,
              duration: 0.3, stagger: 0.08, ease: "power2.out",
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
    <section ref={sectionRef} className="py-20 md:py-32 px-4 md:px-8 relative overflow-hidden grain-overlay">
      <img
        src="/ART/landscape.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
        style={{ filter: "sepia(0.5) saturate(1.3) brightness(0.7)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 pointer-events-none" />
      <div className="absolute pointer-events-none" style={{
        top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "900px", height: "700px",
        background: "radial-gradient(ellipse at center, rgba(230,179,62,0.10) 0%, transparent 60%)",
      }} />

      <div className="mx-auto max-w-5xl text-center relative z-10">
        <h2 className="cta-reveal text-[clamp(1.75rem,4.5vw,3.5rem)] font-display font-extrabold text-white tracking-[-0.04em] leading-[0.95] mb-5" style={{ opacity: 0 }}>
          Stop prompting.
          <br />
          <span className="text-gold-500">Start shipping.</span>
        </h2>
        <p className="cta-reveal text-[14px] text-white/55 mb-8 max-w-md mx-auto leading-relaxed" style={{ opacity: 0 }}>
          Describe your app. Review the plan. Get production-ready code
          with tests, grading, and a live preview — all in one session.
        </p>
        <div className="cta-reveal flex flex-col sm:flex-row gap-3 justify-center" style={{ opacity: 0 }}>
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 h-14 px-10 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-bold text-[16px] tracking-[-0.01em] transition-[background] duration-150 glow-gold-strong relative overflow-hidden shine-gold"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-150" />
          </Link>
        </div>
      </div>
    </section>
  )
}
