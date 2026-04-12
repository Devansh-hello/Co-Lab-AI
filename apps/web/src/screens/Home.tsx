// Optimization tweaks and lazy loading prep
import { Header } from "../components/header"
import { GridOverlay } from "../components/GridOverlay"
import { HeroSection } from "../components/hero-section"
import { ProofSection } from "../components/proof-section"
import { WorkflowSection } from "../components/workflow-section"
import { HowItWorksSection } from "../components/how-it-works-section"
import { FeaturesSection } from "../components/features-section"
import { CTASection } from "../components/cta-section"
import { Footer } from "../components/footer"
import { WavyGoldGlow } from "../components/wavy-gold-glow"

export default function Home() {
  return (
    <div className="relative flex flex-col min-h-screen bg-background bg-grainy">
      <WavyGoldGlow />
      <GridOverlay />
      <Header />
      <main className="flex-1 w-full">
        <HeroSection />

        {/* Hero bottom fade — outside overflow-hidden so it doesn't clip */}
        <div className="relative -mt-40 h-40 pointer-events-none bg-gradient-to-b from-transparent via-background/80 to-background" />

        {/* Powered by */}
        <div className="relative z-10 flex items-center justify-center gap-5 sm:gap-8 md:gap-12 pt-12 pb-12 flex-wrap px-4">
          <span className="text-[10px] sm:text-[11px] text-white/30 uppercase tracking-[0.15em] font-mono hidden sm:inline">Powered by</span>
          {/* OpenAI */}
          <span className="flex items-center gap-1.5 text-white/30">
            <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>
            <span className="text-[12px] sm:text-sm font-bold tracking-wide hidden sm:inline">OpenAI</span>
          </span>
          {/* Anthropic */}
          <span className="flex items-center gap-1.5 text-white/30">
            <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.304 3.541h-3.672l6.696 16.918h3.672zm-10.608 0L0 20.459h3.744l1.37-3.553h7.005l1.369 3.553h3.744L10.536 3.541zm-.372 10.339l2.3-5.964 2.3 5.964z"/></svg>
            <span className="text-[12px] sm:text-sm font-bold tracking-wide hidden sm:inline">Anthropic</span>
          </span>
          {/* Google */}
          <span className="flex items-center gap-1.5 text-white/30">
            <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            <span className="text-[12px] sm:text-sm font-bold tracking-wide hidden sm:inline">Google</span>
          </span>
          {/* OpenRouter */}
          <span className="flex items-center gap-1.5 text-white/30">
            <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            <span className="text-[12px] sm:text-sm font-bold tracking-wide hidden sm:inline">OpenRouter</span>
          </span>
          {/* GLM */}
          <span className="flex items-center gap-1.5 text-white/30">
            <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span className="text-[12px] sm:text-sm font-bold tracking-wide hidden sm:inline">GLM</span>
          </span>
        </div>

        <ProofSection />
        {/* Scroll-pinned "Old Way vs Co-Lab Way" comparison */}
        <WorkflowSection />
        {/* Three-step breakdown cards */}
        <HowItWorksSection />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
