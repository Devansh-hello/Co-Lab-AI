import { Component, type ReactNode } from "react"
import { AlertOctagon, RefreshCw, Home } from "lucide-react"
import { Button } from "./ui/button"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background bg-grainy p-6">
          <div className="flex flex-col items-center gap-5 text-center max-w-md">
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
              <AlertOctagon className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              An unexpected error occurred. Please try refreshing the page or go back to the homepage.
            </p>
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="border-border/50 hover:text-foreground"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => (window.location.href = "/")}>
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
