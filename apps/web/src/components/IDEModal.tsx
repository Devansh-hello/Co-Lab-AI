"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Editor from "@monaco-editor/react"
import {
  Monitor, X,
  Code2, Columns2, ChevronRight,
  FolderOpen, Folder, FileCode, FileText, FileJson, Braces,
  Play, Maximize2, Terminal, Loader2, Server, Send, Zap,
} from "lucide-react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { Collapse } from "./Collapse"
import { generatePreviewHTML } from "./messageCard"
import { useWebContainer, type ContainerStatus } from "../hooks/useWebContainer"

// ─── File tree types & builder ────────────────────────────────

interface TreeNode {
  name: string
  path: string
  isDir: boolean
  children?: TreeNode[]
}

function buildTree(files: [string, string][]): TreeNode[] {
  interface DirEntry  { isDir: true;  children: Record<string, DirEntry | FileEntry> }
  interface FileEntry { isDir: false; fullPath: string }
  type AnyEntry = DirEntry | FileEntry

  const root: Record<string, AnyEntry> = {}

  for (const [path] of files) {
    const parts = path.replace(/^\.\//, "").split("/")
    let cur = root
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i]
      if (!cur[p]) cur[p] = { isDir: true, children: {} }
      cur = (cur[p] as DirEntry).children
    }
    cur[parts[parts.length - 1]] = { isDir: false, fullPath: path }
  }

  function toNodes(obj: Record<string, AnyEntry>, prefix: string): TreeNode[] {
    const dirs: TreeNode[] = []
    const fils: TreeNode[] = []
    for (const [name, entry] of Object.entries(obj)) {
      const logical = prefix ? `${prefix}/${name}` : name
      if (entry.isDir) {
        dirs.push({ name, path: logical, isDir: true, children: toNodes(entry.children, logical) })
      } else {
        fils.push({ name, path: entry.fullPath, isDir: false })
      }
    }
    return [
      ...dirs.sort((a, b) => a.name.localeCompare(b.name)),
      ...fils.sort((a, b) => a.name.localeCompare(b.name)),
    ]
  }

  return toNodes(root, "")
}

// ─── Helpers ──────────────────────────────────────────────────

function monacoLang(filename: string): string {
  if (filename.endsWith(".tsx") || filename.endsWith(".ts")) return "typescript"
  if (filename.endsWith(".jsx") || filename.endsWith(".js")) return "javascript"
  if (filename.endsWith(".css"))  return "css"
  if (filename.endsWith(".html") || filename.endsWith(".htm")) return "html"
  if (filename.endsWith(".json")) return "json"
  if (filename.endsWith(".md") || filename.endsWith(".mdx")) return "markdown"
  return "plaintext"
}

function FileIcon({ filename, className = "w-3.5 h-3.5" }: { filename: string; className?: string }) {
  const ext = filename.split(".").pop()?.toLowerCase()
  if (ext === "json") return <FileJson className={className} />
  if (["ts", "tsx", "js", "jsx"].includes(ext ?? "")) return <Braces className={className} />
  if (["md", "txt"].includes(ext ?? "")) return <FileText className={className} />
  return <FileCode className={className} />
}

// ─── File tree node ───────────────────────────────────────────

