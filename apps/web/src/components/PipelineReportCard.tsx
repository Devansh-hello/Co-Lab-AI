"use client"

import { useState, useRef, type FC } from "react"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Lock,
  Puzzle,
  Code2,
  FlaskConical,
  Shield,
  ChevronDown,
  FileCode,
} from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Collapse } from "./Collapse"

// ─── Interfaces ──────────────────────────────────────────────

interface ReviewData {
  completionStatus?: { frontendComplete: boolean; backendComplete: boolean; missingItems: string[] }
  setupGuide?: { prerequisites: string[]; steps: string[]; envVariables: string[]; runCommands: { frontend: string; backend: string } }
  codeReview?: { issues: string[]; suggestions: string[] }
  summary?: string
}

interface TestCase {
  name: string
  description: string
  target?: string
  expected?: string
  priority?: "critical" | "high" | "medium" | "low"
}

interface TestResultsData {
  testSuite?: {
    totalTests?: number
    categories?: {
      basic?: TestCase[]
      edge?: TestCase[]
      integration?: TestCase[]
      security?: TestCase[]
    }
  }
  contractValidation?: {
    endpointsCovered?: string[]
    endpointsMissing?: string[]
    modelsCovered?: string[]
    fieldMismatches?: string[]
  }
  testFiles?: Record<string, string>
  coverage?: {
    endpointCoverage?: number
    featureCoverage?: number
    securityCoverage?: number
  }
  summary?: string
}

interface QualityData {
  grade: string
  metrics: Record<string, number>
  overall: number
  needsFeedback?: boolean
}

interface PipelineReportCardProps {
  reviewData?: ReviewData
  testData?: TestResultsData
  qualityData?: QualityData
}

// ─── Metric config ──────────────────────────────────────────

const METRIC_CONFIG: Record<string, { icon: typeof CheckCircle2; label: string }> = {
  completeness:  { icon: CheckCircle2, label: "Completeness" },
  security:      { icon: Lock,         label: "Security" },
  compatibility: { icon: Puzzle,       label: "API Compat" },
  codeQuality:   { icon: Code2,        label: "Code Quality" },
  testCoverage:  { icon: FlaskConical, label: "Test Coverage" },
}

const GRADE_LABELS: Record<string, string> = {
  A: "Excellent", B: "Good", C: "Fair", D: "Poor", F: "Failing",
}

const CATEGORY_CONFIG: Record<string, { icon: typeof FlaskConical; label: string }> = {
  basic:       { icon: CheckCircle2,  label: "Basic" },
  edge:        { icon: AlertTriangle, label: "Edge Case" },
  integration: { icon: FlaskConical,  label: "Integration" },
  security:    { icon: Shield,        label: "Security" },
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400/80 border-red-500/20",
  high:     "bg-gold-500/10 text-gold-500/70 border-gold-500/15",
  medium:   "bg-white/[0.04] text-white/40 border-white/[0.08]",
  low:      "bg-white/[0.03] text-white/30 border-white/[0.06]",
}

type Tab = "review" | "tests" | "quality"

// ─── Animated ring gauge ────────────────────────────────────

function RingGauge({ value, size = 72, stroke = 4.5 }: { value: number; size?: number; stroke?: number }) {
  const ringRef = useRef<SVGCircleElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r

  useGSAP(() => {
    if (!ringRef.current || !textRef.current) return
    const offset = circ - (value / 100) * circ
    gsap.fromTo(ringRef.current,
      { attr: { "stroke-dashoffset": circ } },
      { attr: { "stroke-dashoffset": offset }, duration: 0.8, ease: "power3.out" }
    )
    const obj = { v: 0 }
    gsap.to(obj, {
      v: value, duration: 0.8, ease: "power3.out",
      onUpdate: () => { if (textRef.current) textRef.current.textContent = Math.round(obj.v).toString() },
    })
  }, { dependencies: [value, circ] })

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
        <circle
          ref={ringRef}
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--color-gold-500)" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ} strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px rgba(230,179,62,0.25))" }}
        />
      </svg>
      <span ref={textRef} className="absolute text-[17px] font-black font-mono tabular-nums text-gold-500">0</span>
    </div>
  )
}

// ─── Animated bar ───────────────────────────────────────────

