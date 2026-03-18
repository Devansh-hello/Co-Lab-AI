import { Badge } from "./ui/badge"
import { Code, Database, ShieldCheck, Cpu, ArrowRight } from "lucide-react"
import { TerminalWindow } from "./TerminalWindow"

const agents = [
  {
    icon: Cpu,
    title: "Coordinator Agent",
    processName: "coordinator",
    role: "orchestrator",
    pid: "2401",
    description:
      "Analyzes your prompt, selects the tech stack, creates a task breakdown, and delegates to each specialized agent. You talk to it — it runs the team.",
    skills: ["Architecture Planning", "Tech Stack Selection", "Task Delegation"],
    colorClass: "text-primary",
    bgClass: "bg-primary/10",
    borderClass: "border-primary/30",
  },
  {
    icon: Code,
    title: "Frontend Agent",
    processName: "agent-frontend",
    role: "ui-specialist",
    pid: "2418",
    description:
      "Generates production-ready React components with an isolated context window — it only sees UI requirements, eliminating cross-domain token waste.",
    skills: ["React", "TypeScript", "Tailwind / CSS"],
    colorClass: "text-blue-400",
    bgClass: "bg-blue-400/10",
    borderClass: "border-blue-400/20",
  },
  {
    icon: Database,
    title: "Backend Agent",
    processName: "agent-backend",
    role: "api-specialist",
    pid: "2419",
    description:
      "Builds Node.js/Express API routes and database logic in an isolated server context — never sees frontend CSS, focused entirely on clean architecture.",
    skills: ["Node.js / Express", "REST API Design", "Database Logic"],
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-400/10",
    borderClass: "border-emerald-400/20",
  },
  {
    icon: ShieldCheck,
    title: "Review Agent",
    processName: "agent-review",
    role: "qa-engineer",
    pid: "2435",
    description:
      "Cross-references frontend API calls against backend routes, auto-corrects mismatches, then authors the README and setup docs — QA and tech writer in one.",
    skills: ["API Validation", "Integration QA", "README & Docs"],
    colorClass: "text-purple-400",
    bgClass: "bg-purple-400/10",
    borderClass: "border-purple-400/20",
  },
]

const providers = [
  { name: "Anthropic", model: "claude-*" },
  { name: "Google",    model: "gemini-*" },
  { name: "xAI",       model: "grok-*" },
  { name: "OpenRouter",model: "multi"   },
]

export function IntegrationSection() {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-primary/20 bg-primary/5 text-xs font-mono mb-5"
            style={{ animation: "fade-slide-up 0.5s 0s ease both" }}
          >
            <span className="text-primary/50">$</span>
            <span className="text-primary/70">colab-minds agents --list --status active</span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
            style={{ animation: "fade-slide-up 0.6s 0.1s ease both" }}
          >
            Specialized Agents, Working as One
          </h2>
          <p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            style={{ animation: "fade-slide-up 0.6s 0.2s ease both" }}
          >
            Each agent has a highly specific system prompt tailored to its domain — output quality surpasses
            what any generalized model can achieve alone.
          </p>
        </div>

        {/* Agent Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {agents.map((agent, i) => (
            <div
              key={i}
              className={`rounded-2xl border ${agent.borderClass} overflow-hidden hover:shadow-gold-glow hover:-translate-y-1 transition-all duration-500 group`}
              style={{ animation: `fade-slide-up 0.5s ${0.2 + i * 0.1}s ease both` }}
            >
              {/* CLI-style process header */}
              <div className="px-4 py-2.5 border-b border-border/40 bg-card/70 font-mono flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg ${agent.bgClass} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <agent.icon className={`h-3.5 w-3.5 ${agent.colorClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-bold tracking-wider ${agent.colorClass}`}>
                      {agent.processName}
                    </span>
                    <span className="text-white/15 text-xs">│</span>
                    <span className="text-white/30 text-[10px]">--role {agent.role}</span>
                    <span className="text-white/15 text-xs">│</span>
                    <span className="text-white/20 text-[10px]">pid:{agent.pid}</span>
                  </div>
                </div>
                {/* Status dot */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400/60">ACTIVE</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <h3 className="font-semibold text-foreground text-sm mb-2">{agent.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{agent.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {agent.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className={`text-[11px] font-mono border ${agent.borderClass} bg-transparent`}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Model-Agnostic Routing — terminal style */}
        <div style={{ animation: "fade-slide-up 0.6s 0.6s ease both" }}>
          <TerminalWindow title="router.config — model-agnostic routing">
            <div className="space-y-1.5">
              <div className="text-white/40 text-[12px] mb-3">
                # Dynamic routing based on task complexity &amp; cost
              </div>
              {providers.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3"
                  style={{ animation: `terminal-line-in 0.25s ${700 + i * 150}ms ease both`, opacity: 0 }}
                >
                  <span className="text-primary/50 text-[11px] w-4 select-none">{i + 1}.</span>
                  <span className="text-white/30 text-[11px]">provider</span>
                  <span className="text-[11px] font-bold text-primary">{p.name}</span>
                  <span className="text-white/15 mx-1">│</span>
                  <span className="text-white/25 text-[11px]">model</span>
                  <span className="text-blue-400/70 text-[11px] font-mono">{p.model}</span>
                  {i < providers.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-white/10 ml-auto" />
                  )}
                </div>
              ))}
              <div
                className="text-emerald-400/60 text-[11px] mt-4 pt-3 border-t border-white/5"
                style={{ animation: `terminal-line-in 0.25s 1400ms ease both`, opacity: 0 }}
              >
                ✓ Router initialized — 4 providers available
                <span className="inline-block w-[8px] h-[13px] bg-primary ml-1.5 animate-blink-cursor" />
              </div>
            </div>
          </TerminalWindow>
        </div>
      </div>
    </section>
  )
}
