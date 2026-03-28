"use client"

import { useRef, useEffect } from "react"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { animate, stagger } from "animejs"
import {
  CheckCircle2, FlaskConical, Shield, Puzzle, Code2, Zap,
  ArrowRight, ExternalLink, BookOpen, Clock, TrendingDown, Award
} from "lucide-react"

// ─── Data ────────────────────────────────────────────────────

const SCENARIOS = [
  {
    name: "Simple Todo App",
    complexity: 2, grade: "A", score: 90, time: "95s",
    files: { frontend: 18, backend: 8 },
    tests: { total: 32, basic: 8, edge: 11, integration: 7, security: 6 },
    coverage: { endpoint: 100, feature: 100, security: 75 },
    feedback: false, intent: "build",
  },
  {
    name: "E-commerce Platform",
    complexity: 4, grade: "C", score: 78, time: "198s",
    files: { frontend: 0, backend: 20 },
    tests: { total: 82, basic: 22, edge: 24, integration: 11, security: 22 },
    coverage: { endpoint: 100, feature: 100, security: 90 },
    feedback: true, intent: "build",
  },
  {
    name: "Iterate: Add Reviews",
    complexity: 4, grade: "B", score: 87, time: "241s",
    files: { frontend: 0, backend: 20 },
    tests: { total: 100, basic: 19, edge: 19, integration: 11, security: 12 },
    coverage: { endpoint: 95, feature: 90, security: 85 },
    feedback: true, intent: "iterate",
  },
]

const TOKEN_SAVINGS = [
  { component: "Review Agent", before: 4274, after: 1785, savings: 58 },
  { component: "Test Agent", before: 11431, after: 2763, savings: 76 },
  { component: "System Prompts", before: 3290, after: 1970, savings: 40 },
  { component: "API Contract", before: 3200, after: 800, savings: 75 },
]

const SPEED_GAINS = [
  { scenario: "Simple Todo", before: 670, after: 95, factor: "7x" },
  { scenario: "E-commerce", before: 533, after: 198, factor: "2.7x" },
  { scenario: "Iterate", before: 255, after: 241, factor: "~1x" },
]

const QUALITY_CALIBRATION = [
  { scenario: "Simple Todo", oldGrade: "F", oldScore: 36, newGrade: "A", newScore: 90 },
  { scenario: "E-commerce", oldGrade: "F", oldScore: 34, newGrade: "C", newScore: 78 },
  { scenario: "Iterate", oldGrade: "F", oldScore: 15, newGrade: "B", newScore: 87 },
]

const PAPERS = [
  { name: "MetaGPT", venue: "ICLR 2024", id: "2308.00352", took: "SOP pipeline, structured communication, API contract pattern" },
  { name: "ChatDev", venue: "ACL 2024", id: "2307.07924", took: "Chat-chain decomposition, communicative dehallucination" },
  { name: "AgentCoder", venue: "arXiv 2024", id: "2312.13010", took: "Independent test generation, iterative feedback loop" },
  { name: "Evolving Orchestration", venue: "NeurIPS 2025", id: "2505.19591", took: "Dynamic pipeline routing, RL-trained orchestrator" },
  { name: "MacNet", venue: "ICLR 2025", id: "2406.07155", took: "Topology insights — wider > deeper" },
  { name: "MAGIS", venue: "NeurIPS 2024", id: "2403.17927", took: "Complexity-based task decomposition" },
  { name: "CodeAgent Review", venue: "EMNLP 2024", id: "2402.02172", took: "QA-Checker pattern, quality scoring" },
  { name: "LMA for SE Survey", venue: "ACM TOSEM 2024", id: "2404.04834", took: "Gap analysis — no full-stack benchmark exists" },
  { name: "AgentDiet", venue: "FSE 2026", id: "2509.23586", took: "Trajectory reduction — 40-60% token savings" },
  { name: "AgentDropout", venue: "ACL 2025", id: "2503.18891", took: "Selective agent re-run in feedback loop" },
  { name: "CodeAgents", venue: "arXiv 2025", id: "2507.03254", took: "Metadata-only test mode — 76% token savings" },
  { name: "Prompt Compression Survey", venue: "NAACL 2025", id: null, took: "Manual prompt distillation — 40% reduction" },
  { name: "SupervisorAgent", venue: "ICLR 2026", id: "2510.26585", took: "LLM-free plan validation checkpoint" },
  { name: "Chain-of-Verification", venue: "Meta/arXiv", id: "2309.11495", took: "Self-verification in code agent prompts" },
  { name: "Checkpoint Architecture", venue: "arXiv 2026", id: "2603.07728", took: "Inter-agent consistency checkpoints" },
  { name: "Rule-Based MAS", venue: "MDPI 2025", id: null, took: "JSON schema validation on agent outputs" },
  { name: "CoT+RAG+Self-Verify", venue: "arXiv 2025", id: "2505.09031", took: "Hybrid self-check approach" },
  { name: "Citation-Grounded Code", venue: "arXiv 2025", id: "2512.12117", took: "Trust AI assessment — blend with formula" },
  { name: "OPTIMA", venue: "ACL 2025", id: "2410.08115", took: "Efficient agent communication — 2.8x with 10% tokens" },
]

