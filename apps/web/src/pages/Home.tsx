// Optimization tweaks for performance
import { Header } from "../components/header"
import { GridOverlay } from "../components/GridOverlay"
import { HeroSection } from "../components/hero-section"
import { ProofSection } from "../components/proof-section"
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
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
