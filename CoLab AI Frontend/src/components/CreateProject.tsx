"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Button } from "./ui/button"
import { X, Loader2 } from "lucide-react"
import { sendProject } from "../functions/send"

interface projectmodal {
  open: boolean
  onclose?: () => void
}

export function CreateProjectModal({ open, onclose }: projectmodal) {
  const projectNameRef = useRef<HTMLInputElement>(null)
  const projectDescriptionRef = useRef<HTMLInputElement>(null)
  const [done, setdone] = useState(false)
  const [loading, setLoading] = useState<boolean>(false)

  async function createProject() {
    const name = projectNameRef.current?.value
    const description = projectDescriptionRef.current?.value
    console.log("hello")
    setLoading(true)
    try {
      const { res, status } = await sendProject(name, description)

      if (status == 200) {
        setdone(true)
        window.location.href = "/projects"
      }

    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  function onInputKeyHandler(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      projectDescriptionRef.current?.focus()
    }
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      createProject()
    }
  }

  return (
    <div>
      {open && (
        <div className="flex w-screen h-screen bg-black/40 backdrop-blur-sm fixed top-0 left-0 z-50 transition-all duration-300 ease-in-out">
          <div className="flex justify-center items-center w-full h-full p-4">
            <div className="bg-white/90 backdrop-blur-md flex flex-col p-8 gap-6 rounded-2xl w-[90%] max-w-md border border-white/30 shadow-2xl">
              <div className="flex flex-row justify-between items-center bg-[#CFAB8D]/30 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <h1 className="font-montserrat text-xl font-semibold text-black">Create Project</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onclose}
                  className="hover:bg-red-100 hover:text-red-600 transition-colors duration-200 p-2 rounded-lg"
                >
                  <X size={20} />
                </Button>
              </div>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="font-SourceCodePro text-sm font-medium text-gray-700">Project Name</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg p-3 font-SourceCodePro bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#CFAB8D] focus:border-transparent transition-all duration-200"
                    placeholder="Enter Your Project Name"
                    ref={projectNameRef}
                    onKeyUp={onInputKeyHandler}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-SourceCodePro text-sm font-medium text-gray-700">Description</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg p-3 font-SourceCodePro bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#CFAB8D] focus:border-transparent transition-all duration-200"
                    placeholder="Enter Your Project Description"
                    ref={projectDescriptionRef}
                    onKeyUp={onInputKey}
                  />
                </div>
              </div>
              <Button
                onClick={createProject}
                disabled={loading}
                className="w-full bg-[#CFAB8D] hover:bg-[#B8956F] text-black font-medium py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm border border-white/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
