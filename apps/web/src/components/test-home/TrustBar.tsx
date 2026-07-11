"use client"

const STATS = [
  { value: "214", label: "Tests" },
  { value: "A", label: "Grade" },
  { value: "76%", label: "Cost Savings" },
  { value: "19", label: "Papers" },
] as const

const PROVIDERS = ["OpenAI", "Anthropic", "Google", "OpenRouter", "GLM"] as const

export function TrustBar() {
  return (
    <section className="relative" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Top border */}
      <div className="h-px bg-white/[0.04]" />

      <div className="mx-auto max-w-5xl px-4 md:px-8 py-6">
        {/* Stats row */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12 mb-4">
          {STATS.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-4 sm:gap-8 md:gap-12">
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-black text-gold-500 leading-none mb-0.5">
                  {stat.value}
                </div>
                <div className="text-[10px] sm:text-[11px] text-white/45 font-mono uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
              {/* Divider (skip last) */}
              {i < STATS.length - 1 && (
                <div className="w-px h-8 bg-white/[0.08] hidden sm:block" />
              )}
            </div>
          ))}
        </div>

        {/* Providers row */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-8 flex-wrap">
          <span className="text-[10px] sm:text-[11px] text-white/30 uppercase tracking-[0.15em] font-mono">
            Powered by
          </span>
          {PROVIDERS.map((name) => (
            <span
              key={name}
              className="text-[11px] sm:text-[12px] font-bold text-white/30 tracking-wide"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom border */}
      <div className="h-px bg-white/[0.04]" />
    </section>
  )
}
