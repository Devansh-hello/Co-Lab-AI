import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Code, Database, ShieldCheck, Cpu, ArrowRight } from "lucide-react"
import { TerminalWindow } from "./TerminalWindow"

const agents = [
  {
    icon: Cpu,
    title: "Coordinator Agent",
    role: "Orchestrator",
    description:
      "Analyzes your prompt, selects the tech stack, creates a task breakdown, and delegates to each specialized agent.",
    skills: ["Architecture Planning", "Tech Stack Selection", "Task Delegation"],
    colorClass: "text-gold",
    bgClass: "bg-gold/10",
    borderClass: "border-gold/20",
  },
  {
    icon: Code,
    title: "Frontend Agent",
    role: "UI Specialist",
    description:
      "Generates production-ready React components with an isolated context window — only sees UI requirements.",
    skills: ["React", "TypeScript", "Tailwind CSS"],
    colorClass: "text-blue-400",
    bgClass: "bg-blue-400/10",
    borderClass: "border-blue-400/20",
  },
  {
    icon: Database,
    title: "Backend Agent",
    role: "API Specialist",
    description:
      "Builds Node.js/Express API routes and database logic in an isolated server context — focused on clean architecture.",
    skills: ["Node.js", "REST APIs", "Database Logic"],
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-400/10",
    borderClass: "border-emerald-400/20",
  },
  {
    icon: ShieldCheck,
    title: "Review Agent",
    role: "QA Engineer",
    description:
      "Cross-references frontend API calls against backend routes, auto-corrects mismatches, and writes documentation.",
    skills: ["API Validation", "Integration QA", "Documentation"],
    colorClass: "text-purple-400",
    bgClass: "bg-purple-400/10",
    borderClass: "border-purple-400/20",
  },
]

const providers = [
  { name: "Anthropic", model: "claude-*" },
  { name: "Google", model: "gemini-*" },
  { name: "xAI", model: "grok-*" },
  { name: "OpenRouter", model: "multi" },
]

export function IntegrationSection() {
  return (
    <section id="agents" className="py-16 md:py-24 px-4 md:px-6 bg-card/20">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <p
            className="text-xs md:text-sm font-mono text-muted-foreground/50 mb-3 md:mb-4 tracking-wide uppercase"
            style={{ animation: "fade-slide-up 0.5s 0s ease both" }}
          >
            Meet the Team
          </p>
          <h2
            className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-3 md:mb-4 tracking-tight"
            style={{ animation: "fade-slide-up 0.6s 0.1s ease both" }}
          >
            Specialized Agents, Working as One
          </h2>
          <p
            className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto px-2"
            style={{ animation: "fade-slide-up 0.6s 0.2s ease both" }}
          >
            Each agent has a tailored system prompt for its domain — output quality surpasses what any single model can achieve.
          </p>
        </div>

        {/* Agent Cards */}
        <div className="grid md:grid-cols-2 gap-3 md:gap-4 mb-8 md:mb-12">
          {agents.map((agent, i) => (
            <Card
              key={i}
              className={`group border-border/50 bg-card/50 hover:bg-card/80 hover:border-border transition-all duration-300 hover:-translate-y-1 shadow-elevation-1 hover:shadow-elevation-2`}
              style={{ animation: `fade-slide-up 0.5s ${0.2 + i * 0.1}s ease both` }}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${agent.bgClass} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <agent.icon className={`h-5 w-5 ${agent.colorClass}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{agent.title}</CardTitle>
                    <span className={`text-xs font-mono ${agent.colorClass}/70`}>{agent.role}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-400/60">ACTIVE</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="-mt-2">
                <CardDescription className="leading-relaxed mb-4">
                  {agent.description}
                </CardDescription>
                <div className="flex flex-wrap gap-1.5">
                  {agent.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className={`text-[11px] font-mono ${agent.borderClass} text-muted-foreground`}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Model Routing Terminal */}
        <div
          className="hidden sm:block max-w-2xl mx-auto"
          style={{ animation: "fade-slide-up 0.6s 0.6s ease both" }}
        >
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
                  <span className="text-white/40 text-[11px] w-4 select-none">{i + 1}.</span>
                  <span className="text-white/30 text-[11px]">provider</span>
                  <span className="text-[11px] font-bold text-gold">{p.name}</span>
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
