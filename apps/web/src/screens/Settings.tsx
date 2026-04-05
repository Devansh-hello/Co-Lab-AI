"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { api } from "../functions/send"
import { Sidebar } from "../components/sidebar"
import toast from "react-hot-toast"
import {
  Settings as SettingsIcon, Plug, Eye, EyeOff, Check, Loader2,
  Menu, KeyRound, Trash2, ChevronDown,
} from "lucide-react"

// ─── Model Registry ──────────────────────────────────────────────

interface ModelOption {
  id: string
  label: string
  provider: string
  model: string
  speed: "fast" | "medium" | "slow"
  quality: "standard" | "high" | "best"
  free?: boolean
}

const MODEL_REGISTRY: ModelOption[] = [
  // OpenAI
  { id: "gpt-5-mini", label: "GPT-5 Mini", provider: "openai", model: "gpt-5-mini", speed: "fast", quality: "high" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "openai", model: "gpt-4.1-mini", speed: "fast", quality: "high" },
  { id: "gpt-4.1", label: "GPT-4.1", provider: "openai", model: "gpt-4.1", speed: "medium", quality: "best" },
  { id: "o4-mini", label: "o4-mini", provider: "openai", model: "o4-mini", speed: "medium", quality: "best" },

  // Anthropic
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "anthropic", model: "claude-haiku-4-5", speed: "fast", quality: "high" },
  { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", provider: "anthropic", model: "claude-sonnet-4-5", speed: "medium", quality: "best" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic", model: "claude-sonnet-4-6", speed: "medium", quality: "best" },

  // Google
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "gemini", model: "gemini-2.5-flash", speed: "fast", quality: "high" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "gemini", model: "gemini-2.5-pro", speed: "slow", quality: "best" },

  // Z AI
  { id: "glm-flash", label: "GLM-4.7 FlashX", provider: "glm", model: "GLM-4.7-FlashX", speed: "fast", quality: "standard" },

  // OpenRouter (paid)
  { id: "or-claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "openrouter", model: "anthropic/claude-sonnet-4-6", speed: "medium", quality: "best" },
  { id: "or-claude-sonnet-4-5", label: "Claude Sonnet 4.5", provider: "openrouter", model: "anthropic/claude-sonnet-4-5", speed: "medium", quality: "best" },
  { id: "or-claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "openrouter", model: "anthropic/claude-haiku-4-5-20251001", speed: "fast", quality: "high" },
  { id: "or-gpt-5-mini", label: "GPT-5 Mini", provider: "openrouter", model: "openai/gpt-5-mini", speed: "fast", quality: "high" },
  { id: "or-gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "openrouter", model: "openai/gpt-4.1-mini", speed: "fast", quality: "high" },
  { id: "or-o4-mini", label: "o4-mini", provider: "openrouter", model: "openai/o4-mini", speed: "medium", quality: "best" },
  { id: "or-gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "openrouter", model: "google/gemini-2.5-flash", speed: "fast", quality: "high" },
  { id: "or-gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "openrouter", model: "google/gemini-2.5-pro", speed: "slow", quality: "best" },
  { id: "or-deepseek-v3", label: "DeepSeek V3", provider: "openrouter", model: "deepseek/deepseek-chat-v3-0324", speed: "medium", quality: "high" },
  { id: "or-deepseek-r1", label: "DeepSeek R1", provider: "openrouter", model: "deepseek/deepseek-r1", speed: "slow", quality: "best" },
  { id: "or-llama-4-maverick", label: "Llama 4 Maverick", provider: "openrouter", model: "meta-llama/llama-4-maverick", speed: "medium", quality: "high" },
  { id: "or-qwen3-235b", label: "Qwen3 235B", provider: "openrouter", model: "qwen/qwen3-235b-a22b", speed: "medium", quality: "high" },

  // OpenRouter (free)
  { id: "gpt-oss-120b", label: "GPT-OSS 120B", provider: "openrouter", model: "openai/gpt-oss-120b:free", speed: "medium", quality: "high", free: true },
  { id: "deepseek-r1-free", label: "DeepSeek R1 (Free)", provider: "openrouter", model: "deepseek/deepseek-r1:free", speed: "slow", quality: "best", free: true },
  { id: "llama-4-scout-free", label: "Llama 4 Scout (Free)", provider: "openrouter", model: "meta-llama/llama-4-scout:free", speed: "fast", quality: "standard", free: true },
  { id: "qwen3-235b-free", label: "Qwen3 235B (Free)", provider: "openrouter", model: "qwen/qwen3-235b-a22b:free", speed: "medium", quality: "high", free: true },
]

const PROVIDERS = [
  { id: "openai", name: "OpenAI", color: "#10a37f", placeholder: "sk-..." },
  { id: "anthropic", name: "Anthropic", color: "#d4a574", placeholder: "sk-ant-..." },
  { id: "gemini", name: "Google Gemini", color: "#4285f4", placeholder: "AIza..." },
  { id: "openrouter", name: "OpenRouter", color: "#9333ea", placeholder: "sk-or-..." },
  { id: "glm", name: "Z AI (GLM)", color: "#06b6d4", placeholder: "..." },
]

const AGENT_ROLES = [
  { id: "orchestrator", name: "Orchestrator", description: "Plans the project, defines tasks and API contracts", recommended: "Fast, cheap model" },
  { id: "frontend", name: "Frontend Agent", description: "Generates frontend code (React, CSS, etc.)", recommended: "Smart, code-focused model" },
  { id: "backend", name: "Backend Agent", description: "Generates backend code (Node.js, APIs, DB)", recommended: "Smart, code-focused model" },
  { id: "review", name: "Review Agent", description: "Reviews code quality and generates setup guide", recommended: "Fast, analytical model" },
]

// ─── Settings Page ───────────────────────────────────────────────

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Settings state
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [apiKeysSet, setApiKeysSet] = useState<Record<string, boolean>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [agentModels, setAgentModels] = useState<Record<string, { provider: string; model: string }>>({
    orchestrator: { provider: "", model: "" },
    frontend: { provider: "", model: "" },
    backend: { provider: "", model: "" },
    review: { provider: "", model: "" },
  })

  // Load settings
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/settings")
        const s = res.data.settings
        setApiKeys(s.apiKeys || {})
        setApiKeysSet(s.apiKeysSet || {})
        setAgentModels(prev => ({
          ...prev,
          ...(s.agentModels || {}),
        }))
      } catch { /* ignore */ }
      setLoading(false)
    })()
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      // Only send non-empty, non-masked keys
      const keysToSave: Record<string, string> = {}
      for (const [provider, key] of Object.entries(apiKeys)) {
        if (key && !key.includes('••')) {
          keysToSave[provider] = key
        }
      }

      await api.put("/settings", {
        apiKeys: keysToSave,
        agentModels,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      toast.success("Settings saved")
      // Refresh to get masked keys
      const res = await api.get("/settings")
      setApiKeys(res.data.settings.apiKeys || {})
      setApiKeysSet(res.data.settings.apiKeysSet || {})
    } catch (e) {
      console.error("Failed to save settings:", e)
      toast.error("Failed to save settings")
    }
    setSaving(false)
  }, [apiKeys, agentModels])

  const handleDeleteKey = useCallback(async (provider: string) => {
    try {
      await api.delete(`/settings/apikey/${provider}`)
      setApiKeys(prev => ({ ...prev, [provider]: "" }))
      setApiKeysSet(prev => ({ ...prev, [provider]: false }))
    } catch { /* ignore */ }
  }, [])

  const getModelsForAgent = (agentId: string) => {
    const selected = agentModels[agentId]
    if (!selected?.provider && !selected?.model) return null
    const match = MODEL_REGISTRY.find(m => m.provider === selected.provider && m.model === selected.model)
    return match
  }

  return (
    <div className="flex flex-row h-screen w-screen bg-background overflow-hidden">
      <div className="hidden md:block"><Sidebar /></div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 animate-overlay-in" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 h-full w-[280px] animate-slide-in-left"><Sidebar /></div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto chat-scroll">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#050505]/90 backdrop-blur-md border-b border-white/[0.08]">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-5">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors">
                <Menu className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/[0.12] flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-white/40" />
              </div>
              <h1 className="text-[18px] font-semibold text-white/90 tracking-[-0.03em]">Settings</h1>
            </div>

            {/* Nav */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111] border border-white/[0.08] w-fit">
              <Link
                href="/settings"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold tracking-[-0.02em] bg-white/[0.08] text-white/80"
              >
                <SettingsIcon className="w-3.5 h-3.5" /> Models
              </Link>
              <Link
                href="/plugins"
                prefetch
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold tracking-[-0.02em] text-white/40 hover:text-white/60 transition-all"
              >
                <Plug className="w-3.5 h-3.5" /> Plugins
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-6">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-white/20" /></div>
          ) : (
            <div className="space-y-8">
              {/* ── API Keys ────────────────────────────── */}
              <section>
                <h2 className="text-[17px] font-semibold text-white/80 mb-1 tracking-[-0.02em]">API Keys</h2>
                <p className="text-[13px] text-white/45 mb-4">Add your own API keys or use the platform defaults. Your keys are stored securely and never shared.</p>

                <div className="space-y-2.5">
                  {PROVIDERS.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-base)] border border-white/[0.08]">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: p.color + '15' }}>
                        <KeyRound className="w-3.5 h-3.5" style={{ color: p.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-semibold text-white/70">{p.name}</span>
                          {apiKeysSet[p.id] && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/60 bg-emerald-500/[0.08] px-1.5 py-0.5 rounded">Active</span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type={showKeys[p.id] ? "text" : "password"}
                            value={apiKeys[p.id] || ""}
                            onChange={e => setApiKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                            placeholder={apiKeysSet[p.id] ? "Key saved (enter new to replace)" : p.placeholder}
                            className="w-full bg-[#111] border border-white/[0.12] rounded-lg px-3 py-1.5 pr-16 text-[12px] font-mono text-white/60 placeholder:text-white/15 outline-none focus:border-[#404040] transition-colors"
                          />
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                            <button
                              onClick={() => setShowKeys(s => ({ ...s, [p.id]: !s[p.id] }))}
                              className="p-1 text-white/15 hover:text-white/40 transition-colors"
                            >
                              {showKeys[p.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            {apiKeysSet[p.id] && (
                              <button
                                onClick={() => handleDeleteKey(p.id)}
                                className="p-1 text-white/15 hover:text-red-400/60 transition-colors"
                                title="Remove key"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Agent Model Selection ───────────────── */}
              <section>
                <h2 className="text-[17px] font-semibold text-white/80 mb-1 tracking-[-0.02em]">Agent Models</h2>
                <p className="text-[13px] text-white/45 mb-4">Choose which model powers each agent. Leave empty to use defaults.</p>

                <div className="space-y-3">
                  {AGENT_ROLES.map(agent => {
                    const currentModel = getModelsForAgent(agent.id)
                    return (
                      <div key={agent.id} className="p-4 rounded-xl bg-[var(--surface-base)] border border-white/[0.08]">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-[13px] font-semibold text-white/70">{agent.name}</span>
                            <p className="text-[11px] text-white/40">{agent.description}</p>
                          </div>
                          {currentModel && (
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              currentModel.speed === "fast" ? "text-emerald-400/60 bg-emerald-500/[0.08]" :
                              currentModel.speed === "medium" ? "text-amber-400/60 bg-amber-500/[0.08]" :
                              "text-blue-400/60 bg-blue-500/[0.08]"
                            }`}>
                              {currentModel.speed}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                        <select
                          value={agentModels[agent.id]?.provider && agentModels[agent.id]?.model
                            ? `${agentModels[agent.id].provider}::${agentModels[agent.id].model}`
                            : ""
                          }
                          onChange={e => {
                            const val = e.target.value
                            if (!val) {
                              setAgentModels(prev => ({ ...prev, [agent.id]: { provider: "", model: "" } }))
                            } else {
                              const [provider, model] = val.split("::")
                              setAgentModels(prev => ({ ...prev, [agent.id]: { provider, model } }))
                            }
                          }}
                          className="w-full bg-[#111] border border-white/[0.12] rounded-lg px-3 py-2 pr-8 text-[13px] text-white/60 outline-none focus:border-[#404040] transition-colors appearance-none cursor-pointer"
                        >
                          <option value="">Default ({agent.id === "orchestrator" || agent.id === "review" || agent.id === "test" ? "Gemini 2.5 Flash" : "Claude Sonnet 4.6"})</option>
                          <optgroup label="OpenAI">
                            {MODEL_REGISTRY.filter(m => m.provider === "openai").map(m => (
                              <option key={m.id} value={`${m.provider}::${m.model}`}>{m.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Anthropic">
                            {MODEL_REGISTRY.filter(m => m.provider === "anthropic").map(m => (
                              <option key={m.id} value={`${m.provider}::${m.model}`}>{m.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Google Gemini">
                            {MODEL_REGISTRY.filter(m => m.provider === "gemini").map(m => (
                              <option key={m.id} value={`${m.provider}::${m.model}`}>{m.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Z AI">
                            {MODEL_REGISTRY.filter(m => m.provider === "glm").map(m => (
                              <option key={m.id} value={`${m.provider}::${m.model}`}>{m.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="OpenRouter">
                            {MODEL_REGISTRY.filter(m => m.provider === "openrouter" && !m.free).map(m => (
                              <option key={m.id} value={`${m.provider}::${m.model}`}>{m.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="OpenRouter (Free)">
                            {MODEL_REGISTRY.filter(m => m.provider === "openrouter" && m.free).map(m => (
                              <option key={m.id} value={`${m.provider}::${m.model}`}>{m.label}</option>
                            ))}
                          </optgroup>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-white/35 mt-1.5 italic">Recommended: {agent.recommended}</p>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Save button */}
              <div className="flex justify-end pb-8">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-gold-500 hover:bg-gold-400 text-black transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
                  {saved ? "Saved" : "Save Settings"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
