"use client"

import { useRef, useEffect } from "react"
import * as THREE from "three"
import gsap from "gsap"

const DENSITY = " .,;:{}[]()<>/\\|=+-*&^%$#@!?~`_01"

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

// ── Character atlas ──────────────────────────────────────────────────────────
function buildAtlas(chars: string, cellW: number, cellH: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width  = chars.length * cellW
  canvas.height = cellH
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "#fff"
  ctx.font = `${Math.floor(cellH * 0.85)}px "Source Code Pro","Courier New",monospace`
  ctx.textAlign    = "center"
  ctx.textBaseline = "middle"
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], i * cellW + cellW * 0.5, cellH * 0.5)
  }
  return canvas
}

// ── Vertex shader ────────────────────────────────────────────────────────────
const VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

// ── Fragment shader ──────────────────────────────────────────────────────────
const FRAG = /* glsl */`
precision highp float;

uniform sampler2D uImage;
uniform sampler2D uAtlas;
uniform vec2  uResolution;
uniform float uCellSize;
uniform float uReveal;
uniform float uTime;
uniform float uNumChars;
uniform float uImageAspect;
uniform float uRotation;
uniform float uMaxBrightness;
uniform float uTintStrength;   // 0=real image, 1=full gold
uniform float uGlitch;
uniform vec2  uGlitchOffset;
uniform float uGlitchColStart;
uniform float uGlitchColEnd;
uniform vec2  uParallax;

varying vec2 vUv;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uResolution;

  vec2 cellCoord  = floor(px / uCellSize);
  vec2 cellCenter = (cellCoord + 0.5) * uCellSize;

  // Radial reveal
  vec2  gridSize   = uResolution / uCellSize;
  vec2  gridCenter = gridSize * 0.5;
  float dist       = length(cellCoord - gridCenter);
  float maxDist    = length(gridCenter);
  float revealRadius = uReveal * maxDist * 1.2;
  float reveal = clamp((revealRadius - dist) / (maxDist * 0.15), 0.0, 1.0);
  if (reveal < 0.01) discard;

  // Glitch
  float inGlitch = step(uGlitchColStart, cellCoord.x)
                 * step(cellCoord.x, uGlitchColEnd)
                 * uGlitch;
  vec2 glitchOff = inGlitch * uGlitchOffset;

  // Drift + parallax
  float t   = uTime;
  vec2 drift = vec2(sin(t * 0.4) * 2.5, cos(t * 0.27) * 1.5);
  vec2 samplePx = cellCenter + drift + glitchOff + uParallax;

  vec2 uv = vec2(samplePx.x / uResolution.x,
                 1.0 - samplePx.y / uResolution.y);

  // Rotation
  if (abs(uRotation) > 0.001) {
    vec2 c  = uv - 0.5;
    float cr = cos(-uRotation);
    float sr = sin(-uRotation);
    c = vec2(cr * c.x - sr * c.y, sr * c.x + cr * c.y) / 1.15;
    uv = c + 0.5;
  }

  // Cover-fit
  float canvasAspect = uResolution.x / uResolution.y;
  if (canvasAspect > uImageAspect) {
    float s = canvasAspect / uImageAspect;
    uv.y    = (uv.y - 0.5) / s + 0.5;
  } else {
    float s = uImageAspect / canvasAspect;
    uv.x    = (uv.x - 0.5) / s + 0.5;
  }

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;

  // ── Sample image — only discard bright background ──────────────────────
  vec4  color      = texture2D(uImage, uv);
  if (color.a < 0.1) discard;
  float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  if (brightness > uMaxBrightness) discard;

  // ── Gamma lift for character selection ─────────────────────────────────
  float lifted = pow(brightness, 0.55);

  // ── Character selection (shuffles over time) ──────────────────────────
  float slot    = floor(uTime / 0.9);
  float rng     = hash21(cellCoord + vec2(slot));
  float charIdx = clamp(
    floor((1.0 - lifted) * (uNumChars - 1.0) + (rng - 0.5) * 1.5),
    0.0, uNumChars - 1.0
  );

  // ── Atlas lookup ──────────────────────────────────────────────────────
  vec2  cellUV  = (px - cellCoord * uCellSize) / uCellSize;
  float atlasU  = (charIdx + cellUV.x) / uNumChars;
  float atlasV  = 1.0 - cellUV.y;
  float glyph   = texture2D(uAtlas, vec2(atlasU, atlasV)).r;
  if (glyph < 0.12) discard;

  // ── Colour: real image built by characters + gold overlay ──────────────
  // Lift original image colours so dark areas are readable
  float targetBri = max(0.50, brightness);
  float lift      = targetBri / max(brightness, 0.001);
  lift            = min(lift, 4.0);
  vec3 imageColor = clamp(color.rgb * lift, 0.0, 1.0);

  // Gold overlay: subtle warm wash over real image colours
  // tintStrength: 0 = 10% tint (auth), 1 = 20% tint (hand)
  float goldAmount = mix(0.10, 0.20, uTintStrength);
  vec3 finalColor  = mix(imageColor, vec3(0.831, 0.686, 0.216), goldAmount);

  // Glitch colour — gold family
  float grng      = hash21(cellCoord + vec2(t * 17.3));
  vec3  glitchClr = grng > 0.5 ? vec3(1.0, 0.85, 0.3) : vec3(0.95, 0.55, 0.08);
  finalColor = mix(finalColor, glitchClr, inGlitch * 0.9);

  // Alpha — generous minimum so dark images aren't invisible
  float alpha = clamp(reveal * glyph * (0.65 + lifted * 0.55) * 2.0, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, alpha);
}
`

