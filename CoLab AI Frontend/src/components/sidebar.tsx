import { ProjectCard } from "./projectCard";

export function Sidebar(){
    return <div className="flex flex-col basis-lg border-2 rounded-lg w-full h-full items-center p-3 gap-3 bg-[#D9C4B0]">

        <div className="text-2xl px-6 py-2 border-2 rounded-lg font-mono bg-[#CFAB8D]">
            Projects
        </div>

        <div className="flex flex-col border-2 p-3 rounded-lg gap-3 w-full h-full items-center justify-start">
            <ProjectCard content="Calculator app"></ProjectCard>
        </div>
    </div>
}