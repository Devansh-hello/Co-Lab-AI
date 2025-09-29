import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { FolderOpen, Edit3 } from "lucide-react"

interface ProjectCardProps {
  title: string
}

export function ProjectCard({ title }: ProjectCardProps) {
  return (
    <Card className="w-full p-4 bg-white/80 border-[#CFAB8D]/30 hover:bg-white/90 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#CFAB8D]/20">
            <FolderOpen className="w-5 h-5 text-[#8B6F47]" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800 text-sm">{title}</h3>
            <p className="text-xs text-gray-600 mt-1">Active project</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-[#8B6F47] hover:bg-[#CFAB8D]/20 hover:text-[#8B6F47]">
          <Edit3 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}
