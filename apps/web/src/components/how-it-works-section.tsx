import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card"
import { MessageSquare, Cpu, Download, ArrowRight } from "lucide-react"
import Link from "next/link"

const steps = [
  {
    step: "1",
    icon: MessageSquare,
    title: "Describe Your Project",
    description: "Write a natural language prompt describing the app you want to build. Be as detailed or as vague as you like.",
    iconColor: "text-gold-500",
    bgColor: "bg-gold-500/10",
  },
  {
    step: "2",
    icon: Cpu,
    title: "Agents Build in Parallel",
    description: "The Coordinator analyzes your request, splits it into tasks, and dispatches specialized agents to work simultaneously.",
    iconColor: "text-gold-500",
    bgColor: "bg-gold-500/10",
  },
  {
    step: "3",
    icon: Download,
    title: "Review & Ship",
    description: "The Review Agent QA-checks everything, fixes integration issues, and delivers production-ready code to your IDE.",
    iconColor: "text-gold-500",
    bgColor: "bg-gold-500/10",
  },
]

export function HowItWorksSection() {
  return (
    <section className="relative py-16 md:py-24 px-4 md:px-8" style={{ backgroundColor: "#0c0a06" }}>
      {/* Gold radial glow — offset low-right for asymmetry */}
      <div className="absolute bottom-[10%] right-[15%] w-[700px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.02) 45%, transparent 70%)" }} />
      <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none bg-gradient-to-b from-black to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none bg-gradient-to-t from-black to-transparent" />
      <div className="relative mx-auto max-w-5xl">
        {/* Header — subtle fade, 300ms, no JS */}
        <div className="text-center mb-10 md:mb-14">
          <p
            className="text-[11px] font-mono text-gold-500/60 mb-3 tracking-[0.15em] uppercase font-bold animate-fade-slide-up"
            style={{ animationDuration: "0.3s" }}
          >
            How it works
          </p>
          <h2
            className="text-[clamp(1.4rem,3vw,2.2rem)] font-black text-foreground mb-3 tracking-[-0.03em] animate-fade-slide-up"
            style={{ animationDuration: "0.3s", animationDelay: "0.06s", animationFillMode: "both" }}
          >
            Three steps to production
          </h2>
          <p
            className="text-[14px] text-white/55 max-w-lg mx-auto leading-relaxed animate-fade-slide-up"
            style={{ animationDuration: "0.3s", animationDelay: "0.12s", animationFillMode: "both" }}
          >
            From idea to deployed application in minutes, not hours.
          </p>
        </div>

        {/* Steps — staggered CSS reveal */}
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div
              key={i}
              className="relative animate-fade-slide-up"
              style={{ animationDuration: "0.3s", animationDelay: `${0.12 + i * 0.08}s`, animationFillMode: "both" }}
            >
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[calc(50%+3rem)] w-[calc(100%-4rem)] h-px bg-border/40" />
              )}

              <Card className="border-white/[0.07] bg-white/[0.03] text-center h-full hover:bg-white/[0.05] hover:border-white/[0.12] transition-[background,border-color] duration-150">
                <CardHeader className="items-center">
                  <div className="relative mb-2">
                    <div className={`w-14 h-14 rounded-2xl ${s.bgColor} flex items-center justify-center`}>
                      <s.icon className={`h-7 w-7 ${s.iconColor}`} />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gold-500 text-black text-xs font-bold flex items-center justify-center">
                      {s.step}
                    </span>
                  </div>
                  <CardTitle className="text-[15px] text-white/90">{s.title}</CardTitle>
                </CardHeader>
                <CardContent className="-mt-2">
                  <CardDescription className="leading-relaxed text-[13px] text-white/55">
                    {s.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Mid-page CTA */}
        <div
          className="mt-10 md:mt-14 text-center animate-fade-slide-up"
          style={{ animationDuration: "0.3s", animationDelay: "0.4s", animationFillMode: "both" }}
        >
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 h-11 px-7 rounded-lg bg-gold-500/20 hover:bg-gold-500/35 border border-gold-500/40 hover:border-gold-500/70 text-gold-500 font-bold text-[14px] transition-[background,border-color] duration-150"
          >
            Start Building
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
          </Link>
        </div>
      </div>
    </section>
  )
}
