"use client"

import type React from "react"
import { Loader2 } from "lucide-react"

const MainLoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-background bg-grainy">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-foreground font-medium font-mono text-sm tracking-widest uppercase">Initializing</p>
      </div>
    </div>
  )
}

export default MainLoadingScreen
