"use client"

import { useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ArrowRight, FlaskConical, CheckCircle2, TrendingDown, BookOpen } from "lucide-react"

const PROOF_CARDS = [
  {
    icon: FlaskConical,
    stat: "214",
    label: "Tests Generated",
    detail: "Across 3 scenarios: 32 (todo) + 82 (e-commerce) + 100 (iterate). 4 categories: basic, edge, integration, security.",
  },
  {
    icon: CheckCircle2,
    stat: "A",
    label: "Quality Grade",
    detail: "Simple apps score A (90/100). Complex apps score B-C. Graded on completeness, security, compatibility, code quality, test coverage.",
  },
  {
    icon: TrendingDown,
    stat: "76%",
    label: "Token Reduction (Cost Savings)",
    detail: "Test Agent output reduced from 11,431 → 2,763 tokens. Review Agent: 4,274 → 1,785. System prompts: -40%. Total: 35-45% savings.",
  },
  {
    icon: BookOpen,
    stat: "19",
    label: "Research Papers",
    detail: "From ICLR, NeurIPS, ACL, EMNLP, FSE, NAACL, ICML, ACM TOSEM. Every design decision has a citation. Not a weekend hack.",
  },
]

const PIPELINE_RESULTS = [
  { label: "Simple Todo App", grade: "A", score: 90, tests: 32, time: "95s", complexity: 2 },
  { label: "E-commerce Platform", grade: "C", score: 78, tests: 82, time: "198s", complexity: 4 },
  { label: "Iterate: Add Reviews", grade: "B", score: 87, tests: 100, time: "241s", complexity: 4 },
]

const GRADE_COLORS: Record<string, string> = { A: "#E6B33E", B: "#BF9530", C: "#8B7023" }

export function ProofSection() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    const items = ref.current.querySelectorAll(".proof-item")
    gsap.set(items, { opacity: 0, y: 16 })

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          gsap.to(items, {
            opacity: 1, y: 0,
            duration: 0.3, stagger: 0.06, ease: "power2.out",
          })
          observer.disconnect()
        }
      })
    }, { threshold: 0.1 })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, { scope: ref })

  return (
    <section ref={ref} className="relative pt-4 md:pt-6 pb-16 md:pb-24 px-4 md:px-8">
      {/* Gold radial glow — top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(230,179,62,0.07) 0%, rgba(230,179,62,0.03) 40%, transparent 70%)" }} />
      <div className="relative mx-auto max-w-5xl">

        <div className="text-center mb-10 md:mb-14">
          <p className="text-[11px] font-label text-gold-500 mb-3 tracking-[0.15em] uppercase font-bold">
            Proof, Not Promises
          </p>
          <h2 className="text-[clamp(1.4rem,3vw,2.2rem)] font-display font-extrabold text-white tracking-[-0.03em] mb-3">
            Real benchmarks from real tests
          </h2>
          <p className="text-[14px] text-white/55 max-w-lg mx-auto leading-relaxed">
            Every number below comes from automated E2E tests against live AI providers. No cherry-picking, no mock data.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {PROOF_CARDS.map((card, i) => {
            const Icon = card.icon
            return (
              <div
                key={i}
                className="proof-item rounded-xl border border-white/[0.08] p-4 md:p-5 hover:border-gold-500/25 transition-all duration-200 group backdrop-blur-xl"
                style={{ opacity: 0, background: "rgba(255,255,255,0.04)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
              >
                <Icon className="w-4 h-4 mb-3 text-gold-500" />
                <div className="text-[clamp(1.5rem,3vw,2.2rem)] font-extrabold text-gold-500 mb-0.5 font-display">
                  {card.stat}
                </div>
                <div className="text-[13px] font-semibold text-white/80 mb-2">{card.label}</div>
                <p className="hidden sm:block text-[12px] text-white/55 leading-relaxed">{card.detail}</p>
              </div>
            )
          })}
        </div>

        <div className="proof-item relative z-[1] rounded-xl border border-white/[0.08] overflow-hidden backdrop-blur-xl" style={{ opacity: 0, background: "rgba(255,255,255,0.04)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)" }}>
            <span className="text-[12px] font-mono text-white/50 uppercase tracking-wider">E2E Pipeline Results</span>
            <span className="text-[10px] font-mono text-gold-500/80 bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20">8/8 PASSED</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 px-4 sm:px-5 py-2 border-b border-white/[0.04] text-[11px] font-mono text-white/40 uppercase tracking-wider">
            <span className="col-span-2">Scenario</span>
            <span className="text-center">Grade</span>
            <span className="text-center">Tests</span>
            <span className="hidden sm:block text-center">Time</span>
            <span className="hidden sm:block text-center">Complexity</span>
          </div>

          {PIPELINE_RESULTS.map((r, i) => (
            <div
              key={i}
              className="proof-item grid grid-cols-4 sm:grid-cols-6 items-center px-4 sm:px-5 py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors duration-150"
              style={{ opacity: 0 }}
            >
              <span className="col-span-2 text-[12px] sm:text-[13px] text-white/75 font-medium">{r.label}</span>
              <span className="text-center">
                <span className="text-[15px] font-black" style={{ color: GRADE_COLORS[r.grade] }}>{r.grade}</span>
                <span className="text-[10px] text-white/30 ml-1">{r.score}</span>
              </span>
              <span className="text-center text-[12px] font-mono text-white/55">{r.tests}</span>
              <span className="hidden sm:block text-center text-[12px] font-mono text-white/45">{r.time}</span>
              <span className="hidden sm:block text-center text-[12px] font-mono text-white/45">{r.complexity}/5</span>
            </div>
          ))}
        </div>

        <div className="proof-item mt-6 text-center" style={{ opacity: 0 }}>
          <Link
            href="/benchmarks"
            className="inline-flex items-center gap-2 text-[13px] text-white/50 hover:text-gold-500 transition-colors duration-150 font-medium"
          >
            View full benchmarks, methodology, and all 19 paper citations
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
