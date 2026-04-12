"use client"

import { useState, useRef, type FC } from "react"
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  ChevronDown,
  FileCode,
} from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

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

const CATEGORY_CONFIG: Record<string, { icon: typeof FlaskConical; color: string; label: string }> = {
  basic:       { icon: CheckCircle2,  color: "var(--color-gold-500)", label: "Basic" },
  edge:        { icon: AlertTriangle, color: "var(--color-gold-500)", label: "Edge Case" },
  integration: { icon: FlaskConical,  color: "var(--color-gold-500)", label: "Integration" },
  security:    { icon: Shield,        color: "var(--color-gold-500)", label: "Security" },
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400/80 border-red-500/20",
  high:     "bg-gold-500/10 text-gold-500/70 border-gold-500/15",
  medium:   "bg-white/[0.04] text-white/40 border-white/[0.08]",
  low:      "bg-white/[0.03] text-white/30 border-white/[0.06]",
}

// ─── Coverage Metric ────────────────────────────────────────
function CoverageMetric({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  const barRef = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    if (!barRef.current || !numRef.current) return
    gsap.fromTo(barRef.current,
      { width: "0%" },
      { width: `${Math.min(value, 100)}%`, duration: 0.5, delay: 0.15 + delay / 1000, ease: "power2.out" }
    )
    const obj = { v: 0 }
    gsap.to(obj, {
      v: value, duration: 0.5, delay: 0.15 + delay / 1000, ease: "power2.out",
      onUpdate: () => { if (numRef.current) numRef.current.textContent = Math.round(obj.v) + "%" },
    })
  }, { dependencies: [value, delay] })

  const isNA = value === 0

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] text-white/45 w-[72px] flex-shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-[5px] bg-white/[0.04] rounded-full overflow-hidden">
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

export const TestResultsCard: FC<{ data: TestResultsData }> = ({ data }) => {
  const [expanded, setExpanded] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const expandedRef = useRef<HTMLDivElement>(null)

  const categories = data.testSuite?.categories || {}
  const totalTests = data.testSuite?.totalTests
    || Object.values(categories).reduce((sum, tests) => sum + (tests?.length || 0), 0)
  const coverage = data.coverage || {}
  const validation = data.contractValidation || {}
  const testFiles = data.testFiles || {}
  const testFileCount = Object.keys(testFiles).length

  const hasMismatches = (validation.fieldMismatches?.length || 0) > 0
    || (validation.endpointsMissing?.length || 0) > 0

  const hasCoverage = (coverage.endpointCoverage ?? 0) > 0
    || (coverage.featureCoverage ?? 0) > 0
    || (coverage.securityCoverage ?? 0) > 0

  useGSAP(() => {
    if (!cardRef.current) return
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    )
  }, { scope: cardRef })

  // Animate expanded items when they appear
  useGSAP(() => {
    if (!expanded || !cardRef.current) return
    const items = cardRef.current.querySelectorAll(".expanded-item")
    if (items.length > 0) {
      gsap.fromTo(items,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.2, stagger: 0.04, ease: "power2.out" }
      )
    }
  }, { dependencies: [expanded, expandedCategory] })

  return (
    <div ref={cardRef} className="w-full" style={{ opacity: 0 }}>
      <div className="overflow-hidden border border-white/[0.08]" style={{ backgroundColor: "#1A1A1A", borderRadius: "6px" }}>
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06] hover:bg-white/[0.01] transition-[background] duration-150"
        >
          <FlaskConical className="w-4 h-4 text-gold-500/60 flex-shrink-0" />
          <span className="text-[13px] font-semibold text-white/70 tracking-[-0.02em]">Test Suite</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/35 tabular-nums">
            {totalTests} tests
          </span>
          {testFileCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/35">
              {testFileCount} files
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-white/20 ml-auto transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </button>

        <div className="px-5 py-4 space-y-2">
          {!hasCoverage && totalTests === 0 ? (
            <p className="text-[12px] text-white/40 font-medium">No test cases generated for this project.</p>
          ) : (
            <>
              {coverage.endpointCoverage !== undefined && (
                <CoverageMetric label="Endpoints" value={coverage.endpointCoverage} delay={0} />
              )}
              {coverage.featureCoverage !== undefined && (
                <CoverageMetric label="Features" value={coverage.featureCoverage} delay={100} />
              )}
              {coverage.securityCoverage !== undefined && (
                <CoverageMetric label="Security" value={coverage.securityCoverage} delay={200} />
              )}
            </>
          )}

          {hasMismatches && (
            <div className="flex items-center gap-1.5 pt-1">
              <XCircle className="w-3 h-3 text-gold-500/50" />
              <span className="text-[11px] text-white/35">
                {validation.endpointsMissing?.length || 0} missing endpoints,{" "}
                {validation.fieldMismatches?.length || 0} mismatches
              </span>
            </div>
          )}
        </div>

        {expanded && (
          <div ref={expandedRef} className="px-5 pb-4 space-y-2.5 border-t border-white/[0.06] pt-3">
            <div className="flex flex-wrap gap-1.5 expanded-item" style={{ opacity: 0 }}>
              {Object.entries(categories).map(([key, tests]) => {
                if (!tests || tests.length === 0) return null
                const cat = CATEGORY_CONFIG[key] || CATEGORY_CONFIG.basic
                return (
                  <button
                    key={key}
                    onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-[background,border-color,color] duration-150 border ${
                      expandedCategory === key ? "bg-gold-500/[0.06] border-gold-500/15 text-gold-500/80" : "bg-transparent border-white/[0.06] hover:bg-white/[0.02] text-white/40"
                    }`}
                  >
                    <cat.icon className="w-3 h-3" style={{ color: expandedCategory === key ? "var(--color-gold-500)" : undefined }} />
                    <span>{cat.label}</span>
                    <span className="text-[9px] text-white/20 font-mono">{tests.length}</span>
                  </button>
                )
              })}
            </div>

            {expandedCategory && categories[expandedCategory as keyof typeof categories] && (
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 space-y-1.5">
                {(categories[expandedCategory as keyof typeof categories] || []).map((test, i) => (
                  <div key={i} className="expanded-item flex items-start gap-2 py-1.5 px-2 rounded-lg bg-white/[0.01]" style={{ opacity: 0 }}>
                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0 text-gold-500/50" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white/50 font-medium leading-snug">{test.name}</p>
                      {test.description && (
                        <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{test.description}</p>
                      )}
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
              <div className="expanded-item p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5" style={{ opacity: 0 }}>
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
              <div className="expanded-item flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06]" style={{ opacity: 0 }}>
                <FileCode className="w-3.5 h-3.5 text-white/25" />
                <span className="text-[10px] text-white/40 font-mono">
                  {Object.keys(testFiles).join(" · ")}
                </span>
              </div>
            )}

            {data.summary && (
              <p className="expanded-item text-[11px] text-white/45 leading-relaxed px-1" style={{ opacity: 0 }}>{data.summary}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
