"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "../functions/send"
import { Sidebar } from "../components/sidebar"
import { MobileSidebar } from "../components/MobileSidebar"
import {
  Plug, Search, Check, ChevronRight, ExternalLink, Shield,
  Menu, X, Eye, EyeOff, Loader2, Plus, Trash2, Terminal,
  Globe, RefreshCw, Wrench, ChevronDown,
} from "lucide-react"

// ─── Plugin Registry ─────────────────────────────────────────────

interface PluginDef {
  id: string
  name: string
  description: string
  category: string
  icon: string
  color: string
  docsUrl?: string
  credentials: CredentialField[]
  capabilities: string[]
}

interface CredentialField {
  key: string
  label: string
  type: "text" | "password"
  placeholder: string
  required: boolean
}

const PLUGIN_REGISTRY: PluginDef[] = [
  // Core
  {
    id: "context7", name: "Context7", category: "Core",
    description: "Inject up-to-date library docs and code context directly into AI prompts for accurate code generation.",
    icon: "C7", color: "#6366f1",
    docsUrl: "https://context7.com",
    credentials: [{ key: "apiKey", label: "API Key", type: "password", placeholder: "c7-...", required: true }],
    capabilities: ["Library documentation lookup", "Code examples injection", "Version-aware context"],
  },
  {
    id: "github", name: "GitHub", category: "Core",
    description: "Full repository control — create repos, manage PRs, search code, and push generated projects directly.",
    icon: "GH", color: "#f0f0f0",
    docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/github",
    credentials: [{ key: "token", label: "Personal Access Token", type: "password", placeholder: "ghp_...", required: true }],
    capabilities: ["Create repositories", "Push code", "Manage issues & PRs", "Code search"],
  },
  {
    id: "filesystem", name: "Filesystem", category: "Core",
    description: "Read and write local files, enabling agents to work with your actual project directory.",
    icon: "FS", color: "#f59e0b",
    credentials: [{ key: "rootPath", label: "Root Directory", type: "text", placeholder: "/home/user/projects", required: true }],
    capabilities: ["Read project files", "Write generated code", "Directory traversal"],
  },
  {
    id: "fetch", name: "Fetch", category: "Core",
    description: "Fetch any URL or API endpoint — let agents pull data, check APIs, or download resources.",
    icon: "FT", color: "#06b6d4",
    docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
    credentials: [],
    capabilities: ["Fetch URLs", "Call REST APIs", "Download resources"],
  },
  {
    id: "sequential-thinking", name: "Sequential Thinking", category: "Core",
    description: "Improves AI reasoning chains for complex architectural decisions and multi-step problem solving.",
    icon: "ST", color: "#8b5cf6",
    credentials: [],
    capabilities: ["Multi-step reasoning", "Architecture planning", "Complex problem decomposition"],
  },

  // Dev Tools
  {
    id: "playwright", name: "Playwright", category: "Dev Tools",
    description: "Browser automation and end-to-end testing — agents can test generated UIs automatically.",
    icon: "PW", color: "#2dd4bf",
    docsUrl: "https://playwright.dev",
    credentials: [],
    capabilities: ["Browser automation", "E2E testing", "Screenshot capture", "Visual regression"],
  },
  {
    id: "chrome-devtools", name: "Chrome DevTools", category: "Dev Tools",
    description: "Debug frontend apps directly — inspect DOM, network requests, console errors, and performance.",
    icon: "CD", color: "#fbbf24",
    credentials: [{ key: "debugPort", label: "Debug Port", type: "text", placeholder: "9222", required: false }],
    capabilities: ["DOM inspection", "Network monitoring", "Console access", "Performance profiling"],
  },

  // Databases
  {
    id: "postgresql", name: "PostgreSQL", category: "Databases",
    description: "Direct SQL access — agents can create schemas, run queries, and migrate data on your Postgres instance.",
    icon: "PG", color: "#336791",
    credentials: [{ key: "connectionString", label: "Connection String", type: "password", placeholder: "postgresql://user:pass@host:5432/db", required: true }],
    capabilities: ["Schema creation", "Query execution", "Data migration", "Index management"],
  },
  {
    id: "mongodb", name: "MongoDB", category: "Databases",
    description: "NoSQL database access — create collections, run aggregations, manage indexes.",
    icon: "MD", color: "#4db33d",
    credentials: [{ key: "connectionString", label: "Connection URI", type: "password", placeholder: "mongodb://localhost:27017/mydb", required: true }],
    capabilities: ["Collection management", "CRUD operations", "Aggregation pipelines", "Index creation"],
  },
  {
    id: "supabase", name: "Supabase", category: "Databases",
    description: "Full backend-as-a-service — auth, database, storage, and real-time subscriptions.",
    icon: "SB", color: "#3ecf8e",
    docsUrl: "https://supabase.com/docs",
    credentials: [
      { key: "url", label: "Project URL", type: "text", placeholder: "https://xxx.supabase.co", required: true },
      { key: "anonKey", label: "Anon Key", type: "password", placeholder: "eyJ...", required: true },
    ],
    capabilities: ["Auth management", "Database queries", "File storage", "Real-time subscriptions"],
  },

  // Cloud & DevOps
  {
    id: "vercel", name: "Vercel", category: "Cloud",
    description: "Deploy frontend apps instantly — push generated code to Vercel and get live preview URLs.",
    icon: "VC", color: "#ffffff",
    docsUrl: "https://vercel.com/docs",
    credentials: [{ key: "token", label: "API Token", type: "password", placeholder: "vercel_...", required: true }],
    capabilities: ["Deploy apps", "Preview deployments", "Domain management", "Environment variables"],
  },
  {
    id: "cloudflare", name: "Cloudflare", category: "Cloud",
    description: "DNS, Workers, R2 storage, and edge caching — deploy serverless functions globally.",
    icon: "CF", color: "#f38020",
    credentials: [{ key: "apiToken", label: "API Token", type: "password", placeholder: "cf_...", required: true }],
    capabilities: ["Workers deployment", "DNS management", "R2 storage", "Edge caching"],
  },

  // Search & Data
  {
    id: "exa", name: "Exa Search", category: "Search & Data",
    description: "AI-native search engine — agents get real-time web data, research, and current documentation.",
    icon: "EX", color: "#4f46e5",
    docsUrl: "https://exa.ai",
    credentials: [{ key: "apiKey", label: "API Key", type: "password", placeholder: "exa-...", required: true }],
    capabilities: ["Web search", "Content extraction", "Real-time data", "Research"],
  },
  {
    id: "firecrawl", name: "Firecrawl", category: "Search & Data",
    description: "Web scraping and structured data extraction — turn any website into clean, usable data.",
    icon: "FC", color: "#ef4444",
    docsUrl: "https://firecrawl.dev",
    credentials: [{ key: "apiKey", label: "API Key", type: "password", placeholder: "fc-...", required: true }],
    capabilities: ["Web scraping", "Structured extraction", "Crawling", "Screenshot"],
  },

  // Workflow
  {
    id: "zapier", name: "Zapier", category: "Workflow",
    description: "Connect 5000+ apps — automate workflows between your generated app and external services.",
    icon: "ZP", color: "#ff4a00",
    docsUrl: "https://zapier.com/mcp",
    credentials: [{ key: "apiKey", label: "API Key", type: "password", placeholder: "zap_...", required: true }],
    capabilities: ["App integrations", "Workflow automation", "Webhook triggers", "Data sync"],
  },
]

