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
  const [loading, setLoading] = useState<boolean>(false)

  async function createProject() {
    const name = projectNameRef.current?.value
    const description = projectDescriptionRef.current?.value

    if (!name || !description) return;

    setLoading(true)
    try {
      const response = await sendProject(name, description)

      if (response && response.status == 200) {
        window.location.href = "/projects"
      }

    } catch (err) {
      console.error("[createProject]", err)
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
            <div className="bg-card flex flex-col p-8 gap-6 rounded-2xl w-[90%] max-w-md border border-border shadow-directional">
              <div className="flex flex-row justify-between items-center bg-primary/10 p-4 rounded-xl border border-primary/20">
                <h1 className="font-sans text-xl font-semibold text-foreground tracking-wide">Create Project</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onclose}
                  className="hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-colors duration-200 p-2 rounded-lg"
                >
                  <X size={20} />
                </Button>
              </div>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="font-mono text-sm font-medium text-muted-foreground">Project Name</label>
                  <input
                    className="w-full border border-border rounded-lg p-3 font-mono bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground"
                    placeholder="Enter Your Project Name"
                    ref={projectNameRef}
                    onKeyUp={onInputKeyHandler}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-sm font-medium text-muted-foreground">Description</label>
                  <input
                    className="w-full border border-border rounded-lg p-3 font-mono bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground"
                    placeholder="Enter Your Project Description"
                    ref={projectDescriptionRef}
                    onKeyUp={onInputKey}
                  />
                </div>
              </div>
              <Button
                onClick={createProject}
                disabled={loading}
                className="w-full bg-primary hover:bg-gold-600 text-primary-foreground font-bold py-3 rounded-xl transition-all duration-300 shadow-gold-glow flex items-center justify-center gap-2"
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
