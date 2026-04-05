"use client"

import { useRef, useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import Logo from "./Logo"
import { GridOverlay } from "./GridOverlay"
import { CreationHands } from "./CreationHands"

const shownArt = new Set<string>()

interface AuthLayoutProps {
  label: string
  title: string
  subtitle: string
  artSrc: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ label, title, subtitle, artSrc, children, footer }: AuthLayoutProps) {
  const formRef = useRef<HTMLDivElement>(null)
  const alreadySeen = shownArt.has(artSrc)
  const [showArt, setShowArt] = useState(alreadySeen)

  useEffect(() => {
    if (alreadySeen) return
    const timer = setTimeout(() => {
      setShowArt(true)
      shownArt.add(artSrc)
    }, 1100)
    return () => clearTimeout(timer)
  }, [artSrc, alreadySeen])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grainy relative overflow-hidden">
      <GridOverlay />

      {/* Ambient gold glow blobs — cinematic atmospheric depth */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse"
          style={{
            top: "-10%",
            right: "-5%",
            background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(161,98,7,0.06) 50%, transparent 70%)",
            animationDuration: "8s",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse"
          style={{
            bottom: "-15%",
            left: "-10%",
            background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, rgba(161,98,7,0.04) 50%, transparent 70%)",
            animationDuration: "12s",
            animationDelay: "2s",
          }}
        />
        <div
          className="absolute w-[350px] h-[350px] rounded-full blur-[80px] animate-pulse"
          style={{
            top: "40%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 60%)",
            animationDuration: "10s",
            animationDelay: "4s",
          }}
        />
      </div>

      {/* Dot art — deferred until card is painted */}
      {showArt && (
        <div className="absolute inset-0 z-0 hidden md:block">
          <CreationHands
            imageSrc={artSrc}
            cellSize={8}
            revealSpeed={0.35}
            maxBrightness={0.92}
            tintStrength={0}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Mobile: soft gold glow in place of dot art */}
      <div className="absolute inset-0 z-0 md:hidden pointer-events-none">
        <div
          className="absolute w-[300px] h-[300px] rounded-full blur-[80px]"
          style={{
            top: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "radial-gradient(circle, rgba(212,175,55,0.20) 0%, rgba(212,175,55,0.06) 50%, transparent 70%)",
          }}
        />
      </div>

      {/* Vignette — soft rectangular edge fade for focus on card */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-r from-black/70 via-transparent to-black/70" />
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/60" />

      {/* Form card -- glassmorphic, CSS-only staggered entry */}
      <div
        ref={formRef}
        className="relative z-[2] w-full max-w-[420px] mx-4 p-8 md:p-10 rounded-2xl corner-accents overflow-hidden"
        style={{
          background: "linear-gradient(170deg, rgba(18, 18, 14, 0.08) 0%, rgba(10, 10, 8, 0.10) 100%)",
          backdropFilter: "blur(20px) saturate(2.0) brightness(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(2.0) brightness(1.4)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: [
            "0 0 0 0.5px rgba(255,255,255,0.06)",
            "0 32px 80px rgba(0,0,0,0.45)",
            "0 8px 24px rgba(0,0,0,0.25)",
            "inset 0 1px 0 rgba(255,255,255,0.18)",
            "inset 0 -1px 0 rgba(255,255,255,0.05)",
            "inset 1px 0 0 rgba(255,255,255,0.08)",
            "inset -1px 0 0 rgba(255,255,255,0.08)",
          ].join(", "),
        }}
      >
        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
        />
        {/* Logo */}
        <div className="auth-stagger" style={{ "--i": 0 } as React.CSSProperties}>
          <Link href="/" className="mb-10 w-fit block">
            <Logo size="lg" />
          </Link>
        </div>

        {/* Heading */}
        <div className="auth-stagger mb-8" style={{ "--i": 1 } as React.CSSProperties}>
          <span className="block text-[11px] font-mono text-gold-500/60 tracking-[0.15em] uppercase font-bold mb-2">
            {label}
          </span>
          <h1 className="text-[28px] md:text-[32px] font-display italic text-white tracking-[-0.03em] leading-[1.1]">
            {title}
          </h1>
          <p className="text-white/40 text-[13px] mt-2 font-medium">
            {subtitle}
          </p>
        </div>

        {/* Form content */}
        {children}

        {/* Footer */}
        <div className="auth-stagger mt-8 text-center" style={{ "--i": 7 } as React.CSSProperties}>
          {footer}
        </div>
      </div>
    </div>
  )
}
