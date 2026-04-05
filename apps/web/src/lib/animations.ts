/**
 * Co-Lab AI Animation Utilities
 * Powered by GSAP — fast, minimal, intentional motion.
 *
 * Duration guide:
 *   instant  100ms  — micro-feedback (button press)
 *   fast     150ms  — UI transitions (hover, toggle)
 *   normal   200ms  — standard reveals
 *   slow     300ms  — entrance/exit of significant content
 */

import gsap from "gsap"

/** Check user's reduced-motion preference once at module load */
export const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

// ─── Staggered Entry ─────────────────────────────────────────

export function staggerIn(selector: string | Element[], delay = 0.04) {
  if (prefersReducedMotion) {
    gsap.set(selector, { opacity: 1, y: 0 })
    return
  }
  return gsap.fromTo(
    selector,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.25, stagger: delay, ease: "power2.out" }
  )
}

export function staggerScale(selector: string | Element[]) {
  if (prefersReducedMotion) {
    gsap.set(selector, { opacity: 1, scale: 1 })
    return
  }
  return gsap.fromTo(
    selector,
    { opacity: 0, scale: 0.92 },
    { opacity: 1, scale: 1, duration: 0.25, stagger: 0.05, ease: "power2.out" }
  )
}

// ─── Counter Animation ───────────────────────────────────────

export function animateCounter(
  element: HTMLElement,
  target: number,
  duration = 0.8,
  suffix = ""
) {
  if (prefersReducedMotion) {
    element.textContent = Math.round(target) + suffix
    return
  }
  const obj = { val: 0 }
  return gsap.to(obj, {
    val: target,
    duration,
    ease: "power3.out",
    onUpdate: () => {
      element.textContent = Math.round(obj.val) + suffix
    },
  })
}

// ─── Ring Gauge ──────────────────────────────────────────────

export function animateRing(
  element: SVGCircleElement,
  percentage: number,
  circumference: number,
  duration = 0.8
) {
  const offset = circumference - (percentage / 100) * circumference
  if (prefersReducedMotion) {
    gsap.set(element, { attr: { "stroke-dashoffset": offset } })
    return
  }
  return gsap.fromTo(
    element,
    { attr: { "stroke-dashoffset": circumference } },
    { attr: { "stroke-dashoffset": offset }, duration, ease: "power3.out" }
  )
}

// ─── Coverage Bar Fill ───────────────────────────────────────

export function animateBar(element: HTMLElement, percentage: number, duration = 0.5) {
  if (prefersReducedMotion) {
    gsap.set(element, { width: `${Math.min(percentage, 100)}%` })
    return
  }
  return gsap.fromTo(
    element,
    { width: "0%" },
    { width: `${Math.min(percentage, 100)}%`, duration, ease: "power2.out" }
  )
}

// ─── Card Entrance ───────────────────────────────────────────

export function cardEntrance(element: HTMLElement, delay = 0) {
  if (prefersReducedMotion) {
    gsap.set(element, { opacity: 1, y: 0 })
    return
  }
  return gsap.fromTo(
    element,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.3, delay, ease: "power2.out" }
  )
}

// ─── Grade Reveal ────────────────────────────────────────────

export function gradeReveal(element: HTMLElement) {
  if (prefersReducedMotion) {
    gsap.set(element, { opacity: 1, scale: 1 })
    return
  }
  const tl = gsap.timeline()
  tl.fromTo(element, { scale: 0, opacity: 0 }, { scale: 1.1, opacity: 1, duration: 0.25, ease: "power2.out" })
    .to(element, { scale: 1, duration: 0.15, ease: "power1.inOut" })
  return tl
}

// ─── Pipeline Flow ───────────────────────────────────────────

export function pipelineFlow(lineElements: HTMLElement[]) {
  if (prefersReducedMotion) {
    gsap.set(lineElements, { scaleX: 1, opacity: 0.3 })
    return
  }
  return gsap.fromTo(
    lineElements,
    { scaleX: 0, opacity: 0 },
    { scaleX: 1, opacity: 0.3, duration: 0.3, stagger: 0.1, ease: "power2.out" }
  )
}

// ─── Pulse Glow ──────────────────────────────────────────────

export function pulseGlow(element: HTMLElement, color: string) {
  if (prefersReducedMotion) return
  return gsap.fromTo(
    element,
    { boxShadow: `0 0 0px ${color}00` },
    {
      boxShadow: `0 0 20px ${color}40`,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    }
  )
}

// ─── Feedback Spin ───────────────────────────────────────────

export function feedbackSpin(element: HTMLElement) {
  if (prefersReducedMotion) return
  return gsap.to(element, {
    rotation: 360,
    duration: 3,
    repeat: -1,
    ease: "none",
  })
}

// ─── Shimmer Sweep ───────────────────────────────────────────

export function shimmerSweep(element: HTMLElement) {
  if (prefersReducedMotion) return
  return gsap.fromTo(
    element,
    { backgroundPosition: "-200% 0" },
    { backgroundPosition: "200% 0", duration: 2, ease: "sine.inOut" }
  )
}

// ─── Number Morph ────────────────────────────────────────────

export function morphNumber(
  element: HTMLElement,
  from: number,
  to: number,
  duration = 0.5,
  suffix = "%"
) {
  if (prefersReducedMotion) {
    element.textContent = Math.round(to) + suffix
    return
  }
  const obj = { val: from }
  return gsap.to(obj, {
    val: to,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      element.textContent = Math.round(obj.val) + suffix
    },
  })
}