function AnimatedBar({ value, delay = 0, label, icon: Icon }: { value: number; delay?: number; label: string; icon?: typeof CheckCircle2 }) {
  const barRef = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)
  const isZero = value === 0
  const color = value >= 80 ? "var(--color-gold-500)" : value >= 60 ? "var(--color-gold-600)" : "#8B7020"

  useGSAP(() => {
    if (!barRef.current || !numRef.current) return
    gsap.fromTo(barRef.current,
      { width: "0%" },
      { width: `${Math.min(value, 100)}%`, duration: 0.5, delay: 0.15 + delay, ease: "power2.out" }
    )
    const obj = { v: 0 }
    gsap.to(obj, {
      v: value, duration: 0.5, delay: 0.15 + delay, ease: "power2.out",
      onUpdate: () => { if (numRef.current) numRef.current.textContent = Math.round(obj.v).toString() },
    })
  }, { dependencies: [value, delay] })

  return (
    <div className="flex items-center gap-2.5">
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isZero ? "rgba(255,255,255,0.2)" : color }} />}
      <span className="text-[11px] text-white/45 w-[72px] flex-shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-[4px] bg-white/[0.04] rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full"
          style={{ width: 0, backgroundColor: isZero ? "rgba(255,255,255,0.08)" : color, boxShadow: isZero ? "none" : `0 0 8px ${color}30` }}
        />
      </div>
      <span ref={numRef} className={`text-[11px] font-mono w-7 text-right tabular-nums ${isZero ? "text-white/20" : ""}`} style={isZero ? undefined : { color }}>0</span>
    </div>
  )
}

function CoverageBar({ value, label, delay = 0 }: { value: number; label: string; delay?: number }) {
  const barRef = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)
  const isNA = value === 0

  useGSAP(() => {
    if (!barRef.current || !numRef.current) return
    gsap.fromTo(barRef.current,
      { width: "0%" },
      { width: `${Math.min(value, 100)}%`, duration: 0.5, delay: 0.15 + delay, ease: "power2.out" }
    )
    const obj = { v: 0 }
    gsap.to(obj, {
      v: value, duration: 0.5, delay: 0.15 + delay, ease: "power2.out",
      onUpdate: () => { if (numRef.current) numRef.current.textContent = Math.round(obj.v) + "%" },
    })
  }, { dependencies: [value, delay] })

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] text-white/45 w-[72px] flex-shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-[4px] bg-white/[0.04] rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full"
          style={{ width: 0, backgroundColor: isNA ? "rgba(255,255,255,0.08)" : "var(--color-gold-500)", boxShadow: isNA ? "none" : "0 0 8px rgba(230,179,62,0.2)" }}
        />
      </div>
      <span ref={numRef} className={`text-[11px] font-mono w-8 text-right tabular-nums ${isNA ? "text-white/20" : "text-gold-500/80"}`}>
        {isNA ? "N/A" : "0%"}
      </span>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────

