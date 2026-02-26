"use client"

import { Loader2, Sparkles } from "lucide-react"

export default function MainLoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background bg-grainy z-50">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <Sparkles className="h-10 w-10 text-primary/30 absolute -top-1 -right-1" />
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
        <p className="text-muted-foreground font-mono text-xs tracking-[0.2em] uppercase">
          Initializing
        </p>
      </div>
    </div>
  )
}
