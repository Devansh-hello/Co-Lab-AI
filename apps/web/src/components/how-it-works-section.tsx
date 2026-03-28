import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card"
import { MessageSquare, Cpu, Download } from "lucide-react"

const steps = [
  {
    step: "1",
    icon: MessageSquare,
    title: "Describe Your Project",
    description: "Write a natural language prompt describing the app you want to build. Be as detailed or as vague as you like.",
    iconColor: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  {
    step: "2",
    icon: Cpu,
    title: "Agents Build in Parallel",
    description: "The Coordinator analyzes your request, splits it into tasks, and dispatches specialized agents to work simultaneously.",
    iconColor: "text-gold",
    bgColor: "bg-gold/10",
  },
  {
    step: "3",
    icon: Download,
    title: "Review & Ship",
    description: "The Review Agent QA-checks everything, fixes integration issues, and delivers production-ready code to your IDE.",
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 px-4 md:px-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <p
            className="text-xs md:text-sm font-mono text-muted-foreground/50 mb-3 md:mb-4 tracking-wide uppercase"
            style={{ animation: "fade-slide-up 0.5s 0s ease both" }}
          >
            How it works
          </p>
          <h2
            className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-3 md:mb-4 tracking-tight"
            style={{ animation: "fade-slide-up 0.6s 0.1s ease both" }}
          >
            Three steps to production
          </h2>
          <p
            className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto px-2"
            style={{ animation: "fade-slide-up 0.6s 0.2s ease both" }}
          >
            From idea to deployed application in minutes, not hours.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <div
              key={i}
              className="relative"
              style={{ animation: `fade-slide-up 0.5s ${0.2 + i * 0.12}s ease both` }}
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[calc(50%+3rem)] w-[calc(100%-4rem)] h-px bg-border/40" />
              )}

              <Card className="border-border/50 bg-card/50 text-center h-full shadow-elevation-1">
                <CardHeader className="items-center">
                  <div className="relative mb-2">
                    <div className={`w-14 h-14 rounded-2xl ${s.bgColor} flex items-center justify-center`}>
                      <s.icon className={`h-7 w-7 ${s.iconColor}`} />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {s.step}
                    </span>
                  </div>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </CardHeader>
                <CardContent className="-mt-2">
                  <CardDescription className="leading-relaxed">
                    {s.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
