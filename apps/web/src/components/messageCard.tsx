"use client"

import { useState, useEffect, useRef, memo, type FC, type ReactNode } from "react"
import {
  ChevronRight,
  Copy,
  Check,
  Loader2,
  XCircle,
  CheckCircle2,
  Download,
  Archive,
  FileCode,
  FileText,
  FileJson,
  Braces,
  Monitor,
  Code2,
  RotateCcw,
} from "lucide-react"
import { Collapse } from "./Collapse"
import { Highlight, themes } from "prism-react-renderer"
import type { Message, TokenUsage } from "../hooks/useWebSocket"

// ─── Syntax-highlighted code block ───────────────────────────

function getLang(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  const map: Record<string, string> = {
    ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
    css: "css", html: "markup", json: "json", py: "python",
    md: "markdown", yaml: "yaml", yml: "yaml", sh: "bash",
    sql: "sql", go: "go", rs: "rust", java: "java",
  }
  return map[ext] || "javascript"
}

const CodeBlock: FC<{ code: string; filename: string; className?: string }> = ({ code, filename, className = "" }) => (
  <Highlight theme={themes.nightOwl} code={code.trimEnd()} language={getLang(filename)}>
    {({ tokens, getLineProps, getTokenProps }) => (
      <pre className={`p-4 pt-2 text-[13px] font-mono leading-relaxed overflow-x-auto max-h-[480px] overflow-y-auto chat-scroll ${className}`} style={{ background: "transparent" }}>
        {tokens.map((line, i) => (
          <div key={i} {...getLineProps({ line })} style={{ ...getLineProps({ line }).style, background: "transparent" }}>
            <span className="inline-block w-8 text-right mr-4 text-white/15 select-none text-[11px]">{i + 1}</span>
            {line.map((token, j) => (
              <span key={j} {...getTokenProps({ token })} />
            ))}
          </div>
        ))}
      </pre>
    )}
  </Highlight>
)

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
    const crc = crc32(cb), sz = cb.length
    const lh = new Uint8Array(30 + nb.length)
    u32(lh, 0, 0x04034b50); u16(lh, 4, 20); u16(lh, 8, 0)
    u32(lh, 14, crc); u32(lh, 18, sz); u32(lh, 22, sz); u16(lh, 26, nb.length)
    lh.set(nb, 30); parts.push(lh, cb)
    const cd = new Uint8Array(46 + nb.length)
    u32(cd, 0, 0x02014b50); u16(cd, 4, 20); u16(cd, 6, 20)
    u32(cd, 16, crc); u32(cd, 20, sz); u32(cd, 24, sz)
    u16(cd, 28, nb.length); u32(cd, 42, offset); cd.set(nb, 46); cdParts.push(cd)
    offset += lh.length + cb.length
  }
  const cdSz = cdParts.reduce((s, p) => s + p.length, 0)
  const eocd = new Uint8Array(22)
  u32(eocd, 0, 0x06054b50); u16(eocd, 8, files.length); u16(eocd, 10, files.length)
  u32(eocd, 12, cdSz); u32(eocd, 16, offset)
  const allParts: BlobPart[] = [...parts, ...cdParts, eocd].map(p => new Uint8Array(p.buffer, p.byteOffset, p.byteLength) as unknown as BlobPart)
  return new Blob(allParts, { type: "application/zip" })
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

// ─── Preview Helpers ──────────────────────────────────────────

function findMainComponentName(files: [string, string][]): string {
  for (const [, code] of files) {
    let m = code.match(/export\s+default\s+(?:function|class)\s+([A-Z]\w+)/)
    if (m) return m[1]
    m = code.match(/export\s+default\s+([A-Z]\w+)\s*[;\n]/)
    if (m) return m[1]
  }
  return "App"
}

function sortByDependency(files: [string, string][]): [string, string][] {
  const toKey = (p: string) =>
    p.replace(/^(?:\.\/|src\/|\.\.\/)*/, "")
      .replace(/\.[jt]sx?$/, "")
      .toLowerCase()

  const keys = files.map(([n]) => toKey(n))
  const deps = new Map<string, Set<string>>()
  for (const [name, content] of files) {
    const key = toKey(name)
    const fileDeps = new Set<string>()
    const re = /from\s+['"]([^'"]+)['"]/g
    let m: RegExpExecArray | null
    while ((m = re.exec(content)) !== null) {
      const imp = m[1]
      if (!imp.startsWith(".")) continue
      const impKey = toKey(imp)
      const found = keys.find(k => k === impKey || k.endsWith("/" + impKey))
      if (found) fileDeps.add(found)
    }
    deps.set(key, fileDeps)
  }

  const visited = new Set<string>()
  const result: [string, string][] = []

  function visit(key: string) {
    if (visited.has(key)) return
    visited.add(key)
    for (const dep of deps.get(key) ?? []) visit(dep)
    const file = files.find(([n]) => toKey(n) === key)
    if (file) result.push(file)
  }

  for (const [name] of files) visit(toKey(name))
  return result
}