const TreeItem: React.FC<{
  node: TreeNode
  selectedFile: string
  expandedDirs: Set<string>
  modifiedFiles: Set<string>
  depth: number
  onSelectFile: (p: string) => void
  onToggleDir: (p: string) => void
}> = ({ node, selectedFile, expandedDirs, modifiedFiles, depth, onSelectFile, onToggleDir }) => {
  const isExpanded = expandedDirs.has(node.path)
  const isSelected = !node.isDir && selectedFile === node.path
  const isModified = modifiedFiles.has(node.path)
  const pl = depth * 12 + 12

  if (node.isDir) {
    return (
      <>
        <button
          onClick={() => onToggleDir(node.path)}
          className="flex items-center gap-1.5 w-full text-left py-1.5 text-[12px] text-white/50 hover:text-white/70 hover:bg-white/[0.03] transition-colors select-none"
          style={{ paddingLeft: pl, paddingRight: 8 }}
        >
          <ChevronRight className={`w-3 h-3 flex-shrink-0 text-white/20 chevron-rotate ${isExpanded ? "open" : ""}`} />
          {isExpanded
            ? <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-amber-400/60" />
            : <Folder     className="w-3.5 h-3.5 flex-shrink-0 text-amber-400/40" />}
          <span className="truncate font-medium">{node.name}</span>
        </button>
        <Collapse open={isExpanded}>
          <div>
            {node.children?.map(child => (
              <TreeItem
                key={child.path}
                node={child}
                selectedFile={selectedFile}
                expandedDirs={expandedDirs}
                modifiedFiles={modifiedFiles}
                depth={depth + 1}
                onSelectFile={onSelectFile}
                onToggleDir={onToggleDir}
              />
            ))}
          </div>
        </Collapse>
      </>
    )
  }

  return (
    <button
      onClick={() => onSelectFile(node.path)}
      className={`flex items-center gap-1.5 w-full text-left py-1.5 text-[12px] transition-all select-none ${
        isSelected
          ? "bg-white/[0.06] text-white/90"
          : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
      }`}
      style={{ paddingLeft: pl + 16, paddingRight: 8 }}
    >
      <FileIcon
        filename={node.name}
        className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-emerald-400/60" : "text-white/20"}`}
      />
      <span className="truncate flex-1 font-medium">{node.name}</span>
      {isModified && (
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400/70 flex-shrink-0 ml-1" title="Unsaved" />
      )}
    </button>
  )
}

// ─── IDE Modal ────────────────────────────────────────────────

const STATUS_LABELS: Record<ContainerStatus, string> = {
  idle: "Ready",
  booting: "Booting container...",
  mounting: "Mounting files...",
  installing: "Installing dependencies...",
  starting: "Starting servers...",
  running: "Running",
  error: "Error",
}

