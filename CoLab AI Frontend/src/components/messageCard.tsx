"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  User,
  Bot,
  Search,
  Palette,
  Loader2,
  Server,
  ClipboardList,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Package,
  Download,
  Archive,
  FileCode,
  FileText,
  FileJson,
  Braces,
} from "lucide-react"
import type { Message } from "../hooks/useWebSocket"
import type { TokenUsage } from "../hooks/useWebSocket"

// ─── ZIP / Download Utilities ─────────────────────────────────

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff]
  return (crc ^ 0xffffffff) >>> 0
}

function u32(b: Uint8Array, o: number, v: number) {
  b[o] = v & 0xff; b[o+1] = (v>>8)&0xff; b[o+2] = (v>>16)&0xff; b[o+3] = (v>>24)&0xff
}
function u16(b: Uint8Array, o: number, v: number) {
  b[o] = v & 0xff; b[o+1] = (v>>8)&0xff
}

function buildZip(files: Array<{ name: string; content: string }>): Blob {
  const enc = new TextEncoder()
  const parts: Uint8Array[] = []
  const cdParts: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const nb = enc.encode(file.name)
    const cb = enc.encode(file.content)
    const crc = crc32(cb)
    const sz = cb.length

    const lh = new Uint8Array(30 + nb.length)
    u32(lh, 0, 0x04034b50); u16(lh, 4, 20); u16(lh, 6, 0); u16(lh, 8, 0)
    u32(lh, 14, crc); u32(lh, 18, sz); u32(lh, 22, sz); u16(lh, 26, nb.length)
    lh.set(nb, 30)
    parts.push(lh, cb)

    const cd = new Uint8Array(46 + nb.length)
    u32(cd, 0, 0x02014b50); u16(cd, 4, 20); u16(cd, 6, 20)
    u16(cd, 10, 0); u32(cd, 16, crc); u32(cd, 20, sz); u32(cd, 24, sz)
    u16(cd, 28, nb.length); u32(cd, 42, offset)
    cd.set(nb, 46)
    cdParts.push(cd)

    offset += lh.length + cb.length
  }

  const cdSz = cdParts.reduce((s, p) => s + p.length, 0)
  const eocd = new Uint8Array(22)
  u32(eocd, 0, 0x06054b50); u16(eocd, 8, files.length); u16(eocd, 10, files.length)
  u32(eocd, 12, cdSz); u32(eocd, 16, offset)

  return new Blob([...parts, ...cdParts, eocd], { type: "application/zip" })
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function downloadFile(name: string, content: string) {
  triggerDownload(new Blob([content], { type: "text/plain" }), name)
}

function downloadZip(files: Array<{ name: string; content: string }>, zipName = "project.zip") {
  triggerDownload(buildZip(files), zipName)
}

// ─── Helpers ──────────────────────────────────────────────────

function getLanguage(filename: string): string {
  if (filename.endsWith(".css")) return "css"
  if (filename.endsWith(".html")) return "html"
  if (filename.endsWith(".json")) return "json"
  if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "typescript"
  if (filename.endsWith(".py")) return "python"
  if (filename.endsWith(".md")) return "markdown"
  return "javascript"
}

function FileIcon({ filename, className = "w-3 h-3" }: { filename: string; className?: string }) {
  const ext = filename.split(".").pop()?.toLowerCase()
  if (ext === "json") return <FileJson className={className} />
  if (ext === "ts" || ext === "tsx" || ext === "js" || ext === "jsx") return <Braces className={className} />
  if (ext === "md" || ext === "txt") return <FileText className={className} />
  return <FileCode className={className} />
}

// ─── Syntax Highlighter ───────────────────────────────────────

