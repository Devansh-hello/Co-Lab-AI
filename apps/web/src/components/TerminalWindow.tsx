import type { ReactNode } from "react"

interface TerminalWindowProps {
  title?: string
  children: ReactNode
  className?: string
}

export function TerminalWindow({ title = "colab-minds — zsh", children, className = "" }: TerminalWindowProps) {
  return (
    <div
      className={`rounded-2xl border border-white/8 overflow-hidden ${className}`}
      style={{
        background: "rgba(6, 6, 6, 0.92)",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.06), 0 24px 48px rgba(0,0,0,0.6), 0 0 80px rgba(212,175,55,0.04)",
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center px-4 py-3 border-b border-white/6 select-none"
        style={{ background: "rgba(22,22,22,0.95)" }}
      >
        {/* Traffic lights */}
        <div className="flex gap-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57] opacity-80" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e] opacity-80" />
          <div className="w-3 h-3 rounded-full bg-[#28c840] opacity-80" />
        </div>
        <span className="text-[11px] font-mono text-white/25 flex-1 text-center -ml-10 tracking-wide">
          {title}
        </span>
      </div>

      {/* Terminal body */}
      <div className="scanlines relative">
        <div className="p-5 md:p-6 font-mono text-[13px] leading-6 space-y-0 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
