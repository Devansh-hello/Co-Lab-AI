import { Link } from "react-router-dom"
import { Sparkles } from "lucide-react"

const links = [
  { label: "Features", href: "#features" },
  { label: "Agents", href: "#agents" },
  { label: "Docs", href: "#" },
  { label: "GitHub", href: "#" },
]

const socials = [
  { label: "Twitter", href: "#", icon: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
  )},
  { label: "Discord", href: "#", icon: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg>
  )},
  { label: "LinkedIn", href: "#", icon: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
  )},
]

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06]">
      <div className="container mx-auto px-4 md:px-6">
        {/* Main row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-5 md:py-4">
          {/* Left — Logo + tagline */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#D4AF37]/10">
                <Sparkles className="h-3 w-3 text-[#D4AF37]" />
              </div>
              <span className="text-sm font-bold text-white/70 tracking-tight">
                Co-Lab <span className="text-[#D4AF37]/70">AI</span>
              </span>
            </Link>
            <span className="hidden lg:block text-[11px] text-white/20 border-l border-white/[0.06] pl-3 font-medium">
              Multi-agent AI engineering
            </span>
          </div>

          {/* Center — Links */}
          <nav className="flex items-center gap-1 flex-wrap justify-center">
            {links.map((link) => (
              link.href.startsWith("#") ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-3 py-1.5 text-[12px] text-white/30 hover:text-white/60 font-medium transition-colors rounded-lg hover:bg-white/[0.03]"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="px-3 py-1.5 text-[12px] text-white/30 hover:text-white/60 font-medium transition-colors rounded-lg hover:bg-white/[0.03]"
                >
                  {link.label}
                </Link>
              )
            ))}

            {/* Separator dot */}
            <div className="w-px h-3 bg-white/[0.08] mx-1.5" />

            {/* Social icons */}
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="p-2 text-white/20 hover:text-white/50 transition-colors rounded-lg hover:bg-white/[0.03]"
              >
                {s.icon}
              </a>
            ))}
          </nav>

          {/* Right — Legal */}
          <div className="flex items-center gap-4 text-[11px] text-white/20">
            <a href="#" className="hover:text-white/40 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/40 transition-colors">Terms</a>
            <span className="text-white/10">&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
