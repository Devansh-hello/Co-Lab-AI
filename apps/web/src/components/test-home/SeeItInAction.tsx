"use client"

import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

const DEMO_LINES = [
  {
    type: "user" as const,
    text: "Build me a real-time chat app with auth",
    delay: 0,
  },
  {
    type: "system" as const,
    text: "Understanding your request...",
    icon: "\u2713",
    delay: 1.8,
  },
  {
    type: "system" as const,
    text: "Frontend Agent \u2192 generating 4 React components...",
    progress: true,
    delay: 3.2,
  },
  {
    type: "system" as const,
    text: "Backend Agent \u2192 generating Express + Socket.io...",
    progress: true,
    delay: 4.6,
  },
  {
    type: "system" as const,
    text: "Review Agent \u2192 checking quality...",
    delay: 6.0,
  },
  {
    type: "system" as const,
    text: "Quality Grade: A (92/100)",
    badge: true,
    delay: 7.4,
  },
  {
    type: "system" as const,
    text: "\u2713 Production code ready \u2014 6 files generated",
    final: true,
    delay: 8.8,
  },
] as const

export function SeeItInAction() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (!sectionRef.current) return
    const items = sectionRef.current.querySelectorAll(".sia-reveal")
    gsap.set(items, { opacity: 0, y: 16 })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(items, {
              opacity: 1,
              y: 0,
              duration: 0.3,
              stagger: 0.06,
              ease: "power2.out",
            })
            observer.disconnect()
          }
        })
      },
      { threshold: 0.15 }
    )
    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, { scope: sectionRef })

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-24 px-4 md:px-8 overflow-hidden"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      {/* Gold radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(230,179,62,0.06) 0%, rgba(230,179,62,0.02) 45%, transparent 70%)" }}
      />
      {/* Edge blends */}
      <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none bg-gradient-to-b from-black to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none bg-gradient-to-t from-black to-transparent" />

      <div className="relative mx-auto max-w-3xl">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="sia-reveal text-[11px] font-mono text-gold-500/60 mb-3 tracking-[0.15em] uppercase font-bold" style={{ opacity: 0 }}>
            See It In Action
          </p>
          <h2 className="sia-reveal text-[clamp(1.4rem,3vw,2.2rem)] font-black text-foreground mb-3 tracking-[-0.03em]" style={{ opacity: 0 }}>
            From idea to production in one session
          </h2>
          <p className="sia-reveal text-[14px] text-white/55 max-w-lg mx-auto leading-relaxed" style={{ opacity: 0 }}>
            Watch how a single prompt becomes a complete, tested, production-ready application.
          </p>
        </div>

        {/* Terminal Card */}
        <div className="sia-reveal" style={{ opacity: 0 }}>
          <div className="rounded-2xl border border-gold-500/[0.15] bg-[#0A0A0A] shadow-elevation-3 overflow-hidden">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] bg-[#0d0d0d]">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="text-[11px] font-mono text-white/25 ml-3">co-lab terminal</span>
            </div>

            {/* Terminal body */}
            <div className="p-5 md:p-7 font-mono text-[12px] md:text-[13px] space-y-3 min-h-[300px]">
              {DEMO_LINES.map((line, i) => (
                <div
                  key={i}
                  className="demo-line flex items-start gap-3"
                  style={{
                    opacity: 0,
                    animation: `demoLineIn 0.4s ease-out forwards`,
                    animationDelay: `${line.delay}s`,
                  }}
                >
                  {line.type === "user" ? (
                    <>
                      <span className="text-gold-500 shrink-0 mt-px font-bold">&gt;</span>
                      <span className="text-white/80 demo-typing">{line.text}</span>
                    </>
                  ) : (
                    <>
                      {/* Icon/indicator */}
                      <span className="shrink-0 mt-px w-4 text-center">
                        {"badge" in line && line.badge ? (
                          <span className="inline-block w-3 h-3 rounded-full bg-gold-500 demo-badge-pulse" />
                        ) : "final" in line && line.final ? (
                          <span className="text-gold-500 font-bold" style={{ textShadow: "0 0 10px rgba(230,179,62,0.5)" }}>
                            &bull;
                          </span>
                        ) : "icon" in line ? (
                          <span className="text-emerald-400">{line.icon}</span>
                        ) : (
                          <span className="text-white/30">&bull;</span>
                        )}
                      </span>

                      {/* Text */}
                      <span
                        className={
                          "badge" in line && line.badge
                            ? "text-gold-500 font-bold"
                            : "final" in line && line.final
                              ? "text-gold-500 font-semibold"
                              : "text-white/55"
                        }
                        style={
                          "final" in line && line.final
                            ? { textShadow: "0 0 12px rgba(230,179,62,0.3)" }
                            : undefined
                        }
                      >
                        {line.text}
                      </span>

                      {/* Progress dots */}
                      {"progress" in line && line.progress && (
                        <span className="inline-flex gap-0.5 ml-1">
                          {[0, 1, 2].map((d) => (
                            <span
                              key={d}
                              className="w-1 h-1 rounded-full bg-gold-500/50"
                              style={{
                                animation: "demoDotPulse 1s ease-in-out infinite",
                                animationDelay: `${d * 0.2}s`,
                              }}
                            />
                          ))}
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}
