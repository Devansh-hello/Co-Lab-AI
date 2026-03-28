import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom"
import { AlertOctagon, RefreshCw, Home } from "lucide-react"
import { Button } from "../components/ui/button"

export default function ErrorPage() {
  const error = useRouteError()

  let title = "Something went wrong"
  let message = "An unexpected error occurred. Please try refreshing the page."

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Page not found"
      message = "This page doesn't exist or has been moved."
    } else if (error.status === 500) {
      title = "Server error"
      message = "Something went wrong on our end. Please try again later."
    } else {
      title = `Error ${error.status}`
      message = error.statusText || message
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background bg-grainy p-6">
      <div className="flex flex-col items-center gap-5 text-center max-w-md">
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
          <AlertOctagon className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-border/50 hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
