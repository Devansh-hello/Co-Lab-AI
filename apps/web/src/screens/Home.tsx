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

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background bg-grainy">
      <GridOverlay />
      <Header />
      <main className="flex-1 w-full">
        <HeroSection />
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