function stripImportsForPreview(code: string): string {
  code = code.replace(
    /import\s+(?:type\s+)?(?:\{[^}]*\}|\w+|\*\s+as\s+\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+))*\s+from\s*['"][^'"]*['"]\s*;?/g,
    ""
  )
  code = code.replace(/import\s*['"][^'"]*['"]\s*;?/g, "")
  code = code.replace(/export\s*\{[^}]*\}\s*(?:from\s*['"][^'"]*['"])?\s*;?/g, "")
  code = code.replace(/export\s*\*\s*(?:as\s+\w+\s+)?from\s*['"][^'"]*['"]\s*;?/g, "")
  code = code.replace(/export\s+default\s+/g, "")
  code = code.replace(
    /\bexport\s+(?=(?:abstract\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|enum|type)\b)/g,
    ""
  )
  return code
}

// ─── Third-party CDN registry ─────────────────────────────────

const PKG_CDN: Record<string, { cdn: string; global: string }> = {
  "axios":                    { cdn: "https://unpkg.com/axios/dist/axios.min.js",                              global: "axios" },
  "lodash":                   { cdn: "https://unpkg.com/lodash/lodash.min.js",                                 global: "_" },
  "lodash-es":                { cdn: "https://unpkg.com/lodash/lodash.min.js",                                 global: "_" },
  "dayjs":                    { cdn: "https://unpkg.com/dayjs/dayjs.min.js",                                   global: "dayjs" },
  "moment":                   { cdn: "https://unpkg.com/moment/min/moment.min.js",                             global: "moment" },
  "date-fns":                 { cdn: "https://unpkg.com/date-fns/cdn.min.js",                                  global: "dateFns" },
  "uuid":                     { cdn: "https://unpkg.com/uuid/dist/umd/uuidv4.min.js",                         global: "uuid" },
  "classnames":               { cdn: "https://unpkg.com/classnames/index.js",                                  global: "classNames" },
  "clsx":                     { cdn: "https://unpkg.com/clsx/dist/clsx.min.js",                                global: "clsx" },
  "zustand":                  { cdn: "https://unpkg.com/zustand/umd/zustand.development.js",                   global: "zustand" },
  "react-router-dom":         { cdn: "https://unpkg.com/react-router-dom/umd/react-router-dom.min.js",        global: "ReactRouterDOM" },
  "react-router":             { cdn: "https://unpkg.com/react-router/umd/react-router.min.js",                global: "ReactRouter" },
  "framer-motion":            { cdn: "https://unpkg.com/framer-motion/dist/framer-motion.js",                 global: "Motion" },
  "chart.js":                 { cdn: "https://unpkg.com/chart.js/dist/chart.umd.min.js",                      global: "Chart" },
  "recharts":                 { cdn: "https://unpkg.com/recharts/umd/Recharts.js",                            global: "Recharts" },
  "@tanstack/react-query":    { cdn: "https://unpkg.com/@tanstack/react-query/build/umd/index.development.js", global: "ReactQuery" },
  "react-query":              { cdn: "https://unpkg.com/react-query/umd/react-query.development.js",          global: "ReactQuery" },
  "swr":                      { cdn: "https://unpkg.com/swr/dist/index.umd.js",                               global: "swr" },
  "react-hook-form":          { cdn: "https://unpkg.com/react-hook-form/dist/index.umd.min.js",               global: "ReactHookForm" },
  "zod":                      { cdn: "https://unpkg.com/zod/lib/index.umd.js",                                global: "Zod" },
  "immer":                    { cdn: "https://unpkg.com/immer/dist/immer.umd.production.min.js",              global: "immer" },
}

interface PkgImport { pkg: string; defaultName?: string; namedNames?: string[]; namespaceName?: string }

function extractPkgImports(code: string): PkgImport[] {
  const results: PkgImport[] = []
  const re = /import\s+(?:type\s+)?([^'"]+?)\s+from\s+['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) {
    const clause = m[1].trim()
    const pkg = m[2]
    if (pkg.startsWith(".") || pkg === "react" || pkg.startsWith("react-dom")) continue
    const info: PkgImport = { pkg }
    const ns = clause.match(/^\*\s+as\s+(\w+)$/)
    if (ns) { info.namespaceName = ns[1] }
    else {
      const named = clause.match(/\{([^}]+)\}/)
      if (named) info.namedNames = named[1].split(",").map(s => s.trim()).filter(Boolean)
      const def = clause.replace(/\{[^}]*\}/g, "").replace(/,/g, "").trim()
      if (def) info.defaultName = def
    }
    results.push(info)
  }
  return results
}

function buildPkgPreamble(files: [string, string][]): { cdnTags: string; varLines: string } {
  const allImports = files.flatMap(([, code]) => extractPkgImports(code))
  const loadedPkgs = new Set<string>()
  const cdnTags: string[] = []
  const varLines: string[] = []

  for (const { pkg, defaultName, namedNames, namespaceName } of allImports) {
    const info = PKG_CDN[pkg] ?? PKG_CDN[pkg.split("/").slice(0, 2).join("/")]
    if (!info) continue

    if (!loadedPkgs.has(pkg)) {
      loadedPkgs.add(pkg)
      cdnTags.push(`  <script src="${info.cdn}" crossorigin></script>`)
    }

    if (namespaceName)
      varLines.push(`var ${namespaceName} = window["${info.global}"];`)
    if (defaultName && defaultName !== namespaceName)
      varLines.push(`var ${defaultName} = window["${info.global}"];`)
    if (namedNames?.length) {
      const mapped = namedNames.map(n => {
        const [orig, alias] = n.split(/\s+as\s+/)
        return alias ? `${orig.trim()}: ${alias.trim()}` : orig.trim()
      })
      varLines.push(`var { ${mapped.join(", ")} } = window["${info.global}"] || {};`)
    }
  }

  return { cdnTags: cdnTags.join("\n"), varLines: varLines.join("\n") }
}

