import { useRef, useEffect, type ReactNode } from "react"

interface CollapseProps {
  open: boolean
  children: ReactNode
  className?: string
}

/** Duration must match --duration-normal (280ms) */
const COLLAPSE_DURATION = 280

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
      // Wait for expand animation to finish + small buffer
      setTimeout(() => {
        const el = contentRef.current
        if (!el) return

        const scrollParent = findScrollParent(el)
        if (!scrollParent) return

        const elRect = el.getBoundingClientRect()
        const containerRect = scrollParent.getBoundingClientRect()

        const overflow = elRect.bottom - containerRect.bottom
        if (overflow > -60) {
          scrollParent.scrollBy({ top: overflow + 60, behavior: "smooth" })
        }
      }, COLLAPSE_DURATION + 30)
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
        transition: `grid-template-rows ${COLLAPSE_DURATION}ms var(--ease-spring), opacity ${COLLAPSE_DURATION}ms var(--ease-spring)`,
        willChange: open ? "grid-template-rows, opacity" : undefined,
      }}
    >
      <div ref={contentRef} style={{ overflow: "hidden", minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}
