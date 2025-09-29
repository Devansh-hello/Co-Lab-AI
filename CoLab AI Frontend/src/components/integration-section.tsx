import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Code, Database, FileText, Settings } from "lucide-react"

export function IntegrationSection() {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">AI Integration & Capabilities</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powered by OpenAI SDK and OpenRouter to access multiple LLM providers with specialized agent capabilities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Code className="h-6 w-6 text-primary" />
                <CardTitle>Frontend Agent</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Specialized in UI/UX development, component creation, and user interface optimization.
              </CardDescription>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">CSS</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-primary" />
                <CardTitle>Backend Agent</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Handles server-side logic, API development, database operations, and system architecture.
              </CardDescription>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Node.js</Badge>
                <Badge variant="secondary">APIs</Badge>
                <Badge variant="secondary">Databases</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <CardTitle>Documentation Agent</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Creates comprehensive documentation, code comments, and technical specifications.
              </CardDescription>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Technical Writing</Badge>
                <Badge variant="secondary">Code Comments</Badge>
                <Badge variant="secondary">Specifications</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-primary" />
                <CardTitle>Orchestration Agent</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Coordinates between agents, manages workflows, and ensures unified project outcomes.
              </CardDescription>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Workflow Management</Badge>
                <Badge variant="secondary">Coordination</Badge>
                <Badge variant="secondary">Quality Control</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
