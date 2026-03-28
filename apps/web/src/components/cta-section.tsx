"use client"

import { useRef, useEffect } from "react"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { animate, stagger } from "animejs"

export function CTASection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const els = sectionRef.current!.querySelectorAll(".cta-reveal")
            animate(els, {
              opacity: [0, 1],
              translateY: [30, 0],
              duration: 800,
              delay: stagger(120, { start: 100 }),
              ease: "outExpo",
            })
            observer.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-16 md:py-24 px-4 md:px-6 relative overflow-hidden grain-overlay">
      {/* Background art — sepia-toned to match gold palette */}
      <img
        src="/ART/landscape.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-[0.12] pointer-events-none"
        style={{ filter: "sepia(0.6) saturate(1.2) brightness(0.9)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/70 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />
      {/* Glow */}
      <div className="absolute pointer-events-none" style={{
        top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "900px", height: "700px",
        background: "radial-gradient(ellipse at center, rgba(212,175,55,0.10) 0%, transparent 60%)",
      }} />

      <div className="container mx-auto text-center relative z-10">
        <h2 className="cta-reveal text-[clamp(1.75rem,4.5vw,3.5rem)] font-black text-white tracking-[-0.04em] leading-[0.95] mb-5" style={{ opacity: 0 }}>
          Stop prompting.
          <br />
          <span className="text-[#D4AF37]">Start shipping.</span>
        </h2>
        <p className="cta-reveal text-[14px] md:text-[16px] text-white/50 mb-8 max-w-md mx-auto leading-relaxed font-medium" style={{ opacity: 0 }}>
          Describe your app. Review the plan. Get production-ready code
          with tests, grading, and a live preview — all in one session.
        </p>
        <div className="cta-reveal flex flex-col sm:flex-row gap-3 justify-center" style={{ opacity: 0 }}>
          <Link
            to="/signup"
            className="group inline-flex items-center justify-center gap-2 h-14 px-10 rounded-xl bg-[#D4AF37] hover:bg-[#E0C050] text-black font-bold text-[16px] tracking-[-0.01em] transition-all glow-gold-strong hover:glow-gold-strong relative overflow-hidden shine-gold"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