const CATEGORIES = [...new Set(PLUGIN_REGISTRY.map(p => p.category)), 'Custom']

// ─── Plugin Card ─────────────────────────────────────────────────

function PluginCard({ plugin, userState, onToggle, onSaveCredentials }: {
  plugin: PluginDef
  userState?: { enabled: boolean; credentials: Record<string, string> }
  onToggle: (pluginId: string, enabled: boolean, credentials: Record<string, string>) => Promise<void>
  onSaveCredentials: (pluginId: string, credentials: Record<string, string>) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [creds, setCreds] = useState<Record<string, string>>(userState?.credentials || {})
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const enabled = userState?.enabled || false
  const hasRequiredCreds = plugin.credentials.filter(c => c.required).every(c => creds[c.key]?.trim())

  const handleToggle = async () => {
    if (!enabled && plugin.credentials.length > 0 && !hasRequiredCreds) {
      setExpanded(true)
      return
    }
    setSaving(true)
    await onToggle(plugin.id, !enabled, creds)
    setSaving(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await onSaveCredentials(plugin.id, creds)
    if (!enabled && hasRequiredCreds) {
      await onToggle(plugin.id, true, creds)
    }
    setSaving(false)
    setExpanded(false)
  }

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      enabled
        ? "bg-[var(--surface-raised)] border-white/[0.12] shadow-[0_0_16px_rgba(0,0,0,0.3)]"
        : "bg-[#0e0e0e] border-[#1a1a1a] hover:border-white/[0.12]"
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-3.5">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 border"
          style={{ backgroundColor: plugin.color + '10', color: plugin.color, borderColor: plugin.color + '20' }}
        >
          {plugin.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-white/85 tracking-[-0.02em]">{plugin.name}</span>
            {enabled && (
              <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400/70 bg-emerald-500/[0.08] px-1.5 py-0.5 rounded border border-emerald-500/15">Active</span>
            )}
            {plugin.docsUrl && (
              <a
                href={plugin.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/15 hover:text-white/40 transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="text-[11px] text-white/35 leading-relaxed mt-0.5 line-clamp-2">{plugin.description}</p>
        </div>

        {/* Toggle + Expand */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative w-10 h-[22px] rounded-full transition-all duration-200 flex-shrink-0 ${
              enabled ? "bg-emerald-500/25" : "bg-white/[0.06]"
            }`}
          >
            <div className={`absolute top-[2px] w-[18px] h-[18px] rounded-full transition-all duration-200 shadow-sm ${
              enabled
                ? "left-[20px] bg-emerald-400"
                : "left-[2px] bg-white/25"
            }`}>
              {saving && <Loader2 className="w-2.5 h-2.5 animate-spin absolute top-[3px] left-[3px] text-white/60" />}
            </div>
          </button>

          {(plugin.credentials.length > 0 || plugin.capabilities.length > 0) && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1 rounded-md text-white/15 hover:text-white/40 hover:bg-white/[0.04] transition-all"
            >
              <ChevronRight className={`w-3.5 h-3.5 chevron-rotate ${expanded ? "open" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded: Capabilities + Credentials */}
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="border-t border-white/[0.08] pt-3 space-y-3">

              {/* Capabilities */}
              {plugin.capabilities.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Capabilities</span>
                  <div className="flex flex-wrap gap-1.5">
                    {plugin.capabilities.map(cap => (
                      <span key={cap} className="px-2 py-0.5 rounded-md text-[10px] font-medium text-white/30 bg-white/[0.04] border border-white/[0.06]">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Credential fields */}
              {plugin.credentials.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/20 flex items-center gap-1.5 mb-2">
                    <Shield className="w-3 h-3" />
                    Credentials
                  </span>
                  <div className="space-y-2">
                    {plugin.credentials.map(field => (
                      <div key={field.key}>
                        <label className="text-[11px] text-white/30 font-medium block mb-1">
                          {field.label} {field.required && <span className="text-red-400/50">*</span>}
                        </label>
                        <div className="relative">
                          <input
                            type={field.type === "password" && !showSecrets[field.key] ? "password" : "text"}
                            value={creds[field.key] || ""}
                            onChange={e => setCreds(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full bg-[#050505] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white/70 placeholder:text-white/15 outline-none focus:border-[#404040] transition-colors font-mono"
                          />
                          {field.type === "password" && (
                            <button
                              type="button"
                              onClick={() => setShowSecrets(s => ({ ...s, [field.key]: !s[field.key] }))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/40 transition-colors"
                            >
                              {showSecrets[field.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={handleSave}
                      disabled={saving || !hasRequiredCreds}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-emerald-500/[0.10] text-emerald-400/80 border border-emerald-500/20 hover:bg-emerald-500/[0.15] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Save & Enable
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
      )}
    </div>
  )
}

// ─── Custom MCP Server Card ─────────────────────────────────────

interface MCPServerData {
  _id: string
  name: string
  transport: string
  command?: string
  args?: string[]
  url?: string
  enabled: boolean
  healthStatus: string
  discoveredTools?: Array<{ name: string; description: string }>
}

function CustomMCPCard({ server, onDelete, onDiscover, onToggle }: {
  server: MCPServerData
  onDelete: (id: string) => void
  onDiscover: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [discovering, setDiscovering] = useState(false)
  const toolCount = server.discoveredTools?.length || 0

  const handleDiscover = async () => {
    setDiscovering(true)
    await onDiscover(server._id)
    setDiscovering(false)
  }

  const statusColor = server.healthStatus === 'healthy' ? '#4ADE80'
    : server.healthStatus === 'unhealthy' ? '#EF4444' : 'rgba(255,255,255,0.25)'

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      server.enabled
        ? "bg-[var(--surface-raised)] border-white/[0.12] shadow-[0_0_16px_rgba(0,0,0,0.3)]"
        : "bg-[#0e0e0e] border-[#1a1a1a] hover:border-white/[0.12]"
    }`}>
      <div className="flex items-center gap-3 p-3.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 border bg-purple-500/10 text-purple-400 border-purple-500/20">
          <Terminal className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-white/85 tracking-[-0.02em]">{server.name}</span>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />
            <span className="text-[9px] font-medium text-white/20 uppercase tracking-wider">
              {server.transport}
            </span>
            {toolCount > 0 && (
              <span className="text-[9px] font-mono text-purple-400/60 bg-purple-500/[0.08] px-1.5 py-0.5 rounded border border-purple-500/15">
                {toolCount} tools
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/30 mt-0.5 truncate font-mono">
            {server.transport === 'stdio'
              ? `${server.command} ${(server.args || []).join(' ')}`
              : server.url || ''}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="p-1.5 rounded-md text-white/20 hover:text-purple-400 hover:bg-purple-500/[0.08] transition-all"
            title="Discover tools"
          >
            {discovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onToggle(server._id, !server.enabled)}
            className={`relative w-10 h-[22px] rounded-full transition-all duration-200 flex-shrink-0 ${
              server.enabled ? "bg-purple-500/25" : "bg-white/[0.06]"
            }`}
          >
            <div className={`absolute top-[2px] w-[18px] h-[18px] rounded-full transition-all duration-200 shadow-sm ${
              server.enabled ? "left-[20px] bg-purple-400" : "left-[2px] bg-white/25"
            }`} />
          </button>

          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1 rounded-md text-white/15 hover:text-white/40 hover:bg-white/[0.04] transition-all"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/[0.06]">
          {/* Discovered tools */}
          {toolCount > 0 && (
            <div className="mt-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/20 block mb-1.5">
                <Wrench className="w-3 h-3 inline mr-1" />
                Discovered Tools
              </span>
              <div className="flex flex-wrap gap-1.5">
                {server.discoveredTools!.map(tool => (
                  <span key={tool.name} className="group relative px-2 py-0.5 rounded-md text-[10px] font-medium text-purple-300/50 bg-purple-500/[0.06] border border-purple-500/10">
                    {tool.name}
                    {tool.description && (
                      <span className="hidden group-hover:block absolute bottom-full left-0 mb-1 px-2 py-1 rounded bg-[#1a1a1a] border border-white/10 text-[9px] text-white/50 whitespace-nowrap z-10 max-w-[250px] truncate">
                        {tool.description}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <button
              onClick={() => onDelete(server._id)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.08] transition-all"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add MCP Server Form ────────────────────────────────────────

function AddMCPServerForm({ onAdd }: { onAdd: (server: MCPServerData) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [transport, setTransport] = useState<"stdio" | "http-sse" | "streamable-http">("stdio")
  const [command, setCommand] = useState("npx")
  const [args, setArgs] = useState("")
  const [url, setUrl] = useState("")
  const [envVars, setEnvVars] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required"); return }
    if (transport === 'stdio' && !command.trim()) { setError("Command is required"); return }
    if (transport !== 'stdio' && !url.trim()) { setError("URL is required"); return }

    setSaving(true)
    setError("")

    try {
      const payload: any = { name: name.trim(), transport, enabled: true }

      if (transport === 'stdio') {
        payload.command = command.trim()
        payload.args = args.trim() ? args.trim().split(/\s+/) : []
      } else {
        payload.url = url.trim()
      }

      // Parse env vars (KEY=VALUE per line)
      if (envVars.trim()) {
        const env: Record<string, string> = {}
        for (const line of envVars.trim().split('\n')) {
          const eq = line.indexOf('=')
          if (eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
        }
        payload.env = env
      }

      const res = await api.post("/mcp/servers", payload)
      onAdd(res.data.server)
      setName(""); setArgs(""); setUrl(""); setEnvVars(""); setOpen(false)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add server")
    }
    setSaving(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-white/[0.08] text-white/25 hover:text-white/50 hover:border-white/[0.15] hover:bg-white/[0.02] transition-all"
      >
        <Plus className="w-4 h-4" />
        <span className="text-[13px] font-medium">Add Custom MCP Server</span>
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-purple-500/20 bg-[#0e0e0e] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-white/70">Add MCP Server</span>
        <button onClick={() => setOpen(false)} className="text-white/20 hover:text-white/40">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Name */}
      <div>
        <label className="text-[11px] text-white/30 font-medium block mb-1">Server Name <span className="text-red-400/50">*</span></label>
        <input
          value={name} onChange={e => setName(e.target.value)} placeholder="My MCP Server"
          className="w-full bg-[#050505] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white/70 placeholder:text-white/15 outline-none focus:border-purple-500/30 transition-colors"
        />
      </div>

      {/* Transport */}
      <div>
        <label className="text-[11px] text-white/30 font-medium block mb-1">Transport</label>
        <div className="flex gap-2">
          {(["stdio", "http-sse", "streamable-http"] as const).map(t => (
            <button
              key={t} onClick={() => setTransport(t)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                transport === t
                  ? "bg-purple-500/15 text-purple-300 border border-purple-500/25"
                  : "text-white/25 border border-white/[0.08] hover:border-white/[0.15]"
              }`}
            >
              {t === 'stdio' ? 'stdio' : t === 'http-sse' ? 'HTTP+SSE' : 'Streamable HTTP'}
            </button>
          ))}
        </div>
      </div>

      {/* stdio fields */}
      {transport === 'stdio' && (
        <>
          <div>
            <label className="text-[11px] text-white/30 font-medium block mb-1">Command <span className="text-red-400/50">*</span></label>
            <input
              value={command} onChange={e => setCommand(e.target.value)} placeholder="npx"
              className="w-full bg-[#050505] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white/70 placeholder:text-white/15 outline-none focus:border-purple-500/30 transition-colors font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] text-white/30 font-medium block mb-1">Arguments <span className="text-white/15">(space-separated)</span></label>
            <input
              value={args} onChange={e => setArgs(e.target.value)} placeholder="-y @modelcontextprotocol/server-github"
              className="w-full bg-[#050505] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white/70 placeholder:text-white/15 outline-none focus:border-purple-500/30 transition-colors font-mono"
            />
          </div>
        </>
      )}

      {/* HTTP fields */}
      {transport !== 'stdio' && (
        <div>
          <label className="text-[11px] text-white/30 font-medium block mb-1">Server URL <span className="text-red-400/50">*</span></label>
          <input
            value={url} onChange={e => setUrl(e.target.value)} placeholder="https://mcp.example.com/api"
            className="w-full bg-[#050505] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white/70 placeholder:text-white/15 outline-none focus:border-purple-500/30 transition-colors font-mono"
          />
        </div>
      )}

      {/* Env vars */}
      <div>
        <label className="text-[11px] text-white/30 font-medium block mb-1">
          Environment Variables <span className="text-white/15">(KEY=VALUE, one per line)</span>
        </label>
        <textarea
          value={envVars} onChange={e => setEnvVars(e.target.value)}
          placeholder={"GITHUB_TOKEN=ghp_...\nAPI_KEY=sk-..."}
          rows={3}
          className="w-full bg-[#050505] border border-white/[0.12] rounded-lg px-3 py-2 text-[12px] text-white/70 placeholder:text-white/15 outline-none focus:border-purple-500/30 transition-colors font-mono resize-none"
        />
      </div>

      {error && <p className="text-[11px] text-red-400/70">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 rounded-lg text-[12px] text-white/30 hover:text-white/50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/25 hover:bg-purple-500/25 disabled:opacity-40 transition-all"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Add Server
        </button>
      </div>
    </div>
  )
}

// ─── Plugins Page ────────────────────────────────────────────────

export default function PluginsPage() {
  const [userPlugins, setUserPlugins] = useState<Record<string, { enabled: boolean; credentials: Record<string, string> }>>({})
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [customServers, setCustomServers] = useState<MCPServerData[]>([])

  // Load user's plugin states + custom MCP servers
  useEffect(() => {
    (async () => {
      try {
        const [pluginRes, mcpRes] = await Promise.all([
          api.get("/plugins"),
          api.get("/mcp/servers"),
        ])
        const map: Record<string, any> = {}
        for (const p of pluginRes.data.plugins || []) {
          map[p.pluginId] = { enabled: p.enabled, credentials: p.credentials || {} }
        }
        setUserPlugins(map)

        // Filter out bridge-managed servers (they have matching plugin names)
        const builtinNames = PLUGIN_REGISTRY.map(p => p.name.toLowerCase())
        const custom = (mcpRes.data.servers || []).filter(
          (s: any) => !builtinNames.includes(s.name.toLowerCase())
        )
        setCustomServers(custom)
      } catch { /* ignore */ }
      setLoading(false)
    })()
  }, [])

  const handleToggle = useCallback(async (pluginId: string, enabled: boolean, credentials: Record<string, string>) => {
    try {
      await api.put(`/plugins/${pluginId}`, { enabled, credentials })
      setUserPlugins(prev => ({ ...prev, [pluginId]: { enabled, credentials } }))
    } catch (e) {
      console.error("Failed to toggle plugin:", e)
    }
  }, [])

  const handleSaveCredentials = useCallback(async (pluginId: string, credentials: Record<string, string>) => {
    try {
      await api.put(`/plugins/${pluginId}`, { enabled: true, credentials })
      setUserPlugins(prev => ({ ...prev, [pluginId]: { enabled: true, credentials } }))
    } catch (e) {
      console.error("Failed to save credentials:", e)
    }
  }, [])

  // Custom MCP server handlers
  const handleAddServer = useCallback((server: MCPServerData) => {
    setCustomServers(prev => [...prev, server])
  }, [])

  const handleDeleteServer = useCallback(async (id: string) => {
    try {
      await api.delete(`/mcp/servers/${id}`)
      setCustomServers(prev => prev.filter(s => s._id !== id))
    } catch (e) {
      console.error("Failed to delete MCP server:", e)
    }
  }, [])

  const handleDiscoverTools = useCallback(async (id: string) => {
    try {
      const res = await api.post(`/mcp/servers/${id}/discover`)
      setCustomServers(prev => prev.map(s =>
        s._id === id ? { ...s, discoveredTools: res.data.tools, healthStatus: 'healthy' } : s
      ))
    } catch (e) {
      console.error("Tool discovery failed:", e)
      setCustomServers(prev => prev.map(s =>
        s._id === id ? { ...s, healthStatus: 'unhealthy' } : s
      ))
    }
  }, [])

  const handleToggleServer = useCallback(async (id: string, enabled: boolean) => {
    try {
      await api.put(`/mcp/servers/${id}`, { enabled })
      setCustomServers(prev => prev.map(s =>
        s._id === id ? { ...s, enabled } : s
      ))
    } catch (e) {
      console.error("Failed to toggle MCP server:", e)
    }
  }, [])

  // Filter plugins
  const filtered = PLUGIN_REGISTRY.filter(p => {
    if (activeCategory && p.category !== activeCategory) return false
    if (search) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    }
    return true
  })

  const enabledCount = Object.values(userPlugins).filter(p => p.enabled).length + customServers.filter(s => s.enabled).length

  return (
    <div className="flex flex-row h-screen w-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto chat-scroll">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#050505]/90 backdrop-blur-md border-b border-white/[0.08]">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 md:py-5">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-white/[0.12] flex items-center justify-center">
                <Plug className="w-5 h-5 text-white/40" />
              </div>
              <div>
                <h1 className="text-[18px] font-semibold text-white/90 tracking-[-0.03em]">Plugins</h1>
                <p className="text-[12px] text-white/25 font-medium">
                  {enabledCount} active {enabledCount === 1 ? 'plugin' : 'plugins'} enhancing your AI agents
                </p>
              </div>
            </div>

            {/* Search + Category pills */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/15" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search plugins..."
                  className="w-full bg-[#1A1A1A] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-white/70 placeholder:text-white/20 outline-none focus:border-white/[0.12] transition-colors"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ${
                    !activeCategory ? "bg-white/[0.08] text-white/70" : "text-white/25 hover:text-white/40 hover:bg-white/[0.03]"
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ${
                      activeCategory === cat ? "bg-white/[0.08] text-white/70" : "text-white/25 hover:text-white/40 hover:bg-white/[0.03]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Plugin grid */}
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-white/20" />
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-2xl mx-auto">
              {filtered.map(plugin => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  userState={userPlugins[plugin.id]}
                  onToggle={handleToggle}
                  onSaveCredentials={handleSaveCredentials}
                />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && !search && (
            <div className="text-center py-16">
              <p className="text-[14px] text-white/25 font-medium">No plugins match your search.</p>
            </div>
          )}

          {/* Custom MCP Servers Section */}
          {!loading && (!activeCategory || activeCategory === 'Custom') && (
            <div className="max-w-2xl mx-auto mt-10">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-purple-400/70" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-white/80 tracking-[-0.02em]">Custom MCP Servers</h2>
                  <p className="text-[11px] text-white/25">Add your own MCP servers — agents will discover and use their tools automatically</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {customServers.map(server => (
                  <CustomMCPCard
                    key={server._id}
                    server={server}
                    onDelete={handleDeleteServer}
                    onDiscover={handleDiscoverTools}
                    onToggle={handleToggleServer}
                  />
                ))}

                <AddMCPServerForm onAdd={handleAddServer} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