// ── React component ──────────────────────────────────────────────────────────

interface Props {
  imageSrc:       string
  cellSize?:      number
  className?:     string
  rotation?:      number
  revealSpeed?:   number
  /** Pixels brighter than this are discarded — removes white/bright background. Default 0.82. */
  maxBrightness?: number
  /** 0 = real image colours + light gold tint. 1 = full vivid gold. Default 1. */
  tintStrength?:  number
  /** Parallax intensity in CSS px. 0 = off. Default 20. */
  parallax?:      number
}

export function CreationHands({
  imageSrc,
  cellSize      = 8,
  className     = "",
  rotation      = 0,
  revealSpeed   = 1,
  maxBrightness = 0.82,
  tintStrength  = 1,
  parallax      = 20,
}: Props) {
  const mountRef       = useRef<HTMLDivElement>(null)
  const rendererRef    = useRef<THREE.WebGLRenderer | null>(null)
  const uniformsRef    = useRef<Record<string, THREE.IUniform> | null>(null)
  const rafRef         = useRef<number>(0)
  const tweenRef       = useRef<gsap.core.Tween | null>(null)
  const glitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visibleRef     = useRef(true)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || typeof window === "undefined") return

    const w = mount.clientWidth
    const h = mount.clientHeight
    if (w === 0 || h === 0) return

    // ── Atlas ─────────────────────────────────────────────────
    const charCellW    = Math.ceil(cellSize * 0.9)
    const charCellH    = Math.ceil(cellSize)
    const atlasCanvas  = buildAtlas(DENSITY, charCellW, charCellH)
    const atlasTexture = new THREE.CanvasTexture(atlasCanvas)
    atlasTexture.minFilter = THREE.NearestFilter
    atlasTexture.magFilter = THREE.NearestFilter

    // ── Renderer ──────────────────────────────────────────────
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias:       false,
        alpha:           true,
        powerPreference: "high-performance",
      })
    } catch {
      atlasTexture.dispose()
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene  = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    // ── Uniforms ─────────────────────────────────────────────
    const uniforms: Record<string, THREE.IUniform> = {
      uImage:          { value: null },
      uAtlas:          { value: atlasTexture },
      uResolution:     { value: new THREE.Vector2(w, h) },
      uCellSize:       { value: cellSize },
      uReveal:         { value: prefersReducedMotion ? 1.0 : 0.0 },
      uTime:           { value: 0.0 },
      uNumChars:       { value: DENSITY.length },
      uImageAspect:    { value: 1.0 },
      uRotation:       { value: (rotation * Math.PI) / 180 },
      uMaxBrightness:  { value: maxBrightness },
      uTintStrength:   { value: tintStrength },
      uGlitch:         { value: 0.0 },
      uGlitchOffset:   { value: new THREE.Vector2(0, 0) },
      uGlitchColStart: { value: -1.0 },
      uGlitchColEnd:   { value: -1.0 },
      uParallax:       { value: new THREE.Vector2(0, 0) },
    }
    uniformsRef.current = uniforms

    const material = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent:    true,
      depthWrite:     false,
    })

    const geometry = new THREE.PlaneGeometry(2, 2)
    scene.add(new THREE.Mesh(geometry, material))

    // ── Load image ───────────────────────────────────────────
    const loader = new THREE.TextureLoader()
    loader.load(imageSrc, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter  = THREE.LinearFilter
      texture.magFilter  = THREE.LinearFilter
      uniforms.uImage.value = texture

      const imgEl = texture.image as HTMLImageElement
      uniforms.uImageAspect.value = imgEl.naturalWidth / imgEl.naturalHeight

      // Reveal
      if (!prefersReducedMotion) {
        const obj = { v: 0 }
        tweenRef.current = gsap.to(obj, {
          v:        1,
          duration: 0.8 * revealSpeed,
          delay:    0.05 * revealSpeed,
          ease:     "power2.out",
          onUpdate: () => { uniforms.uReveal.value = obj.v },
        })
      }

      // Glitch scheduling
      if (!prefersReducedMotion) {
        const scheduleGlitch = () => {
          const wait = 3000 + Math.random() * 8000
          glitchTimerRef.current = setTimeout(() => {
            const numCols = Math.floor(w / cellSize)
            const start   = Math.floor(Math.random() * numCols)
            uniforms.uGlitch.value         = 1
            uniforms.uGlitchOffset.value.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 14)
            uniforms.uGlitchColStart.value = start
            uniforms.uGlitchColEnd.value   = start + 4 + Math.floor(Math.random() * 8)

            setTimeout(() => {
              uniforms.uGlitch.value = 0
              if (Math.random() > 0.6) {
                setTimeout(() => {
                  uniforms.uGlitch.value = 1
                  uniforms.uGlitchOffset.value.set((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 10)
                  setTimeout(() => { uniforms.uGlitch.value = 0 }, 40 + Math.random() * 60)
                }, 80 + Math.random() * 120)
              }
              scheduleGlitch()
            }, 50 + Math.random() * 100)
          }, wait)
        }
        scheduleGlitch()
      }
    })

    // ── Render loop ──────────────────────────────────────────
    const startTime = performance.now()
    const parallaxTarget = { x: 0, y: 0 }

    const onMouseMove = parallax > 0 && !prefersReducedMotion
      ? (e: MouseEvent) => {
          const nx = (e.clientX / window.innerWidth  - 0.5) * 2
          const ny = (e.clientY / window.innerHeight - 0.5) * 2
          parallaxTarget.x = nx * parallax
          parallaxTarget.y = ny * parallax
        }
      : null

    if (onMouseMove) {
      window.addEventListener("mousemove", onMouseMove, { passive: true })
    }

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      if (!visibleRef.current || !uniforms.uImage.value) return
      // Smooth parallax lerp
      if (onMouseMove) {
        const cur = uniforms.uParallax.value as THREE.Vector2
        cur.x += (parallaxTarget.x - cur.x) * 0.08
        cur.y += (parallaxTarget.y - cur.y) * 0.08
      }
      uniforms.uTime.value = (performance.now() - startTime) * 0.001
      renderer.render(scene, camera)
    }
    animate()

    // ── Resize ───────────────────────────────────────────────
    const onResize = () => {
      const nw = mount.clientWidth
      const nh = mount.clientHeight
      if (nw === 0 || nh === 0) return
      renderer.setSize(nw, nh)
      uniforms.uResolution.value.set(nw, nh)
    }
    window.addEventListener("resize", onResize, { passive: true })

    // ── Visibility ───────────────────────────────────────────
    const visObs = new IntersectionObserver(
      ([e]) => { visibleRef.current = e.isIntersecting },
      { threshold: 0 },
    )
    visObs.observe(mount)

    return () => {
      cancelAnimationFrame(rafRef.current)
      tweenRef.current?.kill()
      if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current)
      window.removeEventListener("resize", onResize)
      if (onMouseMove) window.removeEventListener("mousemove", onMouseMove)
      visObs.disconnect()
      renderer.dispose()
      material.dispose()
      geometry.dispose()
      atlasTexture.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [imageSrc, cellSize, rotation, revealSpeed, maxBrightness, tintStrength, parallax])

  return (
    <div
      ref={mountRef}
      className={`relative select-none ${className}`}
    />
  )
}