function isReactProject(files: [string, string][]): boolean {
  return files.some(([name, code]) =>
    name.endsWith(".jsx") || name.endsWith(".tsx") ||
    /from\s+['"]react['"]/i.test(code) ||
    /require\s*\(\s*['"]react['"]\s*\)/.test(code)
  )
}

export function generatePreviewHTML(files: [string, string][]): string {
  const CONFIG_FILE_RE = /(?:^|\/)(?:tailwind|vite|postcss|jest|vitest|babel|eslint|prettier|webpack|rollup|next|nuxt)\.config\.[jt]sx?$|\.d\.ts$|\.test\.[jt]sx?$|\.spec\.[jt]sx?$/i

  const cssFiles  = files.filter(([n]) => n.endsWith(".css"))
  const htmlFiles = files.filter(([n]) => n.endsWith(".html"))
  const jsFiles   = files.filter(([n]) =>
    (n.endsWith(".js") || n.endsWith(".jsx") || n.endsWith(".ts") || n.endsWith(".tsx")) &&
    !CONFIG_FILE_RE.test(n)
  )

  const cssContent = cssFiles.map(([, c]) => c).join("\n")

  if (!isReactProject(jsFiles)) {
    const baseHtml = htmlFiles.length > 0
      ? (htmlFiles.find(([n]) => n === "index.html") || htmlFiles[0])[1]
      : null

    const jsContent = jsFiles.map(([, c]) => c).join("\n\n")

    if (baseHtml) {
      let html = baseHtml
        .replace(/<script[^>]+type=["']module["'][^>]*>\s*<\/script>/gi, "")
        .replace(/<script[^>]+src=["'][^"']*(?:\/src\/|\.\/src\/)[^"']*["'][^>]*>\s*<\/script>/gi, "")
      if (cssContent)   html = html.replace("</head>", `<style>${cssContent}</style></head>`)
      if (jsContent)    html = html.replace("</body>", `<script>\n${jsContent}\n</script>\n</body>`)
      return html
    }

    return `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>*, *::before, *::after { box-sizing: border-box; } body { margin: 0; font-family: sans-serif; } ${cssContent}</style>
</head><body>
  <script>\n${jsContent}\n</script>
</body></html>`
  }

  if (jsFiles.length === 0) {
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;color:#666">${cssContent || "No previewable files found."}</body></html>`
  }

  const mainComponent = findMainComponentName(jsFiles)
  const sorted = sortByDependency(jsFiles)
  const combined = sorted.map(([, code]) => stripImportsForPreview(code)).join("\n\n")
  const usesTailwind = /className=/.test(combined) && /(flex|grid|text-[a-z]|bg-[a-z]|p-\d|m-\d|w-\d|h-\d)/.test(combined)
  const { cdnTags, varLines } = buildPkgPreamble(jsFiles)

  const reactPreamble = [
    "var {",
    "  useState, useEffect, useRef, useCallback, useMemo, useContext,",
    "  useReducer, useLayoutEffect, useId, useTransition, useDeferredValue,",
    "  createContext, forwardRef, memo, Fragment, Children, cloneElement,",
    "  createElement, StrictMode, Suspense, lazy",
    "} = React;",
    "var { createRoot, hydrateRoot } = ReactDOM;",
    varLines,
  ].filter(Boolean).join("\n")

  const renderCall = [
    ";(function() {",
    '  var __root = document.getElementById("root");',
    `  var __comp = typeof ${mainComponent} !== "undefined" ? ${mainComponent} : null;`,
    "  if (!__comp) {",
    `    __root.innerHTML = '<div style="padding:24px;color:#888;font-family:sans-serif">` +
      `No <strong>${mainComponent}</strong> component found to render.</div>';`,
    "    return;",
    "  }",
    "  try {",
    "    ReactDOM.createRoot(__root).render(React.createElement(__comp));",
    "  } catch(renderErr) {",
    '    __root.innerHTML = \'<pre style="padding:20px;color:#c00">\' + renderErr.message + \'</pre>\';',
    "  }",
    "})();",
  ].join("\n")

  const escapedCombined = JSON.stringify(combined)
  const escapedPreamble = JSON.stringify(reactPreamble)
  const escapedRender   = JSON.stringify(renderCall)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  ${usesTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ""}
${cdnTags}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #__preview-error {
      display: none; padding: 20px; margin: 0;
      color: #c00; background: #fff5f5;
      font-family: monospace; font-size: 13px;
      white-space: pre-wrap; border-left: 4px solid #c00;
    }
    ${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  <pre id="__preview-error"></pre>
  <script>
  function __showError(label, msg) {
    var el = document.getElementById("__preview-error");
    el.style.display = "block";
    el.textContent = label + ":\\n" + msg;
  }

  window.addEventListener("error", function(e) {
    __showError("Runtime Error", e.message + (e.filename ? " (" + e.lineno + ":" + e.colno + ")" : ""));
  });

  window.addEventListener("load", function() {
    var userCode   = ${escapedCombined};
    var preamble   = ${escapedPreamble};
    var renderCall = ${escapedRender};
    var fullCode   = preamble + "\\n\\n" + userCode + "\\n\\n" + renderCall;

    var transformed;
    try {
      transformed = Babel.transform(fullCode, {
        filename: "preview.tsx",
        presets: [
          ["react",      { runtime: "classic" }],
          ["typescript", { allExtensions: true, isTSX: true }]
        ]
      }).code;
    } catch (babelErr) {
      __showError("Compilation Error", babelErr.message);
      return;
    }

    try {
      var fn = new Function("React", "ReactDOM", transformed);
      fn(React, ReactDOM);
    } catch (execErr) {
      document.getElementById("root").style.display = "none";
      __showError("Execution Error", execErr.message);
    }
  });
  </script>
</body>
</html>`
}

// ─── Preview Modal ────────────────────────────────────────────

export { IDEModal as PreviewModal } from "./IDEModal"

// ─── File Icon ────────────────────────────────────────────────

function FileIcon({ filename, className = "w-3 h-3" }: { filename: string; className?: string }) {
  const ext = filename.split(".").pop()?.toLowerCase()
  if (ext === "json") return <FileJson className={className} />
  if (ext === "ts" || ext === "tsx" || ext === "js" || ext === "jsx") return <Braces className={className} />
  if (ext === "md" || ext === "txt") return <FileText className={className} />
  return <FileCode className={className} />
}

// ─── Agent accent map ─────────────────────────────────────────

const AGENT_ACCENT: Record<string, {
  label: string
  borderColor: string
  textColor: string
  tabBorder: string
}> = {
  "Frontend Agent": {
    label: "Frontend Agent",
    borderColor: "border-l-emerald-500",
    textColor: "text-emerald-400",
    tabBorder: "border-b-emerald-500",
  },
  "Backend Agent": {
    label: "Backend Agent",
    borderColor: "border-l-blue-500",
    textColor: "text-blue-400",
    tabBorder: "border-b-blue-500",
  },
  "Review Agent": {
    label: "Review Agent",
    borderColor: "border-l-purple-500",
    textColor: "text-purple-400",
    tabBorder: "border-b-purple-500",
  },
  "Orchestrator Agent": {
    label: "Orchestrator",
    borderColor: "border-l-primary",
    textColor: "text-primary",
    tabBorder: "border-b-primary",
  },
}

// ─── Intent Badge ─────────────────────────────────────────────

const IntentBadge: FC<{ intent: string }> = ({ intent }) => {
  const map: Record<string, { label: string; cls: string }> = {
    build:   { label: "BUILD",   cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    iterate: { label: "ITERATE", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    debug:   { label: "DEBUG",   cls: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  }
  const c = map[intent] ?? map.build
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${c.cls}`}>
      {c.label}
    </span>
  )
}

// ─── VS Code Tab Bar ──────────────────────────────────────────

// ─── Diff percentage helper ──────────────────────────────────

function computeDiffPercent(oldCode: string | undefined, newCode: string): number | null {
  if (!oldCode) return null
  const oldLines = oldCode.split("\n")
  const newLines = newCode.split("\n")
  const oldSet = new Set(oldLines)
  let changed = 0
  for (const line of newLines) {
    if (!oldSet.has(line)) changed++
  }
  const total = Math.max(oldLines.length, newLines.length, 1)
  return Math.round((changed / total) * 100)
}

interface VSCodeTabsProps {
  files: [string, string][]
  activeTab: number
  onSelectTab: (i: number) => void
  accentClass?: string
  diffPercents?: (number | null)[]
}

const VSCodeTabs: FC<VSCodeTabsProps> = ({
  files, activeTab, onSelectTab, accentClass = "border-b-primary", diffPercents,
}) => (
  <div className="flex overflow-x-auto tab-bar bg-[#080808] border-b border-white/[0.04] flex-shrink-0 min-h-[34px]">
    {files.map(([filename], i) => {
      const pct = diffPercents?.[i]
      return (
        <button
          key={filename}
          onClick={() => onSelectTab(i)}
          title={filename}
          className={`group flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium whitespace-nowrap
            border-r border-white/[0.04] flex-shrink-0 transition-colors relative
            ${activeTab === i
              ? `bg-[#0d1117] text-white/80 border-b-2 ${accentClass}`
              : "text-white/25 hover:text-white/40 hover:bg-white/[0.02]"
            }`}
        >
          <FileIcon
            filename={filename}
            className={`w-3 h-3 flex-shrink-0 ${activeTab === i ? "text-white/40" : "text-white/15"}`}
          />
          <span className="max-w-[120px] truncate">{filename}</span>
          {pct != null && pct > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
              pct > 50 ? "bg-orange-500/15 text-orange-400/80" : pct > 20 ? "bg-yellow-500/15 text-yellow-400/80" : "bg-emerald-500/15 text-emerald-400/80"
            }`}>
              {pct}%
            </span>
          )}
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); downloadFile(filename, files[i][1]) }}
            className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary/70"
            title={`Download ${filename}`}
          >
            <Download className="w-2.5 h-2.5" />
          </span>
        </button>
      )
    })}
  </div>
)

