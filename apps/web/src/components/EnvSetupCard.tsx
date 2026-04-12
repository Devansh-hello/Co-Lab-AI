"use client"

import { useState, useMemo } from "react"
import { Eye, EyeOff, Copy, Check, Download, KeyRound, ChevronDown } from "lucide-react"
import { Collapse } from "./Collapse"

interface EnvSetupCardProps {
  envVariables: string[]
  onSave?: (envValues: Record<string, string>) => void
}

function parseEnvLine(line: string): { key: string; defaultValue: string; isSecret: boolean } {
  const trimmed = line.trim()
  const eqIdx = trimmed.indexOf("=")
  if (eqIdx === -1) return { key: trimmed, defaultValue: "", isSecret: false }

  const key = trimmed.slice(0, eqIdx).trim()
  const defaultValue = trimmed.slice(eqIdx + 1).trim()

  // Detect secrets by common naming patterns
  const secretPatterns = /secret|password|token|key|api_key|auth|private|jwt|database_url|connection|uri/i
  const isSecret = secretPatterns.test(key)

  return { key, defaultValue, isSecret }
}

export function EnvSetupCard({ envVariables, onSave }: EnvSetupCardProps) {
  const parsed = useMemo(() => envVariables.map(parseEnvLine), [envVariables])

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const { key, defaultValue } of parsed) {
      initial[key] = defaultValue
    }
    return initial
  })

  const allFilled = parsed.every(({ key }) => values[key]?.trim())
  const [expanded, setExpanded] = useState(!allFilled)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showEnvFile, setShowEnvFile] = useState(false)

  const envFileContent = useMemo(() => {
    return parsed.map(({ key }) => `${key}=${values[key] || ""}`).join("\n")
  }, [parsed, values])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(envFileContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const handleDownload = () => {
    const blob = new Blob([envFileContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = ".env"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSave = () => {
    onSave?.(values)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const filledCount = parsed.filter(({ key }) => values[key]?.trim()).length

  return (
    <div className="w-full animate-bubble-in px-2 md:px-0">
      <div className="overflow-hidden border border-white/[0.08]" style={{ backgroundColor: "#1A1A1A", borderRadius: "6px" }}>
        {/* Header — accordion trigger style */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="accordion-trigger w-full px-5 py-3 flex items-center gap-2.5 transition-all duration-150 cursor-pointer"
          style={{
            borderBottom: expanded ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}
        >
          <KeyRound className="w-4 h-4 text-gold-500/50 flex-shrink-0" />
          <span className="text-[13px] font-semibold text-white/70 tracking-[-0.02em]">Environment Variables</span>
          <span className="text-[10px] font-mono text-white/30 tabular-nums">{filledCount}/{parsed.length}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-white/20 ml-auto transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </button>

        {/* Collapsible body */}
        <Collapse open={expanded}>
          <div className="border-t border-white/[0.08]">
            {/* .env toggle + raw view */}
            <div className="px-4 pt-3 pb-1 flex justify-end">
              <button
                onClick={() => setShowEnvFile(e => !e)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  showEnvFile
                    ? "text-gold-500/70 bg-gold-500/[0.08] border border-gold-500/15"
                    : "text-white/25 hover:text-white/40 border border-transparent hover:border-white/[0.06]"
                }`}
              >
                {showEnvFile ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                .env
              </button>
            </div>

            <Collapse open={showEnvFile}>
              <div className="mx-4 mb-3 rounded-lg overflow-hidden border border-white/[0.08]">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-base)] border-b border-white/[0.08]">
                  <span className="text-[10px] font-mono text-white/20 flex-1">.env</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
                  >
                    {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>
                <pre className="px-3 py-2.5 text-[12px] font-mono text-gold-500/50 leading-relaxed overflow-x-auto" style={{ backgroundColor: "#0A0A0A" }}>
                  {envFileContent || "# No variables configured yet"}
                </pre>
              </div>
            </Collapse>

            {/* Variable inputs */}
            <div className="px-4 pb-4 space-y-2.5">
          {parsed.map(({ key, isSecret }) => (
            <div key={key} className="flex items-center gap-2">
              <label className="text-[12px] font-mono text-white/40 w-44 truncate flex-shrink-0" title={key}>
                {key}
              </label>
              <div className="relative flex-1">
                <input
                  type={isSecret && !showSecrets[key] ? "password" : "text"}
                  value={values[key] || ""}
                  onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={isSecret ? "Enter secret..." : "Enter value..."}
                  className="w-full border border-white/[0.08] px-3 py-1.5 text-[12px] font-mono text-white/60 placeholder:text-white/25 outline-none focus:border-gold-500/30 transition-colors"
                  style={{ backgroundColor: "#0A0A0A", borderRadius: "6px" }}
                />
                {isSecret && (
                  <button
                    type="button"
                    onClick={() => setShowSecrets(s => ({ ...s, [key]: !s[key] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/40 transition-colors"
                  >
                    {showSecrets[key] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Save button */}
          {onSave && (
            <div className="flex justify-end pt-1">
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold bg-gold-500 text-black hover:bg-gold-400 transition-all"
                style={{ borderRadius: "6px" }}
              >
                {saved ? <><Check className="w-3 h-3" /> Saved</> : "Save"}
              </button>
            </div>
          )}
            </div>
          </div>
        </Collapse>
      </div>
    </div>
  )
}

// ─── Compact env button for top bar ──────────────────────────────

export function EnvButton({ envVariables, onClick }: { envVariables: string[]; onClick: () => void }) {
  if (!envVariables || envVariables.length === 0) return null

  return (
    <button
      onClick={onClick}
      title="View environment variables"
      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border transition-all text-gold-500/60 bg-gold-500/[0.06] border-gold-500/15 hover:bg-gold-500/[0.10] hover:border-gold-500/25"
      style={{ borderRadius: "6px" }}
    >
      <KeyRound className="w-3.5 h-3.5" />
      .env
    </button>
  )
}
