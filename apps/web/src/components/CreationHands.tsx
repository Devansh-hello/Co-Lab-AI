"use client"

import { useRef, useEffect, useCallback } from "react"
import { animate } from "animejs"

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=-:.,"
const DENSITY = " .,:;+*?%#@"
const TARGET_FPS = 30
const FRAME_INTERVAL = 1000 / TARGET_FPS

interface Cell {
  x: number; y: number; char: string
  brightness: number; opacity: number
  colorStr: string
  dist: number // pre-computed distance from center for reveal
}

interface Props {
  imageSrc: string
  cellSize?: number
  className?: string
  parallaxMax?: number
  rotation?: number
  revealSpeed?: number
}

export function CreationHands({
  imageSrc,
  cellSize: baseCellSize = 6,
  className = "",
  parallaxMax = 5,
  rotation = 0,
  revealSpeed = 1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cellsRef = useRef<Cell[]>([])
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const rafRef = useRef<number>(0)
  const readyRef = useRef(false)
  const timerRef = useRef<number>(0)
  const glitchTimerRef = useRef<number>(0)
  const glitchOffsetRef = useRef({ x: 0, y: 0, active: false })
  const visibleRef = useRef(true)
  const lastFrameRef = useRef(0)
  const effectiveCellSizeRef = useRef(baseCellSize)
  // Cached per-resize values to avoid per-frame layout reads
  const cachedCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const cachedSizeRef = useRef({ w: 0, h: 0 })
  // Single reveal progress value (0..1) drives all cells
  const revealProgressRef = useRef(0)
  const maxDistRef = useRef(1)

  const processImage = useCallback((img: HTMLImageElement) => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const w = Math.floor(rect.width)
    const h = Math.floor(rect.height)
    if (w === 0 || h === 0) return

    const cellSize = w > 1920 ? baseCellSize + 2 : w > 1440 ? baseCellSize + 1 : baseCellSize
    effectiveCellSizeRef.current = cellSize

    const off = document.createElement("canvas")
    off.width = w
    off.height = h
    const ctx = off.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const iA = img.naturalWidth / img.naturalHeight
    const cA = w / h
    let dw: number, dh: number, dx: number, dy: number
    if (cA > iA) {
      dw = w; dh = w / iA; dx = 0; dy = (h - dh) / 2
    } else {
      dh = h; dw = h * iA; dx = (w - dw) / 2; dy = 0
    }

    if (rotation !== 0) {
      const rad = (rotation * Math.PI) / 180
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate(rad)
      const scale = 1.15
      ctx.drawImage(img, (-dw * scale) / 2, (-dh * scale) / 2, dw * scale, dh * scale)
      ctx.restore()
    } else {
      ctx.drawImage(img, dx, dy, dw, dh)
    }

    const data = ctx.getImageData(0, 0, w, h).data
    const cols = Math.floor(w / cellSize)
    const rows = Math.floor(h / cellSize)
    const cells: Cell[] = []

    // Find center in grid coords
    const midCol = cols / 2
    const midRow = rows / 2

    let maxDist = 0

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const px = Math.floor(col * cellSize + cellSize / 2)
        const py = Math.floor(row * cellSize + cellSize / 2)
        const i = (py * w + px) * 4

        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255

        if (brightness > 0.92 || (a / 255) < 0.2) continue

        const darkness = 1 - brightness
        const ci = Math.min(Math.floor(darkness * (DENSITY.length - 1)), DENSITY.length - 1)
        if (DENSITY[ci] === " ") continue

        const avg = (r + g + b) / 3
        const rr = Math.min(255, Math.round((avg + (r - avg) * 2.0) * 1.4))
        const gg = Math.min(255, Math.round((avg + (g - avg) * 2.0) * 1.4))
        const bb = Math.min(255, Math.round((avg + (b - avg) * 2.0) * 1.4))

        const dist = Math.hypot(col - midCol, row - midRow)
        if (dist > maxDist) maxDist = dist

        cells.push({
          x: col, y: row,
          char: CHARS[Math.floor(Math.random() * CHARS.length)],
          brightness, opacity: 0,
          colorStr: `rgb(${rr},${gg},${bb})`,
          dist,
        })
      }
    }

    maxDistRef.current = maxDist || 1
    cellsRef.current = cells
    readyRef.current = true
  }, [baseCellSize, rotation])

  const shuffleChars = useCallback(() => {
    const cells = cellsRef.current
    const n = Math.floor(cells.length * 0.08)
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * cells.length)
      cells[idx].char = CHARS[Math.floor(Math.random() * CHARS.length)]
    }
  }, [])

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const rect = container.getBoundingClientRect()
    const w = Math.floor(rect.width)
    const h = Math.floor(rect.height)
    const cw = Math.floor(w * dpr)
    const ch = Math.floor(h * dpr)

    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw
      canvas.height = ch
    }

    cachedSizeRef.current = { w, h }
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const cellSize = effectiveCellSizeRef.current
    ctx.font = `${cellSize * 0.82}px "Source Code Pro","Courier New",monospace`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    cachedCtxRef.current = ctx
  }, [])

  const render = useCallback(() => {
    const ctx = cachedCtxRef.current
    const { w, h } = cachedSizeRef.current
    if (!ctx || !readyRef.current || w === 0) return

    ctx.clearRect(0, 0, w, h)

    const cellSize = effectiveCellSizeRef.current
    const mx = (mouseRef.current.x - 0.5) * parallaxMax * 2
    const my = (mouseRef.current.y - 0.5) * parallaxMax * 2
    const gl = glitchOffsetRef.current
    const progress = revealProgressRef.current
    const maxDist = maxDistRef.current

    const cols = Math.floor(w / cellSize)
    const glitchColStart = gl.active ? Math.floor(Math.random() * cols) : -1
    const glitchColEnd = glitchColStart + 4 + Math.floor(Math.random() * 8)

    // Reveal threshold: cells within this distance are visible
    const revealRadius = progress * maxDist * 1.2

    for (const c of cellsRef.current) {
      // Compute opacity from reveal progress instead of per-cell anime instance
      let targetOpacity: number
      if (c.dist < revealRadius) {
        // How far past the threshold (0 = just appeared, 1 = fully settled)
        const t = Math.min(1, (revealRadius - c.dist) / (maxDist * 0.15))
        targetOpacity = (0.6 + Math.random() * 0.05) * t // tiny jitter for life
      } else {
        targetOpacity = 0
      }
      // Lerp toward target for smooth fade
      c.opacity += (targetOpacity - c.opacity) * 0.3

      if (c.opacity < 0.01) continue

      const da = 0.55 + (1 - c.brightness) * 0.45
      ctx.globalAlpha = Math.min(1, c.opacity * da * 1.5)

      const inGlitch = gl.active && c.x >= glitchColStart && c.x < glitchColEnd
      const gx = inGlitch ? gl.x : 0
      const gy = inGlitch ? gl.y : 0

      if (inGlitch) {
        ctx.fillStyle = Math.random() > 0.5 ? "#00ffff" : "#ff003c"
        ctx.globalAlpha = Math.min(1, c.opacity * 0.9)
      } else {
        ctx.fillStyle = c.colorStr
      }

      ctx.fillText(
        c.char,
        c.x * cellSize + cellSize / 2 + mx + gx,
        c.y * cellSize + cellSize / 2 + my + gy
      )
    }
    ctx.globalAlpha = 1
  }, [parallaxMax])

  const loop = useCallback((now: number) => {
    rafRef.current = requestAnimationFrame(loop)
    if (!visibleRef.current) return
    if (now - lastFrameRef.current < FRAME_INTERVAL) return
    lastFrameRef.current = now
    render()
  }, [render])

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      processImage(img)
      setupCanvas()
      rafRef.current = requestAnimationFrame((t) => { lastFrameRef.current = t; loop(t) })

      // Single animation drives entire reveal -- replaces 20k+ individual animate() calls
      const obj = { v: 0 }
      revealProgressRef.current = 0
      animate(obj, {
        v: [0, 1],
        duration: 800 * revealSpeed,
        delay: 50 * revealSpeed,
        ease: "outQuart",
        onUpdate: () => { revealProgressRef.current = obj.v },
      })

      timerRef.current = window.setInterval(shuffleChars, 600)

      const scheduleGlitch = () => {
        const wait = 3000 + Math.random() * 8000
        glitchTimerRef.current = window.setTimeout(() => {
          glitchOffsetRef.current = {
            x: (Math.random() - 0.5) * 4,
            y: (Math.random() - 0.5) * 14,
            active: true,
          }
          setTimeout(() => {
            glitchOffsetRef.current = { x: 0, y: 0, active: false }
            if (Math.random() > 0.6) {
              setTimeout(() => {
                glitchOffsetRef.current = {
                  x: (Math.random() - 0.5) * 3,
                  y: (Math.random() - 0.5) * 10,
                  active: true,
                }
                setTimeout(() => {
                  glitchOffsetRef.current = { x: 0, y: 0, active: false }
                }, 40 + Math.random() * 60)
              }, 80 + Math.random() * 120)
            }
          }, 50 + Math.random() * 100)
          scheduleGlitch()
        }, wait)
      }
      scheduleGlitch()
    }

    img.onerror = () => {
      console.error("CreationHands: Failed to load image:", imageSrc)
    }

    img.src = imageSrc

    let handleMouse: ((e: MouseEvent) => void) | null = null
    if (parallaxMax > 0) {
      handleMouse = (e: MouseEvent) => {
        if (!containerRef.current) return
        const r = containerRef.current.getBoundingClientRect()
        mouseRef.current.x = (e.clientX - r.left) / r.width
        mouseRef.current.y = (e.clientY - r.top) / r.height
      }
      window.addEventListener("mousemove", handleMouse, { passive: true })
    }

    // Re-setup canvas on resize
    const handleResize = () => { setupCanvas() }
    window.addEventListener("resize", handleResize, { passive: true })

    let visObserver: IntersectionObserver | undefined
    if (containerRef.current) {
      visObserver = new IntersectionObserver(
        ([entry]) => { visibleRef.current = entry.isIntersecting },
        { threshold: 0 }
      )
      visObserver.observe(containerRef.current)
    }

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearInterval(timerRef.current)
      clearTimeout(glitchTimerRef.current)
      if (handleMouse) window.removeEventListener("mousemove", handleMouse)
      window.removeEventListener("resize", handleResize)
      visObserver?.disconnect()
    }
  }, [imageSrc, processImage, setupCanvas, loop, shuffleChars, revealSpeed])

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