const SyntaxHighlighter: React.FC<{ code: string; language?: string; filename?: string }> = ({
  code, language = "javascript", filename,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { }
  }

  return (
    <div className="rounded-b-xl overflow-hidden border-t border-white/6">
      {filename && (
        <div className="bg-gradient-to-r from-primary/10 to-transparent px-4 py-1.5 text-xs text-foreground border-b border-white/8 flex justify-between items-center">
          <span className="font-mono font-medium text-muted-foreground">{filename}</span>
          <span className="text-[10px] text-muted-foreground/60 bg-white/8 px-1.5 py-0.5 rounded-md">{language}</span>
        </div>
      )}
      <div className="relative bg-[#0d1117]">
        <button
          onClick={handleCopy}
          className="absolute top-2.5 right-2.5 px-2.5 py-1 text-[11px] backdrop-blur-sm bg-white/8 hover:bg-white/15 text-muted-foreground hover:text-foreground rounded-lg transition-all border border-white/10 flex items-center gap-1.5 font-medium shine-effect"
        >
          {copied
            ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</>
            : <><Copy className="w-3 h-3" /> Copy</>
          }
        </button>
        <pre className="p-4 pt-10 text-sm overflow-x-auto leading-relaxed max-h-[500px]">
          <code className="font-mono text-gray-300 text-xs">{code}</code>
        </pre>
      </div>
    </div>
  )
}

// ─── Intent Tag ───────────────────────────────────────────────

const IntentTag: React.FC<{ intent: string }> = ({ intent }) => {
  const config: Record<string, { label: string; color: string; glow: string; animation: string }> = {
    build: {
      label: "BUILD",
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
      glow: "shadow-[0_0_12px_rgba(16,185,129,0.4)]",
      animation: "animate-pulse-glow-green",
    },
    iterate: {
      label: "ITERATE",
      color: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      glow: "shadow-[0_0_12px_rgba(59,130,246,0.4)]",
      animation: "animate-shimmer-blue",
    },
    debug: {
      label: "DEBUG",
      color: "bg-orange-500/20 text-orange-400 border-orange-500/50",
      glow: "shadow-[0_0_12px_rgba(249,115,22,0.4)]",
      animation: "animate-breathe-orange",
    },
  }

  const c = config[intent] || config.build

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${c.color} ${c.glow} ${c.animation} animate-scale-in`}
    >
      {c.label}
    </span>
  )
}

// ─── VS Code File Tabs ─────────────────────────────────────────

interface VSCodeTabsProps {
  files: [string, string][]
  activeTab: number
  onSelectTab: (i: number) => void
  accentClass?: string
}

const VSCodeTabs: React.FC<VSCodeTabsProps> = ({ files, activeTab, onSelectTab, accentClass = "border-b-primary" }) => (
  <div className="flex overflow-x-auto tab-bar bg-[#161616] border-b border-white/8 flex-shrink-0">
    {files.map(([filename], i) => (
      <button
        key={filename}
        onClick={() => onSelectTab(i)}
        title={filename}
        className={`group flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium whitespace-nowrap border-r border-white/8 flex-shrink-0 transition-all relative
          ${activeTab === i
            ? `bg-[#0d1117] text-foreground border-b-2 ${accentClass}`
            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
      >
        <FileIcon filename={filename} className={`w-3 h-3 flex-shrink-0 ${activeTab === i ? "text-primary" : "text-muted-foreground/60"}`} />
        <span className="max-w-[120px] truncate">{filename}</span>
        <button
          onClick={(e) => { e.stopPropagation(); downloadFile(filename, files[i][1]) }}
          className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary p-0.5 rounded"
          title={`Download ${filename}`}
        >
          <Download className="w-2.5 h-2.5" />
        </button>
      </button>
    ))}
  </div>
)

// ─── Code Files Display (VS Code style) ───────────────────────

