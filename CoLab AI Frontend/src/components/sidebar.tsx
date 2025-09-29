import useContent from "../hooks/useContent"
import { ProjectCard } from "../components/projectCard"
import { Button } from "../components/ui/button"
import { Plus, Layers3 } from "lucide-react"

export function Sidebar() {
  const projects = useContent()

  return (
    <div className="flex flex-col basis-lg border border-[#CFAB8D]/30 rounded-xl w-full h-full bg-[#D9C4B0]/95 backdrop-blur-sm shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-[#CFAB8D]/30">
        <div className="flex items-center gap-3 px-4 py-3 bg-[#CFAB8D]/40 rounded-lg backdrop-blur-sm">
          <Layers3 className="w-5 h-5 text-[#8B6F47]" />
          <h2 className="text-lg font-semibold text-[#8B6F47] font-mono">Projects</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {/* New Project Button */}
        <Button
          className="w-full bg-[#CFAB8D] hover:bg-[#B8956F] text-white border-0 shadow-sm transition-all duration-200 hover:shadow-md"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>

        {/* Project List */}
        <div className="space-y-2">
          {projects.map(({ name }, index) => (
            <div key={index} className="w-full">
              <ProjectCard title={name} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#CFAB8D]/30">
        <div className="text-center">
          <p className="text-xs text-[#8B6F47]/70 font-mono">
            {projects.length} active project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  )
}