// ─── Code Files Panel (collapsed by default) ─────────────────

const CodeFilesDisplay: FC<{ data: any; label: string; previousData?: any; intent?: string }> = ({ data, label, previousData, intent }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  if (!data || typeof data !== "object") return null
  const files = Object.entries(data).filter(([, v]) => typeof v === "string") as [string, string][]
  if (files.length === 0) return null

  const isDebug = intent === "debug"
  const diffPercents = isDebug ? files.map(([name, content]) => computeDiffPercent(previousData?.[name], content)) : undefined

  const isFrontend = label === "Frontend"
  const accentTabBorder = isFrontend ? "border-b-emerald-500" : "border-b-blue-500"
  const accentText = isFrontend ? "text-emerald-400/70" : "text-blue-400/70"
  const accentBg = isFrontend ? "bg-emerald-500/[0.04]" : "bg-blue-500/[0.04]"
  const accentBorder = isFrontend ? "border-emerald-500/10" : "border-blue-500/10"

  const handleCopyActive = async () => {
    try { await navigator.clipboard.writeText(files[activeTab]?.[1] ?? ""); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { }
  }
  const handleDownloadAll = () =>
    downloadZip(files.map(([name, content]) => ({ name, content })), `${label.toLowerCase()}-files.zip`)

  const handlePreviewToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!showPreview) {
      setIsExpanded(true)
      setShowPreview(true)
      // Generate and inject preview HTML
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.srcdoc = generatePreviewHTML(files)
        }
      }, 50)
    } else {
      setShowPreview(false)
    }
  }

  return (
    <div className="mt-2">
      {/* Header — click to expand code */}
      <button
        onClick={() => setIsExpanded(e => !e)}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border ${accentBorder} ${accentBg} transition-all hover:bg-white/[0.04] group`}
      >
        <Code2 className={`w-3.5 h-3.5 ${accentText}`} />
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${accentText}`}>
          {label}
        </span>
        <span className="text-[10px] text-white/20 font-mono">{files.length} files</span>
        <div className="ml-auto flex items-center gap-2">
          {isFrontend && (
            <span
              role="button"
              onClick={handlePreviewToggle}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border transition-colors ${
                showPreview
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                  : "text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/10 hover:border-emerald-500/30"
              }`}
            >
              <Monitor className="w-3 h-3" />
              Preview
            </span>
          )}
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); handleDownloadAll() }}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-white/20 hover:text-primary/70 hover:bg-primary/[0.06] transition-colors"
          >
            <Archive className="w-3 h-3" />
            ZIP
          </span>
          <ChevronRight className={`w-3.5 h-3.5 text-white/15 chevron-rotate ${isExpanded ? "open" : ""}`} />
        </div>
      </button>

      {/* Expanded: code + optional inline preview */}
      <Collapse open={isExpanded}>
        <div className="mt-1">
          {/* Inline preview */}
          {showPreview && isFrontend && (
            <div className="mb-1 rounded-lg overflow-hidden border border-emerald-500/10">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-base)] border-b border-emerald-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
                <span className="text-[10px] text-emerald-400/60 font-semibold">Live Preview</span>
                <span className="text-[10px] text-white/15">Frontend only</span>
                <button
                  onClick={() => setShowPreview(false)}
                  className="ml-auto text-[10px] text-white/20 hover:text-white/40 transition-colors"
                >
                  Hide
                </button>
              </div>
              <iframe
                ref={iframeRef}
                sandbox="allow-scripts"
                className="w-full bg-white border-0"
                style={{ height: 360 }}
                title="Inline Preview"
              />
            </div>
          )}

          {/* Code tabs + block */}
          <div className="rounded-lg overflow-hidden border border-white/[0.04]">
            <VSCodeTabs files={files} activeTab={activeTab} onSelectTab={setActiveTab} accentClass={accentTabBorder} diffPercents={diffPercents} />

            {files[activeTab] && (
              <div className="relative bg-[var(--surface-base)]">
                <div className="absolute top-0 right-0 flex items-center gap-1 p-2 z-10">
                  <button
                    onClick={handleCopyActive}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] bg-white/[0.04] hover:bg-white/[0.08] text-white/25 hover:text-white/70 rounded transition-all border border-white/[0.05]"
                  >
                    {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <CodeBlock code={files[activeTab][1]} filename={files[activeTab][0]} />
              </div>
            )}
          </div>
        </div>
      </Collapse>
    </div>
  )
}

// ─── Combined Frontend + Backend Card ─────────────────────────

export const CombinedCodeCard: FC<{
  frontendData: any
  backendData: any
  intent?: string
  allMessages?: Message[]
  frontendContent?: string
  backendContent?: string
}> = ({ frontendData, backendData, intent, allMessages, frontendContent, backendContent }) => {
  const prevFrontend = allMessages?.filter(m => m.type === "frontend").slice(-2, -1)[0]?.data
  const prevBackend = allMessages?.filter(m => m.type === "backend").slice(-2, -1)[0]?.data

  return (
    <div className="w-full max-w-3xl animate-bubble-in px-2 md:px-0">
      <div className="rounded-2xl border border-white/[0.10] bg-[var(--surface-raised)] overflow-hidden shadow-elevation-1">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[13px] font-semibold tracking-[-0.02em] text-emerald-400">Frontend</span>
            </div>
            <span className="text-white/10">+</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-[13px] font-semibold tracking-[-0.02em] text-blue-400">Backend</span>
            </div>
          </div>
          {intent && <IntentBadge intent={intent} />}
        </div>

        {/* Body — side by side */}
        <div className="p-4">
          {(frontendContent || backendContent) && (
            <p className="text-[14px] font-medium text-white/80 leading-[1.6] tracking-[-0.01em] mb-3">
              {formatText(frontendContent || backendContent || "")}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {frontendData && <CodeFilesDisplay data={frontendData} label="Frontend" intent={intent} previousData={prevFrontend} />}
            {backendData && <CodeFilesDisplay data={backendData} label="Backend" intent={intent} previousData={prevBackend} />}
          </div>
        </div>
      </div>
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

const ReviewDisplay: FC<{ data: ReviewData }> = ({ data }) => {
  const [tab, setTab] = useState<"status" | "setup" | "review">("status")

  return (
    <div className="mt-3 space-y-2">
      {/* Tab bar */}
      <div className="flex gap-px border-b border-white/[0.06]">
        {(["status", "setup", "review"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wider transition-colors
              ${tab === t
                ? "text-gold-500/80 border-b-2 border-b-gold-500 -mb-px"
                : "text-white/30 hover:text-white/50"
              }`}
          >
            {t === "status" ? "Status" : t === "setup" ? "Setup Guide" : "Code Review"}
          </button>
        ))}
      </div>

      {tab === "status" && (
        <div className="space-y-2.5">
          <div className="flex gap-2">
            {(["frontendComplete", "backendComplete"] as const)
              .filter(k => {
                // Only show Backend badge if there are actual backend run commands
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
                {data.completionStatus?.[k]
                  ? <CheckCircle2 className="w-3 h-3" />
                  : <XCircle className="w-3 h-3" />}
                {k === "frontendComplete" ? "Frontend" : "Backend"}
              </span>
            ))}
          </div>
          {data.completionStatus?.missingItems?.length > 0 && (
            <div className="rounded-lg border border-orange-500/10 bg-orange-500/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-400/50 mb-1.5">Missing</p>
              <ul className="space-y-1">
                {data.completionStatus.missingItems.map((item, i) => (
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

      {tab === "setup" && (
        <div className="space-y-2.5">
          {data.setupGuide?.prerequisites?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">Prerequisites</p>
              <ul className="space-y-1">
                {data.setupGuide.prerequisites.map((req, i) => (
                  <li key={i} className="text-[11px] text-white/60 flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/15 mt-1.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.setupGuide?.steps?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">Steps</p>
              <ol className="space-y-1">
                {data.setupGuide.steps.map((step, i) => (
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
                {(["frontend", "backend"] as const).map(side => (
                  <div key={side} className="bg-[var(--surface-base)] rounded-lg p-2.5 border border-white/[0.04]">
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${side === "frontend" ? "text-emerald-500/50" : "text-blue-500/50"}`}>{side}</p>
                    <p className="text-[11px] font-mono text-white/70">
                      <span className={side === "frontend" ? "text-emerald-500/40 mr-1" : "text-blue-500/40 mr-1"}>$</span>
                      {data.setupGuide.runCommands[side]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "review" && (
        <div className="space-y-2">
          {data.codeReview?.issues?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-400/60 mb-1.5">Issues</p>
              {data.codeReview.issues.map((issue, i) => (
                <div key={i} className="rounded-lg border border-orange-500/10 bg-orange-500/[0.03] px-3 py-2 mb-1.5 text-[11px] text-orange-300/60">{issue}</div>
              ))}
            </div>
          )}
          {data.codeReview?.suggestions?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400/60 mb-1.5">Suggestions</p>
              {data.codeReview.suggestions.map((sug, i) => (
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

// ─── Streaming Dropdown ───────────────────────────────────────

export const StreamingDropdown: FC<{
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

  const ac = AGENT_ACCENT[agent] ?? AGENT_ACCENT["Orchestrator Agent"]

  let parsedFiles: [string, string][] | null = null
  if (!isActive) {
    try {
      const m = content.match(/\{[\s\S]*\}/)
      if (m) {
        const p = JSON.parse(m[0])
        if (typeof p === "object" && p !== null)
          parsedFiles = Object.entries(p).filter(([, v]) => typeof v === "string") as [string, string][]
      }
    } catch { }
  }

  const handleDownloadAll = () => {
    if (!parsedFiles) return
    downloadZip(parsedFiles.map(([name, content]) => ({ name, content })), `${agent.toLowerCase().replace(/ /g, "-")}-files.zip`)
  }


  return (
    <>
    <div className="w-full flex justify-start animate-bubble-in px-2 md:px-0">
      <div className="flex-1 max-w-[92%] min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setIsOpen(o => !o)}
            className="flex items-center gap-2.5 group"
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isActive ? "animate-agent-pulse" : ""
            } ${ac.borderColor.replace("border-l-", "bg-")}`} />
            <span className={`text-[13px] font-semibold tracking-[-0.02em] ${ac.textColor} opacity-80 group-hover:opacity-100 transition-opacity`}>
              {ac.label}
            </span>
            {isActive && <Loader2 className="w-3 h-3 animate-spin text-white/20" />}
            <ChevronRight className={`w-3.5 h-3.5 text-white/15 chevron-rotate ${isOpen ? "open" : ""}`} />
          </button>

          <div className="ml-auto flex items-center gap-2">
            {tokenUsage ? (
              <span className="text-[10px] font-mono text-white/20">
                {tokenUsage.totalTokens.toLocaleString()} tokens
              </span>
            ) : isActive && liveEstimate && liveEstimate > 0 ? (
              <span className="text-[10px] font-mono text-white/25 animate-pulse">
                ~{liveEstimate.toLocaleString()} tokens
              </span>
            ) : parsedFiles ? (
              <span className="text-[10px] text-white/20 font-mono">
                {parsedFiles.length} file{parsedFiles.length !== 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
        </div>

        {/* Body */}
        <Collapse open={isOpen}>
          <div className="rounded-2xl border border-white/[0.10] overflow-hidden bg-[var(--surface-raised)] shadow-elevation-1">
            {parsedFiles && parsedFiles.length > 0 ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-base)] border-b border-white/[0.08]">
                  <span className="text-[11px] text-white/35 font-medium flex-1">
                    {parsedFiles.length} files generated
                  </span>
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
                  >
                    <Archive className="w-3 h-3" /> ZIP
                  </button>
                </div>
                <VSCodeTabs
                  files={parsedFiles}
                  activeTab={activeTab}
                  onSelectTab={setActiveTab}
                  accentClass={ac.tabBorder}
                />
                {parsedFiles[activeTab] && (
                  <div className="relative bg-[var(--surface-base)]">
                    <button
                      onClick={() => downloadFile(parsedFiles![activeTab][0], parsedFiles![activeTab][1])}
                      className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-[10px] bg-white/[0.04] hover:bg-white/[0.08] text-white/25 hover:text-white/70 rounded transition-all border border-white/[0.05]"
                    >
                      <Download className="w-3 h-3" /> Save
                    </button>
                    <CodeBlock code={parsedFiles[activeTab][1]} filename={parsedFiles[activeTab][0]} className="pt-9 max-h-[400px]" />
                  </div>
                )}
              </>
            ) : (
              <div className="px-4 py-3.5">
                {isActive ? (
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/25 typing-dot" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/25 typing-dot" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/25 typing-dot" />
                    </div>
                    <span className="text-[12px] font-medium text-white/25">Generating... ({Math.ceil(content.length / 4).toLocaleString()} tokens)</span>
                  </div>
                ) : (
                  <span className="text-[12px] font-medium text-white/35">Processing output...</span>
                )}
              </div>
            )}
          </div>
        </Collapse>
      </div>
    </div>
    </>
  )
}

// ─── Markdown formatter ───────────────────────────────────────

const formatText = (text: string): ReactNode => {
  if (!text) return null
  const lines = text.split("\n")
  return lines.map((line, idx) => {
    const parts: ReactNode[] = []
    let last = 0
    const re = /\*\*([^*]+)\*\*/g
    let m: RegExpExecArray | null
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) parts.push(line.slice(last, m.index))
      parts.push(<strong key={`b-${idx}-${m.index}`} className="font-semibold text-white/80">{m[1]}</strong>)
      last = m.index + m[0].length
    }
    if (last < line.length) parts.push(line.slice(last))
    return (
      <span key={idx}>
        {parts.length ? parts : line}
        {idx < lines.length - 1 && <br />}
      </span>
    )
  })
}

// ─── Message Card ─────────────────────────────────────────────

export type BubbleGroupPos = "solo" | "first" | "middle" | "last"

export const MessageCard: FC<{ message: Message; allMessages?: Message[]; onRetry?: () => void; groupPos?: BubbleGroupPos }> = memo(({ message, allMessages, onRetry, groupPos = "solo" }) => {

  const isUser = message.sender === "user"

  const agentKey = message.type === "orchestrator" ? "Orchestrator Agent"
    : message.type === "frontend" ? "Frontend Agent"
    : message.type === "backend"  ? "Backend Agent"
    : message.type === "review"   ? "Review Agent"
    : null

  const ac = agentKey ? AGENT_ACCENT[agentKey] : null

  const timestamp = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  // ── User message ──────────────────────────────────────────
  if (isUser) {
    // User bubble group shapes (mirrored — sharp corner on the right side)
    // solo:   sharp bottom-right
    // first:  sharp bottom-right
    // middle: all rounded
    // last:   sharp top-right
    const userRadius =
      groupPos === "first"  ? "rounded-tl-[16px] rounded-tr-[16px] rounded-bl-[16px] rounded-br-none" :
      groupPos === "middle" ? "rounded-[16px]" :
      groupPos === "last"   ? "rounded-tl-[16px] rounded-tr-none rounded-bl-[16px] rounded-br-[16px]" :
                              "rounded-tl-[16px] rounded-tr-[16px] rounded-bl-[16px] rounded-br-none"

    const showTimestamp = groupPos === "solo" || groupPos === "last"
    const tightenGap = groupPos === "middle" || groupPos === "last"

    return (
      <div className={`w-full flex justify-end animate-bubble-in-right px-2 md:px-0 ${tightenGap ? "-mt-2" : ""}`}>
        <div className="max-w-[80%] md:max-w-[65%]">
          <div className={`bg-gradient-to-br from-[#ede4cc] to-[#e5e0d0] shadow-elevation-1 ${userRadius} px-4 py-3`}>
            <p className="text-[16px] font-medium text-[#1a1814] leading-[1.4] tracking-[-0.16px] break-words whitespace-pre-wrap">{formatText(message.content)}</p>
          </div>
          {showTimestamp && (
            <div className="flex justify-end mt-1 pr-1">
              <span className="text-[10px] text-white/30 font-medium">{timestamp}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Error message ──────────────────────────────────────────
  if (message.type === "error") {
    const errorRadius =
      groupPos === "first"  ? "rounded-tl-[16px] rounded-tr-[16px] rounded-br-[16px] rounded-bl-none" :
      groupPos === "middle" ? "rounded-[16px]" :
      groupPos === "last"   ? "rounded-tl-none rounded-tr-[16px] rounded-br-[16px] rounded-bl-[16px]" :
                              "rounded-tl-[16px] rounded-tr-[16px] rounded-br-[16px] rounded-bl-none"
    const errorTighten = groupPos === "middle" || groupPos === "last"

    return (
      <div className={`flex items-center gap-2.5 w-full animate-bubble-in px-2 md:px-0 ${errorTighten ? "-mt-2" : ""}`}>
        <div className={`flex items-start gap-3 px-4 py-3 ${errorRadius} bg-white/[0.08] border border-red-500/10 max-w-lg`}>
          <div className="w-2 h-2 rounded-full bg-red-500/60 mt-1.5 flex-shrink-0" />
          <p className="text-[13px] font-medium text-red-400/80 leading-relaxed">{message.content}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="group flex items-center gap-0 h-8 rounded-lg bg-[#111] hover:bg-[#181818] border border-white/[0.12] hover:border-[#333] text-white/25 hover:text-white/50 transition-all flex-shrink-0 px-2 hover:px-3 hover:gap-1.5 overflow-hidden"
          >
            <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-[13px] font-semibold tracking-[-0.02em] max-w-0 group-hover:max-w-[60px] overflow-hidden whitespace-nowrap transition-all duration-200">
              Retry
            </span>
          </button>
        )}
      </div>
    )
  }

  // ── Status message ──────────────────────────────────────────
  if (message.type === "status") {
    return (
      <div className="flex justify-start w-full animate-bubble-in px-2 md:px-0">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#111] border border-white/[0.08]">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white/30 typing-dot" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30 typing-dot" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30 typing-dot" />
          </div>
          <span className="text-[13px] text-white/35 font-medium">{message.content}</span>
        </div>
      </div>
    )
  }

  // ── Agent message ──────────────────────────────────────────
  const labelColor = ac?.textColor ?? "text-white/40"
  const hasStructuredData = message.data && (message.type === "frontend" || message.type === "backend" || message.type === "review")

  // Simple text-only agent messages (system, completion, etc.)
  if (!hasStructuredData) {
    // Bubble shape based on group position for consecutive AI messages
    // solo:   sharp bottom-left (default)
    // first:  sharp bottom-left (points down to next)
    // middle: all corners rounded (no pointer)
    // last:   sharp top-left (points up to previous)
    const bubbleRadius =
      groupPos === "first"  ? "rounded-tl-[16px] rounded-tr-[16px] rounded-br-[16px] rounded-bl-none" :
      groupPos === "middle" ? "rounded-[16px]" :
      groupPos === "last"   ? "rounded-tl-none rounded-tr-[16px] rounded-br-[16px] rounded-bl-[16px]" :
                              "rounded-tl-[16px] rounded-tr-[16px] rounded-br-[16px] rounded-bl-none"

    const showTimestamp = groupPos === "solo" || groupPos === "last"
    const tightenGap = groupPos === "middle" || groupPos === "last"

    return (
      <div className={`flex justify-start w-full animate-bubble-in px-2 md:px-0 ${tightenGap ? "-mt-2" : ""}`}>
        <div className="max-w-[85%] md:max-w-[70%] min-w-0">
          {message.content && (
            <div className={`bg-white/[0.08] ${bubbleRadius} px-4 py-3`}>
              <p className="text-[16px] font-medium text-[#e5e5e5] leading-[1.4] tracking-[-0.16px]">
                {formatText(message.content)}
              </p>
            </div>
          )}
          {showTimestamp && (
            <div className="flex mt-1 pl-1">
              <span className="text-[10px] text-white/30 font-medium">{timestamp}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Structured agent output — wrapped in a card
  return (
    <div className="w-full max-w-3xl animate-bubble-in px-2 md:px-0">
      <div className="rounded-2xl border border-white/[0.10] bg-[var(--surface-raised)] overflow-hidden shadow-elevation-1">
        {/* Card header */}
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-1.5 h-1.5 rounded-full ${
              agentKey === "Frontend Agent" ? "bg-emerald-400" :
              agentKey === "Backend Agent" ? "bg-blue-400" :
              agentKey === "Review Agent" ? "bg-purple-400" :
              "bg-white/40"
            }`} />
            <span className={`text-[13px] font-semibold tracking-[-0.02em] ${labelColor}`}>
              {ac?.label ?? message.username}
            </span>
          </div>
          {message.intent && <IntentBadge intent={message.intent} />}
        </div>

        {/* Card body */}
        <div className="p-5">
          {message.content && (
            <p className="text-[14px] font-medium text-white/80 leading-[1.6] tracking-[-0.01em] mb-3">
              {formatText(message.content)}
            </p>
          )}

          {message.data && message.type === "frontend" && <CodeFilesDisplay data={message.data} label="Frontend" intent={message.intent} previousData={allMessages?.filter(m => m.type === "frontend" && m.id !== message.id).pop()?.data} />}
          {message.data && message.type === "backend" && <CodeFilesDisplay data={message.data} label="Backend" intent={message.intent} previousData={allMessages?.filter(m => m.type === "backend" && m.id !== message.id).pop()?.data} />}
          {message.data && message.type === "review" && <ReviewDisplay data={message.data} />}
        </div>
      </div>
    </div>
  )
})
