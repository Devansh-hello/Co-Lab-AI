import { Header } from "../components/header"
import { GridOverlay } from "../components/GridOverlay"
import { Footer } from "../components/footer"
import { HeroSplit } from "../components/test-home/HeroSplit"
import { TrustBar } from "../components/test-home/TrustBar"
import { WorkflowScroll } from "../components/test-home/WorkflowScroll"
import { HowItWorksSection } from "../components/how-it-works-section"
import { FeaturesGrouped } from "../components/test-home/FeaturesGrouped"
import { SeeItInAction } from "../components/test-home/SeeItInAction"
import { CTASplit } from "../components/test-home/CTASplit"

export default function TestHome() {
  return (
    <div className="flex flex-col min-h-screen bg-background bg-grainy">
      <GridOverlay />
      <Header />
      <main className="flex-1 w-full">
        <HeroSplit />
        <TrustBar />
        <WorkflowScroll />
        <HowItWorksSection />
        <FeaturesGrouped />
        <SeeItInAction />
        <CTASplit />
      </main>
      <Footer />
    </div>
  )
}
