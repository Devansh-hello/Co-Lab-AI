import { GitMerge, Brain, ShieldCheck, Users, Globe } from "lucide-react"

const differentiators = [
  {
    number: "01",
    icon: GitMerge,
    title: "Multi-Agent Parallelization",
    diffLabel: "diff --sequential vs --parallel",
    traditional: "Generates one file at a time. Backend first, frontend second. You wait for the whole chain.",
    modern:
      "Frontend & Backend Agents execute simultaneously. Full-stack apps ship significantly faster.",
    iconColor: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
  },
  {
    number: "02",
    icon: Brain,
    title: "Isolated Contexts",
    diffLabel: "diff --monolithic vs --isolated",
    traditional:
      "One context window holds all code. As projects grow: context amnesia, high token costs, sluggish performance.",
    modern:
      "Each agent holds only its domain context. Frontend only sees UI. Backend only sees server logic. Drastically lower costs.",
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Automated QA & Self-Correction",
    diffLabel: "diff --manual-qa vs --automated-qa",
    traditional:
      "You manually verify if frontend API calls match backend routes and prompt the AI to fix each mismatch.",
    modern:
      "Review Agent auto cross-references the generated code and fixes integration bugs before you run a single command.",
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/20",
  },
  {
    number: "04",
    icon: Users,
    title: "Team-Based Delegation",
    diffLabel: "diff --generalist vs --specialists",
    traditional:
      "You micromanage one AI trying to be a jack-of-all-trades. Output quality degrades as complexity grows.",
    modern:
      "An Orchestrator acts as your PM. Domain-specialized agents with tailored system prompts deliver higher quality.",
    iconColor: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/20",
  },
  {
    number: "05",
    icon: Globe,
    title: "Model-Agnostic Routing",
    diffLabel: "diff --vendor-lock vs --open-routing",
    traditional:
      "Locked into one provider's ecosystem — one model for every task regardless of cost or capability.",
    modern:
      "Dynamically routes across Anthropic, Google, xAI, and OpenRouter — cheap models for docs, powerful ones for logic.",
    iconColor: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/20",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 px-6 bg-card/20">
      <div className="container mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-primary/20 bg-primary/5 text-xs font-mono mb-5"
            style={{ animation: "fade-slide-up 0.5s 0s ease both" }}
          >
            <span className="text-primary/50">$</span>
            <span className="text-primary/70">colab-minds diff --market</span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
            style={{ animation: "fade-slide-up 0.6s 0.1s ease both" }}
          >
            How Co-Lab Minds Stands Out
          </h2>
          <p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            style={{ animation: "fade-slide-up 0.6s 0.2s ease both" }}
          >
            Most AI coding tools rely on a sequential, monolithic LLM approach. We introduced a distributed,
            multi-agent architecture that solves five key industry pain points.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {differentiators.map((d, i) => (
            <div
              key={i}
              className={`rounded-2xl border ${d.borderColor} overflow-hidden hover:shadow-gold-glow hover:-translate-y-1 transition-all duration-500 group`}
              style={{ animation: `fade-slide-up 0.5s ${0.2 + i * 0.09}s ease both` }}
            >
              {/* Card header — CLI-styled */}
              <div className="px-4 py-3 border-b border-border/40 bg-card/60">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg ${d.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <d.icon className={`h-3.5 w-3.5 ${d.iconColor}`} />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground/30">{d.number}</span>
                  <h3 className="text-sm font-semibold text-foreground">{d.title}</h3>
                </div>
                <span className={`text-[10px] font-mono ${d.iconColor} opacity-50`}>{d.diffLabel}</span>
              </div>

              {/* Traditional — diff removal style */}
              <div className="px-4 py-3 border-b border-border/20 bg-[rgba(239,68,68,0.04)]">
                <div className="flex items-start gap-2">
                  <span className="text-red-500/50 font-mono text-sm mt-0.5 select-none flex-shrink-0">-</span>
                  <p className="text-xs text-muted-foreground/65 leading-relaxed">{d.traditional}</p>
                </div>
                <span className="text-[9px] font-mono text-red-500/25 uppercase tracking-widest mt-2 block">
                  traditional
                </span>
              </div>

              {/* Co-Lab Minds — diff addition style */}
              <div className={`px-4 py-3 ${d.bgColor}`}>
                <div className="flex items-start gap-2">
                  <span className={`font-mono text-sm mt-0.5 select-none flex-shrink-0 ${d.iconColor} opacity-70`}>+</span>
                  <p className="text-xs text-foreground/80 leading-relaxed">{d.modern}</p>
                </div>
                <span className={`text-[9px] font-mono ${d.iconColor} opacity-40 uppercase tracking-widest mt-2 block`}>
                  co-lab minds
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