const CodeFilesDisplay: React.FC<{ data: any; label: string }> = ({ data, label }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [copied, setCopied] = useState(false)

  if (!data || typeof data !== "object") return null

  const files = Object.entries(data).filter(([, v]) => typeof v === "string") as [string, string][]
  if (files.length === 0) return null

  const isFrontend = label === "Frontend"
  const accentBorder = isFrontend ? "border-t-emerald-500" : "border-t-blue-500"
  const accentTabBorder = isFrontend ? "border-b-emerald-500" : "border-b-blue-500"
  const accentText = isFrontend ? "text-emerald-400" : "text-blue-400"

  const handleCopyActive = async () => {
    try {
      await navigator.clipboard.writeText(files[activeTab]?.[1] ?? "")
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { }
  }

  const handleDownloadAll = () =>
    downloadZip(
      files.map(([name, content]) => ({ name, content })),
      `${label.toLowerCase()}-files.zip`
    )

  return (
    <div className={`mt-3 rounded-xl overflow-hidden border border-white/8 border-t-2 ${accentBorder} shadow-[0_4px_24px_rgba(0,0,0,0.4)] animate-spring-in`}>
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#111] border-b border-white/8">
        {isFrontend
          ? <Palette className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          : <Server className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
        }
        <span className={`text-xs font-semibold ${accentText}`}>{label} Files</span>
        <span className="text-[10px] text-muted-foreground/60">({files.length})</span>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={handleCopyActive}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/8 transition-all"
            title="Copy active file"
          >
            {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all shine-effect"
            title="Download all as ZIP"
          >
            <Archive className="w-3 h-3" />
            <span>ZIP all</span>
          </button>
        </div>
      </div>

      {/* VS Code tab bar */}
      <VSCodeTabs
        files={files}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        accentClass={accentTabBorder}
      />

      {/* Code view */}
      {files[activeTab] && (
        <div className="bg-[#0d1117] relative">
          <pre className="p-4 text-xs overflow-x-auto leading-relaxed max-h-[480px]">
            <code className="font-mono text-gray-300">{files[activeTab][1]}</code>
          </pre>
        </div>
      )}
    </div>
  )
}

// ─── Orchestrator Display ─────────────────────────────────────

interface OrchestratorData {
  intent: string
  projectMeta: { name: string; description: string }
  techStack?: {
    frontend?: { framework: string; styling: string; libraries: string[] }
    backend?: { runtime: string; framework: string; database: string; libraries: string[] }
  }
  features: string[]
  frontendTasks: { task: string; details: string }[]
  backendTasks: { task: string; details: string }[]
  architecture: string
  notes: string
}

const OrchestratorDisplay: React.FC<{ data: OrchestratorData }> = ({ data }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const toggle = (k: string) => setExpanded(p => ({ ...p, [k]: !p[k] }))

  return (
    <div className="space-y-2 mt-3">
      <div className="bg-white/4 rounded-xl border border-white/8 p-3.5">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm text-foreground">Project Overview</h4>
        </div>
        <p className="text-xs text-muted-foreground mb-1">
          <strong className="text-foreground">Name:</strong> {data.projectMeta?.name}
        </p>
        <p className="text-xs text-muted-foreground mb-1">
          <strong className="text-foreground">Description:</strong> {data.projectMeta?.description}
        </p>
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Architecture:</strong> {data.architecture}
        </p>
      </div>

      {data.techStack && (
        <div className="bg-white/4 rounded-xl border border-white/8 p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm text-foreground">Tech Stack</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.techStack.frontend && (
              <div className="bg-emerald-500/8 rounded-lg p-2.5 border border-emerald-500/20">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Frontend</span>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong className="text-foreground">Framework:</strong> {data.techStack.frontend.framework}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Styling:</strong> {data.techStack.frontend.styling}
                </p>
                {data.techStack.frontend.libraries?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {data.techStack.frontend.libraries.map((lib, i) => (
                      <span key={i} className="text-[9px] bg-emerald-500/12 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/25">
                        {lib}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {data.techStack.backend && (
              <div className="bg-blue-500/8 rounded-lg p-2.5 border border-blue-500/20">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Backend</span>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong className="text-foreground">Runtime:</strong> {data.techStack.backend.runtime}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Framework:</strong> {data.techStack.backend.framework}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">DB:</strong> {data.techStack.backend.database}
                </p>
                {data.techStack.backend.libraries?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {data.techStack.backend.libraries.map((lib, i) => (
                      <span key={i} className="text-[9px] bg-blue-500/12 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/25">
                        {lib}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {data.features?.length > 0 && (
        <div className="bg-white/4 rounded-xl border border-white/8 p-3.5">
          <button onClick={() => toggle("features")} className="w-full flex justify-between items-center font-semibold text-sm text-foreground hover:text-primary transition-colors">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <span>Features ({data.features.length})</span>
            </div>
            {expanded.features ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronRight className="w-3.5 h-3.5 text-primary" />}
          </button>
          {expanded.features && (
            <ul className="mt-2.5 space-y-1.5">
              {data.features.map((feat, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 pl-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0 shadow-gold-glow" />
                  {feat}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {data.frontendTasks?.length > 0 && (
        <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/18 p-3.5">
          <button onClick={() => toggle("frontend")} className="w-full flex justify-between items-center font-semibold text-sm text-foreground hover:text-emerald-400 transition-colors">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-500" />
              <span>Frontend Tasks ({data.frontendTasks.length})</span>
            </div>
            {expanded.frontend ? <ChevronDown className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
          {expanded.frontend && (
            <ul className="mt-2.5 space-y-1.5">
              {data.frontendTasks.map((t, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 pl-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                  <span><strong className="text-foreground">{t.task}:</strong> {t.details}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {data.backendTasks?.length > 0 && (
        <div className="bg-blue-500/5 rounded-xl border border-blue-500/18 p-3.5">
          <button onClick={() => toggle("backend")} className="w-full flex justify-between items-center font-semibold text-sm text-foreground hover:text-blue-400 transition-colors">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-500" />
              <span>Backend Tasks ({data.backendTasks.length})</span>
            </div>
            {expanded.backend ? <ChevronDown className="w-3.5 h-3.5 text-blue-400" /> : <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
          </button>
          {expanded.backend && (
            <ul className="mt-2.5 space-y-1.5">
              {data.backendTasks.map((t, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 pl-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                  <span><strong className="text-foreground">{t.task}:</strong> {t.details}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Review Display ───────────────────────────────────────────

interface ReviewData {
  completionStatus: { frontendComplete: boolean; backendComplete: boolean; missingItems: string[] }
  setupGuide: { prerequisites: string[]; steps: string[]; envVariables: string[]; runCommands: { frontend: string; backend: string } }
  codeReview: { issues: string[]; suggestions: string[] }
  summary: string
}

const ReviewDisplay: React.FC<{ data: ReviewData }> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<"status" | "setup" | "review">("status")

  return (
    <div className="space-y-2 mt-3">
      <div className="inline-flex bg-white/5 rounded-xl p-1 gap-0.5">
        {([
          { key: "status", label: "Status", icon: <CheckCircle2 className="w-3 h-3" /> },
          { key: "setup",  label: "Setup",  icon: <Package className="w-3 h-3" /> },
          { key: "review", label: "Review", icon: <Search className="w-3 h-3" /> },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1.5
              ${activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "status" && (
        <div className="bg-white/4 rounded-xl border border-white/8 p-3.5 space-y-2.5">
          <p className="text-xs text-muted-foreground">{data.summary}</p>
          <div className="flex gap-2 flex-wrap">
            {(["frontendComplete", "backendComplete"] as const).map(k => (
              <span
                key={k}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border
                  ${data.completionStatus?.[k]
                    ? "bg-emerald-500/12 text-emerald-400 border-emerald-500/25"
                    : "bg-orange-500/12 text-orange-400 border-orange-500/25"
                  }`}
              >
                {data.completionStatus?.[k]
                  ? <CheckCircle2 className="w-3 h-3" />
                  : <XCircle className="w-3 h-3" />
                }
                {k === "frontendComplete" ? "Frontend" : "Backend"}
              </span>
            ))}
          </div>
          {data.completionStatus?.missingItems?.length > 0 && (
            <div>
              <h4 className="font-semibold text-xs text-foreground mb-1.5">Missing Items</h4>
              <ul className="space-y-1">
                {data.completionStatus.missingItems.map((item, i) => (
                  <li key={i} className="text-xs text-orange-400 flex items-start gap-2 pl-1">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === "setup" && (
        <div className="bg-white/4 rounded-xl border border-white/8 p-3.5 space-y-3">
          {data.setupGuide?.prerequisites?.length > 0 && (
            <div>
              <h4 className="font-semibold text-xs text-foreground mb-1.5">Prerequisites</h4>
              <ul className="space-y-1">
                {data.setupGuide.prerequisites.map((req, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 pl-1">
                    <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-1.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.setupGuide?.steps?.length > 0 && (
            <div>
              <h4 className="font-semibold text-xs text-foreground mb-1.5">Setup Steps</h4>
              <ol className="space-y-1.5">
                {data.setupGuide.steps.map((step, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 pl-1">
                    <span className="text-[9px] font-bold text-primary bg-primary/20 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {data.setupGuide?.runCommands && (
            <div>
              <h4 className="font-semibold text-xs text-foreground mb-1.5">Run Commands</h4>
              <div className="grid grid-cols-2 gap-2">
                {(["frontend", "backend"] as const).map(side => (
                  <div key={side} className="bg-[#0d1117] rounded-lg p-2.5 border border-white/8">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${side === "frontend" ? "text-emerald-400" : "text-blue-400"}`}>
                      {side}
                    </span>
                    <p className="text-xs font-mono text-gray-300 mt-1">
                      <span className={side === "frontend" ? "text-emerald-500 mr-1" : "text-blue-500 mr-1"}>$</span>
                      {data.setupGuide.runCommands[side]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "review" && (
        <div className="bg-white/4 rounded-xl border border-white/8 p-3.5 space-y-3">
          {data.codeReview?.issues?.length > 0 && (
            <div>
              <h4 className="font-semibold text-xs text-foreground mb-1.5">Issues Found</h4>
              {data.codeReview.issues.map((issue, i) => (
                <div key={i} className="bg-orange-500/8 border border-orange-500/25 rounded-lg p-2.5 mb-1.5 text-xs text-orange-400">{issue}</div>
              ))}
            </div>
          )}
          {data.codeReview?.suggestions?.length > 0 && (
            <div>
              <h4 className="font-semibold text-xs text-foreground mb-1.5">Suggestions</h4>
              {data.codeReview.suggestions.map((sug, i) => (
                <div key={i} className="bg-blue-500/8 border border-blue-500/25 rounded-lg p-2.5 mb-1.5 text-xs text-blue-400">{sug}</div>
              ))}
            </div>
          )}
          {!data.codeReview?.issues?.length && !data.codeReview?.suggestions?.length && (
            <p className="text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> No issues found. Code looks good!
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Streaming Dropdown ───────────────────────────────────────

export const StreamingDropdown: React.FC<{
  content: string
  agent: string
  isActive: boolean
  tokenUsage?: TokenUsage
  liveEstimate?: number
}> = ({ content, agent, isActive, tokenUsage, liveEstimate }) => {
  const [isOpen, setIsOpen] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const scrollRef = useRef<HTMLPreElement>(null)

  useEffect(() => { if (isActive) setIsOpen(true) }, [isActive])
  useEffect(() => {
    if (scrollRef.current && isOpen) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [content, isOpen])

  if (!content) return null

  const agentColors: Record<string, { border: string; text: string; tabBorder: string }> = {
    "Frontend Agent": { border: "border-t-emerald-500", text: "text-emerald-400", tabBorder: "border-b-emerald-500" },
    "Backend Agent":  { border: "border-t-blue-500",   text: "text-blue-400",    tabBorder: "border-b-blue-500"   },
    "Review Agent":   { border: "border-t-purple-500", text: "text-purple-400",  tabBorder: "border-b-purple-500" },
  }
  const ac = agentColors[agent] ?? { border: "border-t-primary", text: "text-primary", tabBorder: "border-b-primary" }

  const providerIcon =
    agent === "Frontend Agent"
      ? "https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png"
      : agent === "Review Agent"
        ? "https://cdn.z.ai/favicon.ico"
        : null

  let parsedFiles: [string, string][] | null = null
  if (!isActive) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (typeof parsed === "object" && parsed !== null) {
          parsedFiles = Object.entries(parsed).filter(([, v]) => typeof v === "string") as [string, string][]
        }
      }
    } catch { }
  }

  const handleDownloadAll = () => {
    if (!parsedFiles) return
    downloadZip(
      parsedFiles.map(([name, content]) => ({ name, content })),
      `${agent.toLowerCase().replace(" ", "-")}-files.zip`
    )
  }

  return (
    <div className="w-full flex justify-start mb-1 animate-spring-in">
      <div className={`backdrop-blur-md bg-card/40 border border-white/8 border-t-2 ${ac.border} rounded-xl rounded-bl-sm min-w-[42%] max-w-[88%] overflow-hidden transition-all duration-300
        ${isActive ? "shadow-[0_0_24px_rgba(212,175,55,0.15)]" : "shadow-[0_4px_20px_rgba(0,0,0,0.3)]"}`}
      >
        {/* Header / toggle */}
        <button
          onClick={() => setIsOpen(o => !o)}
          className={`w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors
            ${isActive ? "bg-gradient-to-r from-primary/10 to-transparent" : "hover:bg-white/4"}`}
        >
          {isActive && <Loader2 className="w-3 h-3 animate-spin text-primary flex-shrink-0" />}
          {providerIcon && <img src={providerIcon} alt="" className="w-3.5 h-3.5 rounded-sm flex-shrink-0" />}
          <span className={`text-[11px] font-bold uppercase tracking-widest flex-1 ${ac.text}`}>{agent}</span>

          {tokenUsage ? (
            <span className="flex items-center gap-1 text-[10px] font-mono bg-primary/8 border border-primary/25 text-primary px-2 py-0.5 rounded-full">
              ⚡ {tokenUsage.totalTokens.toLocaleString()} tokens
            </span>
          ) : isActive && liveEstimate && liveEstimate > 0 ? (
            <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground animate-pulse">
              ⚡ ~{liveEstimate.toLocaleString()}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground font-mono">
              {parsedFiles ? `${parsedFiles.length} file${parsedFiles.length !== 1 ? "s" : ""}` : `${content.length} chars`}
            </span>
          )}
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>

        {isOpen && (
          <div className="border-t border-white/8">
            {parsedFiles && parsedFiles.length > 0 ? (
              <>
                {/* File toolbar */}
                <div className="flex items-center gap-1 px-3 py-1.5 bg-[#111] border-b border-white/8">
                  <span className="text-[10px] text-muted-foreground flex-1">
                    {parsedFiles.length} file{parsedFiles.length !== 1 ? "s" : ""} generated
                  </span>
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all shine-effect"
                    title="Download all as ZIP"
                  >
                    <Archive className="w-3 h-3" />
                    <span>ZIP all</span>
                  </button>
                </div>

                {/* VS Code tabs */}
                <VSCodeTabs
                  files={parsedFiles}
                  activeTab={activeTab}
                  onSelectTab={setActiveTab}
                  accentClass={ac.tabBorder}
                />

                {/* Code */}
                {parsedFiles[activeTab] && (
                  <div className="bg-[#0d1117] relative">
                    <button
                      onClick={() => downloadFile(parsedFiles![activeTab][0], parsedFiles![activeTab][1])}
                      className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-[10px] bg-white/8 hover:bg-white/15 text-muted-foreground hover:text-foreground rounded-lg transition-all border border-white/10 shine-effect"
                      title="Download this file"
                    >
                      <Download className="w-3 h-3" /> Save
                    </button>
                    <pre className="p-4 pt-10 text-xs font-mono text-gray-300 max-h-[400px] overflow-y-auto overflow-x-auto whitespace-pre-wrap">
                      {parsedFiles[activeTab][1]}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <pre
                ref={scrollRef}
                className="px-4 pb-3 pt-2 text-xs font-mono text-muted-foreground max-h-[240px] overflow-y-auto overflow-x-auto whitespace-pre-wrap"
              >
                {content}
                {isActive && <span className="inline-block w-2 h-3.5 bg-primary ml-0.5 animate-pulse" />}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Markdown Formatter ───────────────────────────────────────

const formatMessageText = (text: string) => {
  if (!text) return null
  return text.split("\n").map((line, idx) => {
    const parts: React.ReactNode[] = []
    let last = 0
    const boldRe = /\*\*([^*]+)\*\*/g
    let m: RegExpExecArray | null
    while ((m = boldRe.exec(line)) !== null) {
      if (m.index > last) parts.push(line.slice(last, m.index))
      parts.push(<strong key={`b-${idx}-${m.index}`} className="font-semibold">{m[1]}</strong>)
      last = m.index + m[0].length
    }
    if (last < line.length) parts.push(line.slice(last))
    return (
      <span key={idx}>
        {parts.length > 0 ? parts : line}
        {idx < text.split("\n").length - 1 && <br />}
      </span>
    )
  })
}

// ─── Main Message Card ────────────────────────────────────────

export const MessageCard: React.FC<{ message: Message }> = React.memo(({ message }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getMessageStyle = () => {
    if (message.sender === "user") {
      return "p-4 bg-gradient-to-br from-primary to-gold-600 text-primary-foreground ml-auto max-w-[72%] rounded-2xl rounded-br-sm shadow-gold-glow animate-spring-in"
    }
    const base = "p-4 backdrop-blur-md bg-card/50 border border-white/8 max-w-[92%] rounded-2xl rounded-bl-sm shadow-[0_4px_20px_rgba(0,0,0,0.3)] animate-spring-in"
    switch (message.type) {
      case "error":        return `${base} border-t-2 border-t-destructive bg-destructive/8`
      case "status":       return `${base} bg-muted/40 max-w-[65%]`
      case "orchestrator": return `${base} border-t-2 border-t-primary`
      case "frontend":     return `${base} border-t-2 border-t-emerald-500`
      case "backend":      return `${base} border-t-2 border-t-blue-500`
      case "review":       return `${base} border-t-2 border-t-purple-500`
      default:             return `${base} max-w-[85%]`
    }
  }

  const getIconBg = () => {
    if (message.sender === "user") return "bg-primary-foreground/15"
    switch (message.type) {
      case "orchestrator": return "bg-primary/18"
      case "frontend":     return "bg-emerald-500/18"
      case "backend":      return "bg-blue-500/18"
      case "review":       return "bg-purple-500/18"
      case "error":        return "bg-destructive/18"
      default:             return "bg-white/8"
    }
  }

  const getIcon = () => {
    switch (message.type) {
      case "orchestrator": return <ClipboardList className="w-4 h-4 text-primary" />
      case "frontend":     return <Palette className="w-4 h-4 text-emerald-400" />
      case "backend":      return <Server className="w-4 h-4 text-blue-400" />
      case "review":       return <ShieldCheck className="w-4 h-4 text-purple-400" />
      case "error":        return <XCircle className="w-4 h-4 text-destructive" />
      case "status":       return <Loader2 className="w-4 h-4 text-primary animate-spin" />
      default:             return message.sender === "user"
        ? <User className="w-4 h-4 text-primary-foreground" />
        : <Bot className="w-4 h-4 text-primary" />
    }
  }

  return (
    <div className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} w-full`}>
      <div className={getMessageStyle()}>
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className={`flex-shrink-0 p-1.5 rounded-xl ${getIconBg()}`}>{getIcon()}</div>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="font-semibold text-xs truncate">{message.username}</span>
            {message.intent && <IntentTag intent={message.intent} />}
            <span className="text-[10px] opacity-45 whitespace-nowrap ml-auto">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className={`text-sm leading-relaxed ${message.sender === "user" ? "text-primary-foreground" : "text-foreground"}`}>
          {formatMessageText(message.content)}
        </div>

        {/* Structured data */}
        {message.data && message.type === "orchestrator" && <OrchestratorDisplay data={message.data} />}
        {message.data && message.type === "frontend"     && <CodeFilesDisplay data={message.data} label="Frontend" />}
        {message.data && message.type === "backend"      && <CodeFilesDisplay data={message.data} label="Backend" />}
        {message.data && message.type === "review"       && <ReviewDisplay data={message.data} />}

        {/* Raw JSON toggle */}
        {message.data && (
          <div className="mt-3">
            <button
              onClick={() => setIsExpanded(e => !e)}
              className="text-[11px] text-muted-foreground/60 hover:text-primary flex items-center gap-1 transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Raw JSON
            </button>
            {isExpanded && (
              <SyntaxHighlighter code={JSON.stringify(message.data, null, 2)} language="json" filename="response.json" />
            )}
          </div>
        )}
      </div>
    </div>
  )
})