export const PipelineReportCard: FC<PipelineReportCardProps> = ({ reviewData, testData, qualityData }) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const gradeRef = useRef<HTMLDivElement>(null)

  // Determine available tabs
  const tabs: { id: Tab; label: string; badge?: string }[] = []
  if (reviewData) tabs.push({ id: "review", label: "Review" })
  if (testData) {
    const total = testData.testSuite?.totalTests
      || Object.values(testData.testSuite?.categories || {}).reduce((sum, t) => sum + (t?.length || 0), 0)
    tabs.push({ id: "tests", label: "Tests", badge: total > 0 ? String(total) : undefined })
  }
  if (qualityData) tabs.push({ id: "quality", label: "Quality" })

  const [activeTab, setActiveTab] = useState<Tab>(tabs[0]?.id || "review")
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedTests, setExpandedTests] = useState(false)

  // Summary values
  const grade = qualityData?.grade || "–"
  const overall = qualityData?.overall ?? 0
  const metricValues = qualityData?.metrics ? Object.values(qualityData.metrics) : []
  const effectiveOverall = overall > 0 ? overall : metricValues.length > 0 ? Math.round(metricValues.reduce((a, b) => a + b, 0) / metricValues.length) : 0
  const issueCount = (reviewData?.codeReview?.issues?.length || 0)

  useGSAP(() => {
    if (!cardRef.current) return
    gsap.fromTo(cardRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.38, ease: "power2.out" })
    if (gradeRef.current) {
      gsap.fromTo(gradeRef.current, { scale: 0, opacity: 0 }, { scale: 1.04, opacity: 1, duration: 0.38, delay: 0.12, ease: "power2.out" })
      gsap.to(gradeRef.current, { scale: 1, duration: 0.15, delay: 0.5, ease: "power2.inOut" })
    }
  }, { scope: cardRef })

  if (tabs.length === 0) return null

  return (
    <div ref={cardRef} className="w-full" style={{ opacity: 0 }}>
      <div className="overflow-hidden border border-white/[0.08] relative" style={{ backgroundColor: "#1A1A1A", borderRadius: "6px" }}>
        {/* Ambient glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(230,179,62,0.15), transparent)" }} />

        {/* ── Header: score summary ─────────────────────── */}
        <div className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Zap className="w-4 h-4 text-gold-500/60 flex-shrink-0" />
            <span className="text-[13px] font-semibold text-white/70 tracking-[-0.02em]">Pipeline Report</span>
          </div>

          {/* Score summary chips */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {qualityData && (
              <div className="flex items-center gap-1.5">
                <div
                  ref={gradeRef}
                  className="w-7 h-7 rounded-md flex items-center justify-center font-black text-[11px] bg-gold-500/10 border border-gold-500/20 text-gold-500"
                  style={{ opacity: 0 }}
                >
                  {grade}
                </div>
                <span className="text-[12px] font-bold text-white/60 tabular-nums">{effectiveOverall}/100</span>
              </div>
            )}
            {reviewData && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded tabular-nums ${
                issueCount === 0
                  ? "bg-emerald-500/[0.06] text-emerald-400/60 border border-emerald-500/10"
                  : "bg-orange-500/[0.06] text-orange-400/60 border border-orange-500/10"
              }`}>
                {issueCount} issue{issueCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* ── Tab bar ───────────────────────────────────── */}
        {tabs.length > 1 && (
          <div className="flex gap-px px-5 border-b border-white/[0.06]">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.1em] transition-[color,border-color] duration-[180ms]
                  ${activeTab === t.id
                    ? "text-gold-500/80 border-b-2 border-b-gold-500 -mb-px"
                    : "text-white/25 hover:text-white/45 border-b-2 border-transparent"
                  }`}
              >
                {t.label}
                {t.badge && (
                  <span className="ml-1.5 text-[9px] text-white/20">{t.badge}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Tab content ───────────────────────────────── */}
        <div className="p-5">

          {/* ── REVIEW TAB ──────────────────────────── */}
          {activeTab === "review" && reviewData && (
            <ReviewTabContent data={reviewData} />
          )}

          {/* ── TESTS TAB ───────────────────────────── */}
          {activeTab === "tests" && testData && (
            <TestsTabContent
              data={testData}
              expanded={expandedTests}
              setExpanded={setExpandedTests}
              expandedCategory={expandedCategory}
              setExpandedCategory={setExpandedCategory}
            />
          )}

          {/* ── QUALITY TAB ─────────────────────────── */}
          {activeTab === "quality" && qualityData && (
            <QualityTabContent data={qualityData} effectiveOverall={effectiveOverall} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Review Tab ─────────────────────────────────────────────

function ReviewTabContent({ data }: { data: ReviewData }) {
  const [subTab, setSubTab] = useState<"status" | "setup" | "review">("status")

  return (
    <div className="space-y-3">
      {/* Summary */}
      {data.summary && (
        <p className="text-[12px] text-white/50 leading-relaxed">{data.summary}</p>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-px border-b border-white/[0.05]">
        {(["status", "setup", "review"] as const).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-2.5 py-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-[color,border-color] duration-[180ms]
              ${subTab === t
                ? "text-white/60 border-b border-b-white/30 -mb-px"
                : "text-white/20 hover:text-white/40 border-b border-transparent"
              }`}
          >
            {t === "status" ? "Status" : t === "setup" ? "Setup Guide" : "Code Review"}
          </button>
        ))}
      </div>

      {subTab === "status" && (
        <div className="space-y-2.5">
          <div className="flex gap-2">
            {(["frontendComplete", "backendComplete"] as const)
              .filter(k => {
                if (k === "backendComplete" && !data.setupGuide?.runCommands?.backend) return false
                return true
              })
              .map(k => (
              <span
                key={k}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border
                  ${data.completionStatus?.[k]
                    ? "bg-gold-500/[0.06] text-gold-500/70 border-gold-500/15"
                    : "bg-orange-500/[0.06] text-orange-400/70 border-orange-500/15"
                  }`}
              >
                {data.completionStatus?.[k] ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {k === "frontendComplete" ? "Frontend" : "Backend"}
              </span>
            ))}
          </div>
          {(data.completionStatus?.missingItems?.length ?? 0) > 0 && (
            <div className="rounded-lg border border-orange-500/10 bg-orange-500/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-400/50 mb-1.5">Missing</p>
              <ul className="space-y-1">
                {data.completionStatus!.missingItems.map((item, i) => (
                  <li key={i} className="text-[11px] text-orange-300/60 flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-orange-400/40 mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {subTab === "setup" && (
        <div className="space-y-2.5">
          {(data.setupGuide?.prerequisites?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">Prerequisites</p>
              <ul className="space-y-1">
                {data.setupGuide!.prerequisites.map((req, i) => (
                  <li key={i} className="text-[11px] text-white/60 flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/15 mt-1.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(data.setupGuide?.steps?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">Steps</p>
              <ol className="space-y-1">
                {data.setupGuide!.steps.map((step, i) => (
                  <li key={i} className="text-[11px] text-white/60 flex items-start gap-2">
                    <span className="text-[10px] font-bold text-primary/40 bg-primary/[0.06] rounded w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {data.setupGuide?.runCommands && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">Run Commands</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(["frontend", "backend"] as const).filter(s => data.setupGuide?.runCommands?.[s]).map(side => (
                  <div key={side} className="bg-[var(--surface-base)] rounded-lg p-2.5 border border-white/[0.04]">
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${side === "frontend" ? "text-emerald-500/50" : "text-blue-500/50"}`}>{side}</p>
                    <p className="text-[11px] font-mono text-white/70">
                      <span className={side === "frontend" ? "text-emerald-500/40 mr-1" : "text-blue-500/40 mr-1"}>$</span>
                      {data.setupGuide!.runCommands[side]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === "review" && (
        <div className="space-y-2">
          {(data.codeReview?.issues?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-400/60 mb-1.5">Issues</p>
              {data.codeReview!.issues.map((issue, i) => (
                <div key={i} className="rounded-lg border border-orange-500/10 bg-orange-500/[0.03] px-3 py-2 mb-1.5 text-[11px] text-orange-300/60">{issue}</div>
              ))}
            </div>
          )}
          {(data.codeReview?.suggestions?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400/60 mb-1.5">Suggestions</p>
              {data.codeReview!.suggestions.map((sug, i) => (
                <div key={i} className="rounded-lg border border-blue-500/10 bg-blue-500/[0.03] px-3 py-2 mb-1.5 text-[11px] text-blue-300/60">{sug}</div>
              ))}
            </div>
          )}
          {!data.codeReview?.issues?.length && !data.codeReview?.suggestions?.length && (
            <p className="text-[11px] text-emerald-400/60 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> No issues found.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tests Tab ──────────────────────────────────────────────

function TestsTabContent({ data, expanded, setExpanded, expandedCategory, setExpandedCategory }: {
  data: TestResultsData
  expanded: boolean
  setExpanded: (v: boolean) => void
  expandedCategory: string | null
  setExpandedCategory: (v: string | null) => void
}) {
  const categories = data.testSuite?.categories || {}
  const coverage = data.coverage || {}
  const validation = data.contractValidation || {}
  const testFiles = data.testFiles || {}
  const testFileCount = Object.keys(testFiles).length

  const hasCoverage = (coverage.endpointCoverage ?? 0) > 0
    || (coverage.featureCoverage ?? 0) > 0
    || (coverage.securityCoverage ?? 0) > 0

  const hasMismatches = (validation.fieldMismatches?.length || 0) > 0
    || (validation.endpointsMissing?.length || 0) > 0

  return (
    <div className="space-y-3">
      {/* Coverage bars */}
      {hasCoverage ? (
        <div className="space-y-2">
          {coverage.endpointCoverage !== undefined && <CoverageBar label="Endpoints" value={coverage.endpointCoverage} delay={0} />}
          {coverage.featureCoverage !== undefined && <CoverageBar label="Features" value={coverage.featureCoverage} delay={0.08} />}
          {coverage.securityCoverage !== undefined && <CoverageBar label="Security" value={coverage.securityCoverage} delay={0.16} />}
        </div>
      ) : (
        <p className="text-[12px] text-white/35 font-medium">No coverage data available.</p>
      )}

      {hasMismatches && (
        <div className="flex items-center gap-1.5">
          <XCircle className="w-3 h-3 text-gold-500/50" />
          <span className="text-[11px] text-white/35">
            {validation.endpointsMissing?.length || 0} missing endpoints,{" "}
            {validation.fieldMismatches?.length || 0} mismatches
          </span>
        </div>
      )}

      {/* Expandable test details */}
      {Object.keys(categories).length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-[11px] text-white/25 hover:text-white/45 transition-colors duration-[180ms]"
          >
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Hide details" : "Show test details"}
          </button>

          <Collapse open={expanded}>
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(categories).map(([key, tests]) => {
                  if (!tests || tests.length === 0) return null
                  const cat = CATEGORY_CONFIG[key] || CATEGORY_CONFIG.basic
                  return (
                    <button
                      key={key}
                      onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-[background-color,border-color,color] duration-[180ms] border ${
                        expandedCategory === key ? "bg-gold-500/[0.06] border-gold-500/15 text-gold-500/80" : "bg-transparent border-white/[0.06] hover:bg-white/[0.02] text-white/40"
                      }`}
                    >
                      <cat.icon className="w-3 h-3" />
                      <span>{cat.label}</span>
                      <span className="text-[9px] text-white/20 font-mono">{tests.length}</span>
                    </button>
                  )
                })}
              </div>

              {expandedCategory && categories[expandedCategory as keyof typeof categories] && (
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 space-y-1.5">
                  {(categories[expandedCategory as keyof typeof categories] || []).map((test, i) => (
                    <div key={i} className="flex items-start gap-2 py-1.5 px-2 rounded-lg bg-white/[0.01]">
                      <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0 text-gold-500/50" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-white/50 font-medium leading-snug">{test.name}</p>
                        {test.description && <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{test.description}</p>}
                      </div>
                      {test.priority && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider flex-shrink-0 ${PRIORITY_COLORS[test.priority] || PRIORITY_COLORS.low}`}>
                          {test.priority}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(validation.endpointsMissing?.length || 0) > 0 && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                  <span className="text-[9px] uppercase tracking-[0.1em] text-white/40 font-bold font-mono">Missing Endpoints</span>
                  {validation.endpointsMissing!.map((ep, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <XCircle className="w-3 h-3 text-white/25 flex-shrink-0" />
                      <span className="text-[10px] text-white/40 font-mono">{ep}</span>
                    </div>
                  ))}
                </div>
              )}

              {testFileCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <FileCode className="w-3.5 h-3.5 text-white/25" />
                  <span className="text-[10px] text-white/40 font-mono">
                    {Object.keys(testFiles).join(" · ")}
                  </span>
                </div>
              )}

              {data.summary && (
                <p className="text-[11px] text-white/45 leading-relaxed px-1">{data.summary}</p>
              )}
            </div>
          </Collapse>
        </>
      )}
    </div>
  )
}

// ─── Quality Tab ────────────────────────────────────────────

function QualityTabContent({ data, effectiveOverall }: { data: QualityData; effectiveOverall: number }) {
  const gradeLabel = GRADE_LABELS[data.grade] || "–"

  return (
    <div className="space-y-4">
      {/* Ring + grade */}
      <div className="flex items-center gap-5">
        <RingGauge value={effectiveOverall} />
        <div>
          <span className="text-[15px] font-bold tracking-[-0.03em] text-white/80">{effectiveOverall}/100</span>
          <p className="text-[11px] text-white/40 font-medium">{gradeLabel}</p>
        </div>
        {data.needsFeedback && (
          <div className="flex items-center gap-1.5 ml-auto px-2 py-1 rounded-md bg-gold-500/[0.06] border border-gold-500/15">
            <AlertTriangle className="w-3 h-3 text-gold-500/70 animate-pulse" />
            <span className="text-[9px] text-gold-500/60 font-semibold tracking-wide uppercase font-mono">Auto-fixing</span>
          </div>
        )}
      </div>

      {/* Metric bars */}
      <div className="space-y-2.5">
        {Object.entries(data.metrics).map(([key, value], i) => {
          const cfg = METRIC_CONFIG[key]
          if (!cfg) return null
          return <AnimatedBar key={key} label={cfg.label} value={value} icon={cfg.icon} delay={i * 0.06} />
        })}
      </div>
    </div>
  )
}
