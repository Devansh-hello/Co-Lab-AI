import { Button } from "./ui/button"
import { ArrowRight, Zap, Users, Target } from "lucide-react"
import { TypewriterText } from "./typewriter-text"

export function HeroSection() {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Build with{" "}
            <TypewriterText
              text="Efficiency"
              speed={120}
              delay={2000}
              className="text-primary"
              showCursor={true}
              repeat={true}
              pauseDuration={4000}
            />
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Co Lab AI develops Multi-Agent Systems where specialized AI agents coordinate to accomplish complex tasks,
            creating more efficient and cost-effective solutions than traditional single-model approaches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="group">
              Start Building
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </div>

          {/* Key Benefits */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Cost Reduction</h3>
              <p className="text-sm text-muted-foreground">
                Specialized agents reduce unnecessary token usage and optimize resource allocation
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Human-like Collaboration</h3>
              <p className="text-sm text-muted-foreground">
                Mimics team-based problem-solving for improved trust and adoption
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Enhanced Efficiency</h3>
              <p className="text-sm text-muted-foreground">
                Parallel task execution improves throughput and response time
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
