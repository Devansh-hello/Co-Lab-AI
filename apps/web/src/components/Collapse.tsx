import { useRef, useEffect, type ReactNode } from "react"

interface CollapseProps {
  open: boolean
  children: ReactNode
  className?: string
}

function findScrollParent(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement
  while (node) {
    const style = getComputedStyle(node)
    if (style.overflowY === "auto" || style.overflowY === "scroll") return node
    node = node.parentElement
  }
  return null
}

export function Collapse({ open, children, className = "" }: CollapseProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(open)

  useEffect(() => {
    if (open && !wasOpen.current) {
      setTimeout(() => {
        const el = contentRef.current
        if (!el) return

        const scrollParent = findScrollParent(el)
        if (!scrollParent) return

        const elRect = el.getBoundingClientRect()
        const containerRect = scrollParent.getBoundingClientRect()

        // Check if bottom of content is below the scroll container's visible area
        const overflow = elRect.bottom - containerRect.bottom
        if (overflow > -60) {
          // Scroll enough to show content + 60px breathing room
          scrollParent.scrollBy({ top: overflow + 60, behavior: "smooth" })
        }
      }, 350)
    }
    wasOpen.current = open
  }, [open])

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
      <div ref={contentRef} style={{ overflow: "hidden", minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}
