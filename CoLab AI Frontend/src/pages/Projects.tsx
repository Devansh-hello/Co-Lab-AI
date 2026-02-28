"use client"

import { useState } from "react"
import { CreateProjectModal } from "../components/CreateProject"
import { Button } from "../components/ui/button"
import { Header } from "../components/header"
import { Plus, Edit3 } from "lucide-react"
import useContent from "../hooks/useContent"
import { Link } from "react-router-dom"

function ProjectPage() {
  const [open, setOpen] = useState(false)
  const projects = useContent()

  function modalState() {
    setOpen(true)
  }

  return (
    <>
      <CreateProjectModal
        open={open}
        onclose={() => {
          setOpen(false)
        }}
      />

      <div className="flex flex-col grow p-6 gap-6 min-h-screen w-full bg-background bg-grainy items-center">
        <Header />

        <div className="flex flex-row justify-between items-center p-6 gap-4 w-full max-w-4xl bg-card rounded-[2.5rem] border border-border shadow-directional">
          <h1 className="text-foreground text-3xl font-bold tracking-wide">Your Projects</h1>

          <Button
            onClick={modalState}
            className="bg-primary hover:bg-gold-600 text-primary-foreground font-bold px-6 py-3 rounded-full transition-bouncy duration-300 hover:-translate-y-1 hover:scale-105 shadow-gold-glow flex items-center gap-2"
          >
            <Plus size={18} />
            New Project
          </Button>
        </div>

        {projects.map(({ name, description, _id }) => (
          <div
            key={_id}
            className="flex flex-row p-6 bg-card rounded-[2.5rem] w-full max-w-4xl min-h-[120px] justify-between items-center border border-border hover:border-primary/50 hover:cursor-pointer transition-bouncy hover:-translate-y-1 hover:scale-[1.02] shadow-directional hover:shadow-gold-glow"
          >
            <Link to={"/chat/" + _id} className="flex-1">
              <div>
                <h1 className="text-xl font-bold text-foreground mb-2">{name}</h1>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </Link>

            <Button variant="outline" className="rounded-full border-border hover:border-primary text-foreground font-medium px-4 py-2 transition-bouncy hover:scale-105 hover:-translate-y-1 flex items-center gap-2 ml-4">
              <Edit3 size={16} />
              Edit
            </Button>
          </div>
        ))}
      </div>
    </>
  )
}

export default ProjectPage
