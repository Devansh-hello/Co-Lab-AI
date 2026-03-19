"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Editor from "@monaco-editor/react"
import {
  Monitor, RefreshCw, ExternalLink, X,
  Code2, Columns2, ChevronDown, ChevronRight,
  FolderOpen, Folder, FileCode, FileText, FileJson, Braces,
} from "lucide-react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { generatePreviewHTML } from "./messageCard"

// ─── File tree types & builder ────────────────────────────────

interface TreeNode {
  name: string
  path: string      // for dirs: logical path; for files: actual key in fileContents
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
  const pl = depth * 12 + 8

  if (node.isDir) {
    return (
      <>
        <button
          onClick={() => onToggleDir(node.path)}
          className="flex items-center gap-1.5 w-full text-left py-[3px] text-[12px] text-[#cccccc] hover:bg-[#2a2d2e] transition-colors select-none"
          data-removed-style={{ paddingLeft: pl, paddingRight: 8 }}
        >
          {isExpanded
            ? <ChevronDown  className="w-3 h-3 flex-shrink-0 text-[#c5c5c5]/50" />
            : <ChevronRight className="w-3 h-3 flex-shrink-0 text-[#c5c5c5]/50" />}
          {isExpanded
            ? <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-[#dcb67a]" />
            : <Folder     className="w-3.5 h-3.5 flex-shrink-0 text-[#dcb67a]" />}
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && node.children?.map(child => (
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
      </>
    )
  }

  return (
    <button
      onClick={() => onSelectFile(node.path)}
      className={`flex items-center gap-1.5 w-full text-left py-[3px] text-[12px] transition-colors select-none ${
        isSelected
          ? "bg-[#094771] text-white"
          : "text-[#cccccc] hover:bg-[#2a2d2e]"
      }`}
      data-removed-style={{ paddingLeft: pl + 16, paddingRight: 8 }}
    >
      <FileIcon
        filename={node.name}
        className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-white/70" : "text-[#c5c5c5]/60"}`}
      />
      <span className="truncate flex-1">{node.name}</span>
      {isModified && (
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 ml-1" title="Unsaved" />
      )}
    </button>
  )
}

// ─── IDE Modal ────────────────────────────────────────────────

export const IDEModal: React.FC<{
  files: [string, string][]
  title?: string
  onClose: () => void
}> = ({ files: initialFiles, title = "Preview", onClose }) => {
  // Snapshot of original content to detect modifications
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const originalContents = useMemo(() => Object.fromEntries(initialFiles), [])

  const [fileContents, setFileContents] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialFiles)
  )
  const [selectedFile, setSelectedFile] = useState<string>(
    initialFiles.find(([n]) => /app\.[jt]sx?$/i.test(n))?.[0] ??
    initialFiles[0]?.[0] ?? ""
  )
  const [view, setView] = useState<"editor" | "split" | "preview">("split")
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewKey, setPreviewKey] = useState(0)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => {
    const dirs = new Set<string>()
    for (const [path] of initialFiles) {
      const parts = path.split("/")
      for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join("/"))
    }
    return dirs
  })
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const fileEntries = useMemo(
    () => Object.entries(fileContents) as [string, string][],
    [fileContents]
  )

  const modifiedFiles = useMemo(() => {
    const s = new Set<string>()
    for (const [p, c] of fileEntries) { if (c !== originalContents[p]) s.add(p) }
    return s
  }, [fileEntries, originalContents])

  // ── Preview refresh ───────────────────────────────────────────
  const refresh = useCallback(() => {
    const html = generatePreviewHTML(fileEntries)
    setPreviewHtml(html)
    setPreviewKey(k => k + 1)
  }, [fileEntries])

  // Initial render
  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Inject HTML into iframe when it (re)mounts
  useEffect(() => {
    if (iframeRef.current && previewHtml) iframeRef.current.srcdoc = previewHtml
  }, [previewHtml, previewKey])

  // Keyboard: Ctrl+S = run, Escape = close
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

  // Configure Monaco to suppress "module not found" type errors
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
    <div className="h-full w-full overflow-hidden">
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
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          padding: { top: 12 },
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
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/8 border-b border-amber-500/15 flex-shrink-0">
        <span className="text-[11px] text-amber-400/80 font-medium">⚡ Frontend preview only</span>
        <span className="text-[11px] text-[#888]"> — API / backend calls won't respond</span>
      </div>
      <iframe
        key={previewKey}
        ref={iframeRef}
        sandbox="allow-scripts"
        className="flex-1 w-full bg-white border-0"
        title="App Preview"
      />
    </div>
  )

  const lang = monacoLang(selectedFile).toUpperCase()

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-[96vw] h-[94vh] bg-[#1e1e1e] border border-[#3c3c3c] rounded-xl overflow-hidden flex flex-col shadow-[0_32px_96px_rgba(0,0,0,0.9)]">

        {/* ── Title bar ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-3 py-2 bg-[#3c3c3c] border-b border-[#252526] flex-shrink-0 select-none">
          <div className="flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5 text-emerald-400/70" />
            <span className="text-[12px] text-[#cccccc]/60 truncate max-w-[200px]">{title}</span>
          </div>

          {/* View toggle — centered */}
          <div className="flex items-center gap-0.5 mx-auto bg-[#252526] rounded-lg p-0.5 border border-[#3c3c3c]">
            {([
              { id: "editor" as const,  icon: <Code2     className="w-3.5 h-3.5" />, label: "Editor" },
              { id: "split" as const,   icon: <Columns2  className="w-3.5 h-3.5" />, label: "Split" },
              { id: "preview" as const, icon: <Monitor   className="w-3.5 h-3.5" />, label: "Preview" },
            ]).map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                title={label}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  view === id
                    ? "bg-[#094771] text-white shadow-sm"
                    : "text-[#aaaaaa] hover:text-white hover:bg-white/8"
                }`}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={refresh}
              title="Run preview (Ctrl+S)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-[#aaaaaa] hover:text-white hover:bg-white/8 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Run</span>
            </button>
            <button
              onClick={openInNewTab}
              title="Open preview in new tab"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-[#aaaaaa] hover:text-white hover:bg-white/8 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-5 bg-white/10 mx-0.5" />
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-[#aaaaaa] hover:text-white hover:bg-white/8 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Main area ─────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* File tree sidebar */}
          <div className="w-52 min-w-[180px] bg-[#252526] border-r border-[#3c3c3c] flex flex-col overflow-hidden flex-shrink-0">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#bbbbbb]/40 border-b border-[#3c3c3c] flex-shrink-0">
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

          {/* Editor / Preview / Split */}
          <div className="flex-1 overflow-hidden">
            {view === "editor" && editorPane}
            {view === "preview" && previewPane}
            {view === "split" && (
              <PanelGroup direction="horizontal" className="h-full">
                <Panel defaultSize={50} minSize={15}>
                  {editorPane}
                </Panel>
                <PanelResizeHandle className="w-[3px] bg-[#3c3c3c] hover:bg-[#1177bb] active:bg-[#1177bb] transition-colors cursor-col-resize" />
                <Panel defaultSize={50} minSize={15}>
                  {previewPane}
                </Panel>
              </PanelGroup>
            )}
          </div>
        </div>

        {/* ── VS Code-style status bar ──────────────────────────── */}
        <div className="flex items-center gap-4 px-3 py-0.5 bg-[#007acc] text-white text-[11px] flex-shrink-0 select-none">
          <span className="font-mono opacity-80">{lang}</span>
          {selectedFile && (
            <span className="opacity-60 truncate max-w-[40vw] font-mono">{selectedFile}</span>
          )}
          {modifiedFiles.size > 0 && (
            <span className="ml-auto opacity-80">
              ● {modifiedFiles.size} unsaved · <kbd className="font-mono">Ctrl+S</kbd> to run
            </span>
          )}
        </div>

      </div>
    </div>
  )
}
