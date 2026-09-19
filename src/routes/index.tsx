import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '~/components/landing/Navbar'
import { Hero } from '~/components/landing/Hero'
import { Problem } from '~/components/landing/Problem'
import { HowItWorks } from '~/components/landing/HowItWorks'
import { Metrics } from '~/components/landing/Metrics'
import { Features } from '~/components/landing/Features'
import { History } from '~/components/landing/History'
import { Pricing } from '~/components/landing/Pricing'
import { FAQ } from '~/components/landing/FAQ'
import { CTAFinal } from '~/components/landing/CTAFinal'
import { Footer } from '~/components/landing/Footer'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main className="theme-landing min-h-screen bg-canvas">
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Metrics />
      <Features />
      <History />
      <Pricing />
      <FAQ />
      <CTAFinal />
      <Footer />
    </main>
  )
}
