import { useRef, useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Sparkles } from "lucide-react"
import { Toaster } from "react-hot-toast"
import { GridOverlay } from "./GridOverlay"
import { CreationHands } from "./CreationHands"

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
  const [showArt, setShowArt] = useState(false)

  useEffect(() => {
    // Wait for card CSS animations to finish before mounting the canvas
    const timer = setTimeout(() => { setShowArt(true) }, 700)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grainy relative overflow-hidden">
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: "13px",
            fontFamily: "JetBrains Mono, monospace",
          },
        }}
      />

      <GridOverlay />

      {/* ASCII art -- deferred until card is painted, no parallax */}
      {showArt && (
        <div className="absolute inset-0 z-0 hidden md:block">
          <CreationHands
            imageSrc={artSrc}
            color="#D4AF37"
            cellSize={5}
            parallaxMax={0}
            revealSpeed={0.35}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Mobile: soft gold glow in place of ASCII art */}
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

      {/* Vignette -- soft rectangular edge fade */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-r from-black/70 via-transparent to-black/70" />
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/60" />

      {/* Form card -- CSS-only staggered entry, no JS animation */}
      <div
        ref={formRef}
        className="relative z-[2] w-full max-w-[420px] mx-4 p-8 md:p-10 rounded-2xl glass-premium corner-accents"
      >
        {/* Logo */}
        <div className="auth-stagger" style={{ "--i": 0 } as React.CSSProperties}>
          <Link to="/" className="flex items-center gap-2 mb-10 group w-fit">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#D4AF37]/15 group-hover:bg-[#D4AF37]/25 transition-colors">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white/80">
              Co-Lab <span className="text-[#D4AF37]">AI</span>
            </span>
          </Link>
        </div>

        {/* Heading */}
        <div className="auth-stagger mb-8" style={{ "--i": 1 } as React.CSSProperties}>
          <span className="block text-[11px] font-mono text-[#D4AF37]/60 tracking-[0.15em] uppercase font-bold mb-2">
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
