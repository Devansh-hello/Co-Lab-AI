import { type ReactNode } from "react"

interface CollapseProps {
  open: boolean
  children: ReactNode
  className?: string
}

/**
 * CSS grid trick: animate grid-template-rows from 0fr to 1fr.
 * No JS height measurement, no transitionend listeners, no flakiness.
 */
export function Collapse({ open, children, className = "" }: CollapseProps) {
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        opacity: open ? 1 : 0,
        transition: "grid-template-rows 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
      }}
    >
      <div style={{ overflow: "hidden", minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}
