import { Card } from "./ui/card"
import { FolderOpen, MessageSquare } from "lucide-react"
import { Link } from "react-router-dom"

interface ProjectCardProps {
  id: string
  title: string
  isActive?: boolean
}

export function ProjectCard({ id, title, isActive }: ProjectCardProps) {
  return (
    <Link to={`/chat/${id}`}>
      <Card
        className={`w-full p-3 transition-all duration-200 cursor-pointer border ${
          isActive
            ? "bg-primary/15 border-primary/50 shadow-gold-glow"
            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/30"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isActive ? "bg-primary/25" : "bg-white/10"
          }`}>
            {isActive
              ? <MessageSquare className="w-4 h-4 text-primary" />
              : <FolderOpen className="w-4 h-4 text-muted-foreground" />
            }
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`font-medium text-sm truncate ${
              isActive ? "text-primary" : "text-foreground"
            }`}>{title}</h3>
            <p className={`text-xs mt-0.5 ${
              isActive ? "text-primary/70" : "text-muted-foreground"
            }`}>
              {isActive ? "Currently open" : "Click to open"}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
