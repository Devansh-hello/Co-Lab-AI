import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Brain, Shield, Layers, Gauge } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "Extended Context Window",
      description:
        "Distributed memory across agents effectively increases total context capacity for complex projects.",
    },
    {
      icon: Shield,
      title: "Reduced Hallucination",
      description: "Task specialization and agent cross-verification significantly lower incorrect outputs.",
    },
    {
      icon: Layers,
      title: "Robustness",
      description: "Decentralized workflow avoids single points of failure for reliable performance.",
    },
    {
      icon: Gauge,
      title: "Versatility",
      description: "Applicable across domains including coding, research, content creation, and documentation.",
    },
  ]

  return (
    <section className="py-20 px-6 bg-card/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose Multi-Agent Systems?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our approach distributes workload across specialized agents for frontend, backend, documentation, and
            orchestration tasks.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-border hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
