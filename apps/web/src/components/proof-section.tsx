"use client"

import { useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import { animate, stagger } from "animejs"
import { ArrowRight, CheckCircle2, FlaskConical, TrendingDown, BookOpen } from "lucide-react"

const PROOF_CARDS = [
  {
    icon: FlaskConical,
    color: "#f59e0b",
    stat: "214",
    label: "Tests Generated",
    detail: "Across 3 scenarios: 32 (todo) + 82 (e-commerce) + 100 (iterate). 4 categories: basic, edge, integration, security.",
  },
  {
    icon: CheckCircle2,
    color: "#10b981",
    stat: "A",
    label: "Quality Grade",
    detail: "Simple apps score A (90/100). Complex apps score B-C. Graded on completeness, security, compatibility, code quality, test coverage.",
  },
  {
    icon: TrendingDown,
    color: "#3b82f6",
    stat: "76%",
    label: "Token Reduction",
    detail: "Test Agent output reduced from 11,431 → 2,763 tokens. Review Agent: 4,274 → 1,785. System prompts: -40%. Total: 35-45% savings.",
  },
  {
    icon: BookOpen,
    color: "#a855f7",
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

const GRADE_COLORS: Record<string, string> = { A: "#10b981", B: "#3b82f6", C: "#f59e0b" }

export function ProofSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const items = ref.current!.querySelectorAll(".proof-item")
          animate(items, {
            opacity: [0, 1], translateY: [24, 0],
            duration: 600, delay: stagger(80, { start: 100 }), ease: "outExpo",
          })
          observer.disconnect()
        }
      })
    }, { threshold: 0.1 })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="pt-4 md:pt-6 pb-12 md:pb-16 px-4 md:px-8">
      <div className="container mx-auto max-w-5xl">

        {/* Provider strip */}
        <div className="flex items-center justify-center gap-3 sm:gap-8 md:gap-12 mb-8 md:mb-10 flex-wrap">
          <span className="text-[9px] sm:text-[10px] text-white/35 uppercase tracking-[0.15em] font-mono hidden sm:inline">Powered by</span>
          {["OpenAI", "Anthropic", "Google", "OpenRouter", "GLM"].map((name) => (
            <span key={name} className="text-[11px] sm:text-sm font-bold text-white/35 tracking-wide">{name}</span>
          ))}
        </div>

        <div className="h-px bg-white/[0.04] mb-8 md:mb-10" />

        {/* Header */}
        <div className="mb-8 md:mb-12">
          <p className="text-[11px] font-mono text-[#D4AF37]/60 mb-3 tracking-[0.15em] uppercase font-bold">
            Proof, Not Promises
          </p>
          <h2 className="text-[clamp(1.4rem,3vw,2.2rem)] font-black text-white tracking-[-0.03em] mb-3">
            Real benchmarks from real tests
          </h2>
          <p className="text-[14px] text-white/55 max-w-lg leading-relaxed">
            Every number below comes from automated E2E tests against live AI providers. No cherry-picking, no mock data.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {PROOF_CARDS.map((card, i) => {
            const Icon = card.icon
            return (
              <div
                key={i}
                className="proof-item rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 md:p-5 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all group"
                style={{ opacity: 0 }}
              >
                <Icon className="w-4 h-4 mb-3" style={{ color: card.color }} />
                <div className="text-[clamp(1.5rem,3vw,2.2rem)] font-black mb-0.5" style={{ color: card.color }}>
                  {card.stat}
                </div>
                <div className="text-[13px] font-semibold text-white/80 mb-2">{card.label}</div>
                <p className="hidden sm:block text-[11px] text-white/50 leading-relaxed">{card.detail}</p>
              </div>
            )
          })}
        </div>

        {/* Pipeline results table */}
        <div className="proof-item relative z-[1] rounded-xl border border-white/[0.07] bg-[#0a0a0a] overflow-hidden" style={{ opacity: 0 }}>
          <div className="px-5 py-3 border-b border-white/[0.05] flex items-center justify-between">
            <span className="text-[12px] font-mono text-white/50 uppercase tracking-wider">E2E Pipeline Results</span>
            <span className="text-[10px] font-mono text-emerald-400/70 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">8/8 PASSED</span>
          </div>

          {/* Header row */}
          <div className="grid grid-cols-4 sm:grid-cols-6 px-4 sm:px-5 py-2 border-b border-white/[0.04] text-[10px] font-mono text-white/35 uppercase tracking-wider">
            <span className="col-span-2">Scenario</span>
            <span className="text-center">Grade</span>
            <span className="text-center">Tests</span>
            <span className="hidden sm:block text-center">Time</span>
            <span className="hidden sm:block text-center">Complexity</span>
          </div>

          {/* Data rows */}
          {PIPELINE_RESULTS.map((r, i) => (
            <div
              key={i}
              className="proof-item grid grid-cols-4 sm:grid-cols-6 items-center px-4 sm:px-5 py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
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

        {/* Link to full benchmarks */}
        <div className="proof-item mt-6 text-center" style={{ opacity: 0 }}>
          <Link
            to="/benchmarks"
            className="inline-flex items-center gap-2 text-[13px] text-white/50 hover:text-[#D4AF37] transition-colors font-medium"
          >
            View full benchmarks, methodology, and all 19 paper citations
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
