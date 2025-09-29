import { Header } from "../components/header"
import { HeroSection } from "../components/hero-section"
import { FeaturesSection } from "../components/features-section"
import { IntegrationSection } from "../components/integration-section"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background p-6 gap-3.5 justify-center align-middle bg-[#ECEEDF] items-center">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <IntegrationSection />
      </main>
      <footer className="border-t border-border py-8 px-6 bg-card/30">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">© 2025 Co Lab AI. Building the future of collaborative AI systems.</p>
        </div>
      </footer>
    </div>
  )
}
