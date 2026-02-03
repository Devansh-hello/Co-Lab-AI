import { Link } from "react-router-dom"
import { Home, AlertTriangle } from "lucide-react"
import { Button } from "../components/ui/button"

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background bg-grainy p-6 gap-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <AlertTriangle className="w-16 h-16 text-primary/60" />
        <h1 className="text-6xl font-bold text-foreground tracking-tight">404</h1>
        <p className="text-muted-foreground text-lg">
          This page doesn't exist or has been moved.
        </p>
        <Button asChild className="mt-4 rounded-full shadow-gold-glow">
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default NotFound
