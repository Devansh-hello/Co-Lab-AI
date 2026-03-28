/**
 * Co-Lab AI Animation Utilities
 * Powered by anime.js v4 — mission-control aesthetic
 *
 * Design philosophy: cinematic reveals for pipeline stages,
 * physics-based micro-interactions, staggered orchestration.
 */

import { animate, stagger, createTimeline } from 'animejs';

// ─── Staggered Entry ─────────────────────────────────────────
// Used for lists of items (test results, tasks, messages)

export function staggerIn(selector: string | Element[], delay = 50) {
  return animate(selector, {
    opacity: [0, 1],
    translateY: [12, 0],
    duration: 400,
    delay: stagger(delay, { start: 100 }),
    ease: 'outExpo',
  });
}

export function staggerScale(selector: string | Element[]) {
  return animate(selector, {
    opacity: [0, 1],
    scale: [0.85, 1],
    duration: 500,
    delay: stagger(60, { start: 50 }),
    ease: 'outBack(1.4)',
  });
}

// ─── Counter Animation ───────────────────────────────────────
// Ticks a number from 0 to target (for quality scores, coverage %)

export function animateCounter(
  element: HTMLElement,
  target: number,
  duration = 1200,
  suffix = ''
) {
  const obj = { val: 0 };
  return animate(obj, {
    val: target,
    duration,
    ease: 'outExpo',
    onUpdate: () => {
      element.textContent = Math.round(obj.val) + suffix;
    },
  });
}

// ─── Ring Gauge ──────────────────────────────────────────────
// Animated SVG circle stroke for quality scores

export function animateRing(
  element: SVGCircleElement,
  percentage: number,
  circumference: number,
  duration = 1400
) {
  const offset = circumference - (percentage / 100) * circumference;
  return animate(element, {
    strokeDashoffset: [circumference, offset],
    duration,
    ease: 'outExpo',
  });
}

// ─── Coverage Bar Fill ───────────────────────────────────────
// Animated width for progress/coverage bars

export function animateBar(element: HTMLElement, percentage: number, duration = 900) {
  return animate(element, {
    width: [`0%`, `${Math.min(percentage, 100)}%`],
    duration,
    ease: 'outQuart',
  });
}

// ─── Card Entrance ───────────────────────────────────────────
// Dramatic card reveal with slight rotation and scale

export function cardEntrance(element: HTMLElement, delay = 0) {
  return animate(element, {
    opacity: [0, 1],
    translateY: [20, 0],
    scale: [0.97, 1],
    duration: 600,
    delay,
    ease: 'outExpo',
  });
}

// ─── Grade Reveal ────────────────────────────────────────────
// Dramatic letter grade animation (scale pop + glow)

export function gradeReveal(element: HTMLElement) {
  return createTimeline()
    .add(element, {
      scale: [0, 1.15],
      opacity: [0, 1],
      duration: 500,
      ease: 'outBack(2)',
    })
    .add(element, {
      scale: [1.15, 1],
      duration: 300,
      ease: 'inOutQuad',
    });
}

// ─── Pipeline Flow ───────────────────────────────────────────
// Animates the connecting lines between pipeline stages

export function pipelineFlow(lineElements: HTMLElement[]) {
  return animate(lineElements, {
    scaleX: [0, 1],
    opacity: [0, 0.3],
    duration: 500,
    delay: stagger(150),
    ease: 'outQuart',
  });
}

// ─── Pulse Glow ──────────────────────────────────────────────
// Breathing glow effect for active elements

export function pulseGlow(element: HTMLElement, color: string) {
  return animate(element, {
    boxShadow: [
      `0 0 0px ${color}00`,
      `0 0 20px ${color}40`,
      `0 0 0px ${color}00`,
    ],
    duration: 2000,
    loop: true,
    ease: 'inOutSine',
  });
}

// ─── Feedback Spin ───────────────────────────────────────────
// Orbital rotation for feedback loop indicator

export function feedbackSpin(element: HTMLElement) {
  return animate(element, {
    rotate: [0, 360],
    duration: 3000,
    loop: true,
    ease: 'linear',
  });
}

// ─── Shimmer Sweep ───────────────────────────────────────────
// Highlight sweep across an element

export function shimmerSweep(element: HTMLElement) {
  return animate(element, {
    backgroundPosition: ['-200% 0', '200% 0'],
    duration: 2000,
    ease: 'inOutSine',
  });
}

// ─── Number Morph ────────────────────────────────────────────
// Morphs a number display from old value to new value

export function morphNumber(
  element: HTMLElement,
  from: number,
  to: number,
  duration = 800,
  suffix = '%'
) {
  const obj = { val: from };
  return animate(obj, {
    val: to,
    duration,
    ease: 'outQuart',
    onUpdate: () => {
      element.textContent = Math.round(obj.val) + suffix;
    },
  });
}
