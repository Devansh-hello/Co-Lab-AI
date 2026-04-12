"use client"

import { useRef, useEffect, useCallback } from "react"
import gsap from "gsap"
import { Sidebar } from "./sidebar"

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const isAnimating = useRef(false)
  const isVisible = useRef(false)

  const animateClose = useCallback(() => {
    const backdrop = backdropRef.current
    const panel = panelRef.current
    if (!backdrop || !panel || isAnimating.current) return

    isAnimating.current = true
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        isAnimating.current = false
        isVisible.current = false
        onClose()
      },
    })
    tl.to(panel, { x: "-100%", duration: 0.28, force3d: true })
    tl.to(backdrop, { opacity: 0, duration: 0.22 }, "<0.04")
  }, [onClose])

  useEffect(() => {
    if (!open) return

    isVisible.current = true
    const backdrop = backdropRef.current
    const panel = panelRef.current
    if (!backdrop || !panel) return

    isAnimating.current = true
    gsap.set(panel, { x: "-100%" })
    gsap.set(backdrop, { opacity: 0 })

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => { isAnimating.current = false },
    })
    tl.to(backdrop, { opacity: 1, duration: 0.25 })
    tl.to(panel, { x: "0%", duration: 0.32, force3d: true }, "<0.03")

    return () => { tl.kill() }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={animateClose}
        style={{ opacity: 0 }}
      />
      {/* Panel — force3d layer prevents text re-rasterization during slide */}
      <div
        ref={panelRef}
        className="absolute top-0 left-0 h-full w-[280px] shadow-elevation-3"
        style={{ transform: "translateX(-100%)", willChange: "transform", backfaceVisibility: "hidden" }}
      >
        <Sidebar mobile onMobileClose={animateClose} />
      </div>
    </div>
  )
}