// ─── Components ──────────────────────────────────────────────

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
    </div>
  )
}

function GradeBox({ grade, score }: { grade: string; score: number }) {
  const colors: Record<string, string> = { A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#f97316", F: "#ef4444" }
  const c = colors[grade] || "#fff"
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl font-black" style={{ color: c }}>{grade}</span>
      <span className="text-[12px] font-mono text-white/55">{score}/100</span>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────

export default function Benchmarks() {
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pageRef.current) return
    const sections = pageRef.current.querySelectorAll(".bench-section")
    sections.forEach(section => {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const items = section.querySelectorAll(".bench-item")
            animate(items, {
              opacity: [0, 1], translateY: [20, 0],
              duration: 600, delay: stagger(60, { start: 100 }), ease: "outExpo",
            })
            observer.disconnect()
          }
        })
      }, { threshold: 0.15 })
      observer.observe(section)
    })
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-background bg-grainy">
      <Header />
      <main ref={pageRef} className="flex-1 w-full pt-20">

        {/* ── Hero ── */}
        <section className="py-16 md:py-24 px-4 md:px-8 text-center">
          <p className="text-[11px] font-mono text-[#D4AF37]/60 mb-3 tracking-[0.15em] uppercase font-bold">Benchmarks & Research</p>
          <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-black text-white tracking-[-0.03em] mb-4">
            Real Data. Not Marketing.
          </h1>
          <p className="text-[15px] text-white/50 max-w-xl mx-auto leading-relaxed">
            Every number on this page comes from automated E2E tests run against live AI providers.
            Every technique cites the peer-reviewed paper it came from.
          </p>
        </section>

        {/* ── E2E Test Results ── */}
        <section className="bench-section py-12 md:py-20 px-4 md:px-8 border-t border-white/[0.04]">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-center gap-3 mb-8">
              <FlaskConical className="w-5 h-5 text-amber-400" />
              <h2 className="text-2xl font-bold text-white">E2E Test Results</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20">8/8 PASSED</span>
            </div>
            <p className="bench-item text-[14px] text-white/45 mb-8 max-w-2xl" style={{ opacity: 0 }}>
              3 scenarios tested with OpenRouter paid models (Claude Sonnet 4.6 + Gemini 2.5 Flash). Each test validates the full pipeline: understanding → plan → build → review → test → grade → feedback.
            </p>

            <div className="grid gap-4">
              {SCENARIOS.map((s, i) => (
                <div key={i} className="bench-item rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 md:p-6" style={{ opacity: 0 }}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[15px] font-bold text-white">{s.name}</h3>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/45 border border-white/[0.06]">{s.intent.toUpperCase()}</span>
                      </div>
                      <p className="text-[12px] text-white/50">Complexity {s.complexity}/5 · {s.time} · {s.files.frontend + s.files.backend} files generated</p>
                    </div>
                    <GradeBox grade={s.grade} score={s.score} />
                  </div>

                  {/* Test breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "Basic", count: s.tests.basic, color: "#10b981" },
                      { label: "Edge", count: s.tests.edge, color: "#f59e0b" },
                      { label: "Integration", count: s.tests.integration, color: "#3b82f6" },
                      { label: "Security", count: s.tests.security, color: "#ef4444" },
                    ].map(t => (
                      <div key={t.label} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="text-[11px] text-white/55">{t.label}: <span className="text-white/70 font-bold">{t.count}</span></span>
                      </div>
                    ))}
                  </div>

                  {/* Coverage bars */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Endpoints", value: s.coverage.endpoint },
                      { label: "Features", value: s.coverage.feature },
                      { label: "Security", value: s.coverage.security },
                    ].map(c => (
                      <div key={c.label}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-white/45">{c.label}</span>
                          <span className="text-white/50 font-mono">{c.value}%</span>
                        </div>
                        <Bar value={c.value} max={100} color={c.value >= 90 ? "#10b981" : c.value >= 70 ? "#f59e0b" : "#ef4444"} />
                      </div>
                    ))}
                  </div>

                  {s.feedback && (
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-400/50">
                      <Zap className="w-3 h-3" />
                      Feedback loop triggered — automatic fixes applied
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Token Efficiency ── */}
        <section className="bench-section py-12 md:py-20 px-4 md:px-8 border-t border-white/[0.04]">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-center gap-3 mb-8">
              <TrendingDown className="w-5 h-5 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">Token Efficiency</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20">35-45% SAVED</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {TOKEN_SAVINGS.map((t, i) => (
                <div key={i} className="bench-item rounded-xl border border-white/[0.06] bg-white/[0.02] p-5" style={{ opacity: 0 }}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-[14px] font-semibold text-white/80">{t.component}</h3>
                    <span className="text-[13px] font-bold text-emerald-400">-{t.savings}%</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-white/40">Before</span>
                        <span className="text-white/50 font-mono">{t.before.toLocaleString()}</span>
                      </div>
                      <Bar value={t.before} max={12000} color="#ef4444" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-white/40">After</span>
                        <span className="text-emerald-400/60 font-mono">{t.after.toLocaleString()}</span>
                      </div>
                      <Bar value={t.after} max={12000} color="#10b981" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Speed comparison */}
            <h3 className="bench-item text-[15px] font-bold text-white/70 mb-4" style={{ opacity: 0 }}>Generation Speed</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {SPEED_GAINS.map((s, i) => (
                <div key={i} className="bench-item rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center" style={{ opacity: 0 }}>
                  <div className="text-3xl font-black text-[#D4AF37] mb-1">{s.factor}</div>
                  <div className="text-[12px] text-white/50 font-semibold mb-2">{s.scenario}</div>
                  <div className="text-[11px] text-white/45">{s.before}s → {s.after}s</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Quality Scoring ── */}
        <section className="bench-section py-12 md:py-20 px-4 md:px-8 border-t border-white/[0.04]">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-center gap-3 mb-8">
              <Award className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-2xl font-bold text-white">Quality Scoring System</h2>
            </div>

            {/* Metric weights */}
            <div className="bench-item grid grid-cols-5 gap-3 mb-8" style={{ opacity: 0 }}>
              {[
                { name: "Completeness", weight: "25%", icon: CheckCircle2, color: "#10b981" },
                { name: "Security", weight: "20%", icon: Shield, color: "#ef4444" },
                { name: "API Compat", weight: "25%", icon: Puzzle, color: "#3b82f6" },
                { name: "Code Quality", weight: "15%", icon: Code2, color: "#a855f7" },
                { name: "Test Coverage", weight: "15%", icon: FlaskConical, color: "#f59e0b" },
              ].map(m => (
                <div key={m.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                  <m.icon className="w-4 h-4 mx-auto mb-2" style={{ color: m.color }} />
                  <div className="text-[11px] text-white/50 font-medium">{m.name}</div>
                  <div className="text-[16px] font-black" style={{ color: m.color }}>{m.weight}</div>
                </div>
              ))}
            </div>

            {/* Calibration before/after */}
            <h3 className="bench-item text-[15px] font-bold text-white/70 mb-4" style={{ opacity: 0 }}>Scoring Calibration (Before → After)</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {QUALITY_CALIBRATION.map((q, i) => (
                <div key={i} className="bench-item rounded-xl border border-white/[0.06] bg-white/[0.02] p-5" style={{ opacity: 0 }}>
                  <div className="text-[13px] text-white/50 font-semibold mb-3">{q.scenario}</div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-xl font-black text-red-400">{q.oldGrade}</div>
                      <div className="text-[10px] text-white/40 font-mono">{q.oldScore}/100</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/15" />
                    <div className="text-center">
                      <div className="text-xl font-black" style={{ color: q.newGrade === "A" ? "#10b981" : q.newGrade === "B" ? "#3b82f6" : "#f59e0b" }}>{q.newGrade}</div>
                      <div className="text-[10px] text-white/40 font-mono">{q.newScore}/100</div>
                    </div>
                    <div className="ml-auto text-[12px] font-bold text-emerald-400">+{q.newScore - q.oldScore}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Research Papers ── */}
        <section className="bench-section py-12 md:py-20 px-4 md:px-8 border-t border-white/[0.04]">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Research Foundation</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400/70 border border-blue-500/20">19 PAPERS</span>
            </div>
            <p className="bench-item text-[14px] text-white/55 mb-8 max-w-2xl" style={{ opacity: 0 }}>
              Every architectural decision is grounded in peer-reviewed research from ICLR, NeurIPS, ACL, EMNLP, FSE, NAACL, and ACM TOSEM.
            </p>

            <div className="space-y-2">
              {PAPERS.map((p, i) => (
                <div key={i} className="bench-item flex items-start gap-3 py-3 px-4 rounded-lg hover:bg-white/[0.02] transition-colors group" style={{ opacity: 0 }}>
                  <span className="text-[10px] font-mono text-white/15 w-5 mt-0.5 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-semibold text-white/80">{p.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/45">{p.venue}</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">{p.took}</p>
                  </div>
                  {p.id && (
                    <a
                      href={`https://arxiv.org/abs/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-white/20 hover:text-blue-400 transition-colors flex items-center gap-1 flex-shrink-0 mt-0.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      arxiv
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Methodology ── */}
        <section className="bench-section py-12 md:py-20 px-4 md:px-8 border-t border-white/[0.04]">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-center gap-3 mb-8">
              <Clock className="w-5 h-5 text-white/55" />
              <h2 className="text-2xl font-bold text-white">Methodology</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Test Environment", items: ["OpenRouter API (paid tier)", "Claude Sonnet 4.6 (code generation)", "Gemini 2.5 Flash (planning/review/test)", "MongoDB Atlas (data persistence)", "Node.js 18+ on Ubuntu/WSL"] },
                { title: "What We Measure", items: ["Full pipeline completion (8 stages)", "Quality grade accuracy (5 weighted metrics)", "Token consumption per agent", "API compatibility between frontend/backend", "Test coverage (endpoint, feature, security)"] },
                { title: "How Tests Run", items: ["Automated E2E via WebSocket pipeline", "3 scenarios: simple, complex, iterate", "Real AI provider calls (not mocked)", "Data persistence verified after each run", "8/8 tests must pass for build to succeed"] },
                { title: "Scoring Validation", items: ["AI assessment blended with structural formula", "Feedback loop only on genuine breakage", "Grade calibrated: working app = B+, not F", "Independent test generation (spec-based, not code-based)", "All results reproducible via run-e2e.sh"] },
              ].map((card, i) => (
                <div key={i} className="bench-item rounded-xl border border-white/[0.06] bg-white/[0.02] p-5" style={{ opacity: 0 }}>
                  <h3 className="text-[14px] font-bold text-white/80 mb-3">{card.title}</h3>
                  <ul className="space-y-1.5">
                    {card.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-[12px] text-white/55">
                        <CheckCircle2 className="w-3 h-3 text-white/15 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