export const IDEModal: React.FC<{
  files: [string, string][]
  backendFiles?: [string, string][]
  title?: string
  onClose: () => void
}> = ({ files: initialFiles, backendFiles: initialBackendFiles, title = "Preview", onClose }) => {
  // Merge frontend + backend files with prefixes when both exist
  const hasBackend = !!initialBackendFiles && initialBackendFiles.length > 0
  const allFiles = useMemo(() => {
    if (!hasBackend) return initialFiles
    return [
      ...initialFiles.map(([name, content]) => [`frontend/${name}`, content] as [string, string]),
      ...initialBackendFiles!.map(([name, content]) => [`backend/${name}`, content] as [string, string]),
    ]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const originalContents = useMemo(() => Object.fromEntries(allFiles), [])

  const [fileContents, setFileContents] = useState<Record<string, string>>(() =>
    Object.fromEntries(allFiles)
  )
  const [selectedFile, setSelectedFile] = useState<string>(
    allFiles.find(([n]) => /app\.[jt]sx?$/i.test(n))?.[0] ??
    allFiles[0]?.[0] ?? ""
  )
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const [view, setView] = useState<"editor" | "split" | "preview">(isMobile ? "preview" : "split")
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewKey, setPreviewKey] = useState(0)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => {
    const dirs = new Set<string>()
    for (const [path] of allFiles) {
      const parts = path.split("/")
      for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join("/"))
    }
    return dirs
  })
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  // WebContainer state
  const [fullStackMode, setFullStackMode] = useState(hasBackend)
  const [showTerminal, setShowTerminal] = useState(false)
  const wc = useWebContainer()

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [wc.terminalOutput])

  // API tester state
  const [previewTab, setPreviewTab] = useState<"app" | "api">("app")
  const [apiMethod, setApiMethod] = useState("GET")
  const [apiPath, setApiPath] = useState("/api/")
  const [apiBody, setApiBody] = useState("")
  const [apiResponse, setApiResponse] = useState<{ status: number; body: string; time: number } | null>(null)
  const [apiLoading, setApiLoading] = useState(false)

  const sendApiRequest = useCallback(async () => {
    if (!wc.backendUrl) return
    setApiLoading(true)
    const start = Date.now()
    try {
      // Run fetch inside the WebContainer to avoid cross-origin issues
      const bodyArg = apiMethod !== "GET" && apiMethod !== "HEAD" && apiBody.trim()
        ? `, body: ${JSON.stringify(apiBody)}`
        : ''
      const script = `
        fetch("http://localhost:3000${apiPath}", {
          method: "${apiMethod}",
          headers: { "Content-Type": "application/json" }${bodyArg}
        })
        .then(async r => {
          const text = await r.text();
          process.stdout.write(JSON.stringify({ status: r.status, body: text }));
        })
        .catch(e => {
          process.stdout.write(JSON.stringify({ status: 0, body: "Error: " + e.message }));
        });
      `
      let result = ''
      const proc = await wc.runInContainer('node', ['-e', script])
      if (proc) {
        result = proc
      }
      try {
        const parsed = JSON.parse(result)
        let body = parsed.body
        try { body = JSON.stringify(JSON.parse(body), null, 2) } catch { /* raw */ }
        setApiResponse({ status: parsed.status, body, time: Date.now() - start })
      } catch {
        setApiResponse({ status: 0, body: result || 'No response', time: Date.now() - start })
      }
    } catch (err: any) {
      setApiResponse({ status: 0, body: `Error: ${err.message}`, time: Date.now() - start })
    }
    setApiLoading(false)
  }, [wc.backendUrl, apiMethod, apiPath, apiBody, wc])

  const handleFullStackRun = useCallback(() => {
    const frontendMap = Object.fromEntries(initialFiles)
    const backendMap = initialBackendFiles ? Object.fromEntries(initialBackendFiles) : {}
    setShowTerminal(true)
    wc.boot(frontendMap, backendMap)
  }, [initialFiles, initialBackendFiles, wc])

  const fileEntries = useMemo(
    () => Object.entries(fileContents) as [string, string][],
    [fileContents]
  )

  const modifiedFiles = useMemo(() => {
    const s = new Set<string>()
    for (const [p, c] of fileEntries) { if (c !== originalContents[p]) s.add(p) }
    return s
  }, [fileEntries, originalContents])

  const refresh = useCallback(() => {
    const html = generatePreviewHTML(fileEntries)
    setPreviewHtml(html)
    setPreviewKey(k => k + 1)
  }, [fileEntries])

  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (iframeRef.current && previewHtml) iframeRef.current.srcdoc = previewHtml
  }, [previewHtml, previewKey])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); refresh() }
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [refresh, onClose])

  const tree = useMemo(() => buildTree(fileEntries), [fileEntries])

  const openInNewTab = () => {
    const blob = new Blob([previewHtml], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const toggleDir = useCallback((path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path); else next.add(path)
      return next
    })
  }, [])

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (selectedFile && value !== undefined)
      setFileContents(prev => ({ ...prev, [selectedFile]: value }))
  }, [selectedFile])

  const handleMonacoMount = useCallback((_editor: unknown, monaco: any) => {
    const opts = { noSemanticValidation: true, noSyntaxValidation: false }
    const cOpts = {
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true, allowSyntheticDefaultImports: true, allowNonTsExtensions: true,
    }
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(opts)
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(cOpts)
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(opts)
  }, [])

  // ── Sub-panes ─────────────────────────────────────────────────

  const editorPane = (
    <div className="h-full w-full overflow-hidden bg-[#0a0a0a]">
      <Editor
        path={selectedFile}
        language={monacoLang(selectedFile)}
        value={fileContents[selectedFile] ?? ""}
        onChange={handleEditorChange}
        onMount={handleMonacoMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "off",
          tabSize: 2,
          automaticLayout: true,
          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
          padding: { top: 16 },
          renderLineHighlight: "all",
          cursorBlinking: "smooth",
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
        }}
      />
    </div>
  )

  const previewPane = (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-2.5 px-4 py-2 bg-[#111] border-b border-[#2a2a2a] flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {fullStackMode && wc.status !== "idle" ? (
            <>
              <div className={`w-2 h-2 rounded-full ${wc.status === "running" ? "bg-emerald-400/50 animate-agent-pulse" : wc.status === "error" ? "bg-red-400/50" : "bg-amber-400/50 animate-pulse"}`} />
              <span className="text-[11px] text-emerald-400/70 font-semibold tracking-[-0.02em]">{STATUS_LABELS[wc.status]}</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
              <span className="text-[11px] text-emerald-400/70 font-semibold tracking-[-0.02em]">Live Preview</span>
            </>
          )}
        </div>
        {!fullStackMode && <span className="text-[11px] text-white/20 font-medium">Frontend only</span>}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Preview tab toggle — App vs API */}
          {fullStackMode && wc.backendUrl && (
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.04]">
              <button
                onClick={() => setPreviewTab("app")}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                  previewTab === "app" ? "bg-white/[0.08] text-white/70" : "text-white/25 hover:text-white/40"
                }`}
              >
                App
              </button>
              <button
                onClick={() => setPreviewTab("api")}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                  previewTab === "api" ? "bg-white/[0.08] text-white/70" : "text-white/25 hover:text-white/40"
                }`}
              >
                API
              </button>
            </div>
          )}
          {hasBackend && (
            <button
              onClick={() => setFullStackMode(m => !m)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                fullStackMode
                  ? "text-blue-400/70 bg-blue-500/[0.08] border border-blue-500/15"
                  : "text-white/25 hover:text-white/40 border border-transparent"
              }`}
            >
              <Server className="w-3 h-3" />
              Full-Stack
            </button>
          )}
        </div>
      </div>

      {/* Preview content — App iframe or API tester */}
      {previewTab === "api" && fullStackMode && wc.backendUrl ? (
        /* ── API Tester ─────────────────────────────── */
        <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden">
          {/* Request bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1c1c1c] flex-shrink-0">
            <select
              value={apiMethod}
              onChange={e => setApiMethod(e.target.value)}
              className="bg-[#111] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-[12px] font-mono font-bold text-white/70 outline-none"
            >
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <input
              value={apiPath}
              onChange={e => setApiPath(e.target.value)}
              placeholder="/api/..."
              onKeyDown={e => e.key === "Enter" && sendApiRequest()}
              className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-[13px] font-mono text-white/70 placeholder:text-white/20 outline-none focus:border-[#404040]"
            />
            <button
              onClick={sendApiRequest}
              disabled={apiLoading || !wc.backendUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-emerald-500/[0.10] text-emerald-400/80 border border-emerald-500/20 hover:bg-emerald-500/[0.15] disabled:opacity-40 transition-all"
            >
              {apiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Send
            </button>
          </div>

          {/* Request body (for POST/PUT/PATCH) */}
          {apiMethod !== "GET" && apiMethod !== "HEAD" && apiMethod !== "DELETE" && (
            <div className="border-b border-[#1c1c1c] flex-shrink-0">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/20">Body (JSON)</div>
              <textarea
                value={apiBody}
                onChange={e => setApiBody(e.target.value)}
                placeholder='{ "key": "value" }'
                className="w-full bg-transparent px-3 py-2 text-[12px] font-mono text-white/60 placeholder:text-white/15 outline-none resize-none h-20"
              />
            </div>
          )}

          {/* Response */}
          <div className="flex-1 overflow-y-auto chat-scroll">
            {apiResponse ? (
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                    apiResponse.status >= 200 && apiResponse.status < 300 ? "bg-emerald-500/10 text-emerald-400" :
                    apiResponse.status >= 400 ? "bg-red-500/10 text-red-400" :
                    "bg-amber-500/10 text-amber-400"
                  }`}>
                    {apiResponse.status || "ERR"}
                  </span>
                  <span className="text-[10px] text-white/20 font-mono">{apiResponse.time}ms</span>
                </div>
                <pre className="text-[12px] font-mono text-white/50 whitespace-pre-wrap break-all leading-relaxed">
                  {apiResponse.body}
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Zap className="w-6 h-6 text-white/10 mb-2" />
                <p className="text-[13px] text-white/20 font-medium">Send a request to test your API</p>
                <p className="text-[11px] text-white/10 mt-1">Enter an endpoint path and hit Send</p>
              </div>
            )}
          </div>
        </div>
      ) : fullStackMode && wc.previewUrl ? (
        <iframe
          src={wc.previewUrl}
          className="flex-1 w-full bg-white border-0"
          title="Full-Stack Preview"
        />
      ) : (
        <iframe
          key={previewKey}
          ref={iframeRef}
          sandbox="allow-scripts"
          className="flex-1 w-full bg-white border-0"
          title="App Preview"
        />
      )}
    </div>
  )

  const terminalPane = (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1c1c1c] flex-shrink-0">
        <Terminal className="w-3.5 h-3.5 text-white/25" />
        <span className="text-[11px] font-semibold text-white/30">Terminal</span>
        {wc.status !== "idle" && wc.status !== "running" && wc.status !== "error" && (
          <Loader2 className="w-3 h-3 animate-spin text-white/20 ml-1" />
        )}
      </div>
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 font-mono text-[12px] text-white/50 leading-relaxed chat-scroll"
      >
        {wc.terminalOutput.map((line, i) => (
          <div key={i} className={line.startsWith("$ ") ? "text-emerald-400/50 mt-1" : ""}>{line || "\u00A0"}</div>
        ))}
        {wc.error && <div className="text-red-400/70 mt-1">Error: {wc.error}</div>}
      </div>
    </div>
  )

  const lang = monacoLang(selectedFile).toUpperCase()
  const fileCount = fileEntries.length

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-overlay-in"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full h-full md:w-[96vw] md:h-[94vh] md:rounded-2xl overflow-hidden flex flex-col animate-popover-in"
        style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", boxShadow: "0 40px 120px rgba(0,0,0,0.8), 0 0 1px rgba(255,255,255,0.05)" }}
      >

        {/* ── Title bar ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-3 md:px-5 py-2.5 md:py-3 border-b border-[#1c1c1c] flex-shrink-0 select-none bg-[#0a0a0a]">

          {/* Left: title + file count */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <Monitor className="w-3.5 h-3.5 text-emerald-400/70" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-semibold text-white/80 tracking-[-0.02em] truncate">{title}</span>
              <span className="text-[10px] text-white/20 font-medium">{fileCount} files</span>
            </div>
          </div>

          {/* Center: view toggle */}
          <div className="flex items-center gap-0.5 mx-auto p-1 rounded-xl bg-[#111] border border-[#1c1c1c]">
            {([
              { id: "editor" as const,  icon: <Code2    className="w-3.5 h-3.5" />, label: "Code" },
              { id: "split" as const,   icon: <Columns2 className="w-3.5 h-3.5" />, label: "Split" },
              { id: "preview" as const, icon: <Monitor  className="w-3.5 h-3.5" />, label: "Preview" },
            ]).map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                title={label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-[-0.02em] transition-all duration-200 ${
                  view === id
                    ? "bg-white/[0.08] text-white/90 shadow-[0_0_10px_rgba(255,255,255,0.02)]"
                    : "text-white/25 hover:text-white/50 hover:bg-white/[0.03]"
                }`}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1">
            {fullStackMode ? (
              <button
                onClick={handleFullStackRun}
                disabled={wc.status === "booting" || wc.status === "installing" || wc.status === "starting"}
                title="Run full-stack (WebContainers)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-blue-400/50 hover:text-blue-400 hover:bg-blue-500/[0.06] border border-transparent hover:border-blue-500/15 transition-all disabled:opacity-40"
              >
                {wc.status !== "idle" && wc.status !== "running" && wc.status !== "error" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">{wc.status === "running" ? "Restart" : "Run"}</span>
              </button>
            ) : (
              <button
                onClick={refresh}
                title="Run preview (Ctrl+S)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/[0.06] border border-transparent hover:border-emerald-500/15 transition-all"
              >
                <Play className="w-3 h-3" />
                <span className="hidden sm:inline">Run</span>
              </button>
            )}
            {fullStackMode && (
              <button
                onClick={() => setShowTerminal(t => !t)}
                title="Toggle terminal"
                className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                  showTerminal ? "text-white/50 bg-white/[0.06]" : "text-white/20 hover:text-white/50 hover:bg-white/[0.04]"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={openInNewTab}
              title="Open in new tab"
              className="flex items-center justify-center w-7 h-7 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-5 bg-white/[0.06] mx-1" />
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Main area ─────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* File tree sidebar */}
          <div className="hidden md:flex w-52 min-w-[180px] bg-[#050505] border-r border-[#1c1c1c] flex-col overflow-hidden flex-shrink-0">
            <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/15 border-b border-[#1c1c1c] flex-shrink-0">
              Explorer
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-1 chat-scroll">
              {tree.map(node => (
                <TreeItem
                  key={node.path}
                  node={node}
                  selectedFile={selectedFile}
                  expandedDirs={expandedDirs}
                  modifiedFiles={modifiedFiles}
                  depth={0}
                  onSelectFile={setSelectedFile}
                  onToggleDir={toggleDir}
                />
              ))}
            </div>
          </div>

          {/* Editor / Preview / Split + Terminal */}
          <div className="flex-1 overflow-hidden">
            <PanelGroup direction="vertical" className="h-full">
              <Panel defaultSize={showTerminal ? 70 : 100} minSize={30}>
                {view === "editor" && editorPane}
                {view === "preview" && previewPane}
                {view === "split" && (
                  <PanelGroup direction="horizontal" className="h-full">
                    <Panel defaultSize={50} minSize={15}>
                      {editorPane}
                    </Panel>
                    <PanelResizeHandle className="w-[3px] bg-[#1c1c1c] hover:bg-emerald-500/30 active:bg-emerald-500/40 transition-colors duration-150 cursor-col-resize" />
                    <Panel defaultSize={50} minSize={15}>
                      {previewPane}
                    </Panel>
                  </PanelGroup>
                )}
              </Panel>
              {showTerminal && (
                <>
                  <PanelResizeHandle className="h-[3px] bg-[#1c1c1c] hover:bg-blue-500/30 active:bg-blue-500/40 transition-colors duration-150 cursor-row-resize" />
                  <Panel defaultSize={30} minSize={10} maxSize={60}>
                    {terminalPane}
                  </Panel>
                </>
              )}
            </PanelGroup>
          </div>
        </div>

        {/* ── Status bar ──────────────────────────────────────────── */}
        <div className="flex items-center gap-3 md:gap-4 px-3 md:px-5 py-1.5 bg-[#050505] border-t border-[#1c1c1c] text-[10px] md:text-[11px] flex-shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/40" />
            <span className="font-mono font-semibold text-white/30">{lang}</span>
          </div>
          {selectedFile && (
            <span className="text-white/15 truncate max-w-[50vw] md:max-w-[40vw] font-mono font-medium">{selectedFile}</span>
          )}
          <div className="ml-auto flex items-center gap-3">
            {modifiedFiles.size > 0 && (
              <span className="text-amber-400/50 font-medium">
                {modifiedFiles.size} unsaved
              </span>
            )}
            <span className="text-white/10 font-mono hidden sm:inline">
              Ctrl+S to run
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
