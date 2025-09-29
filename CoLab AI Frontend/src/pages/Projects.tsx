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

  console.log(projects)
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

      <div className="flex flex-col grow p-6 gap-6 h-screen w-screen bg-gradient-to-br from-[#ECEEDF] to-[#D9C4B0] items-center">
        <Header />

        <div className="flex flex-row justify-between items-center p-6 gap-4 w-[55%] bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg">
          <h1 className="text-black text-3xl font-montserrat font-semibold">Your Projects</h1>

          <Button
            onClick={modalState}
            className="bg-[#CFAB8D] hover:bg-[#B8956F] text-black font-medium px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm border border-white/20 flex items-center gap-2"
          >
            <Plus size={18} />
            New Project
          </Button>
        </div>

        {projects.map(({ name, description, _id }) => (
          <div
            key={_id}
            className="flex flex-row p-6 bg-white/20 backdrop-blur-md rounded-2xl w-[50%] min-h-[120px] justify-between items-center border border-white/30 hover:bg-white/30 hover:scale-102 hover:cursor-pointer transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl"
          >
            <Link to={"/chat/" + _id} className="flex-1">
              <div>
                <h1 className="text-xl font-montserrat font-semibold text-black mb-2">{name}</h1>
                <p className="font-SourceCodePro text-[15px] text-gray-700 leading-relaxed">{description}</p>
              </div>
            </Link>

            <Button className="bg-[#D9C4B0] hover:bg-[#CFAB8D] text-black font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-white/20 flex items-center gap-2 ml-4">
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
