import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '~/components/landing/Navbar'
import { Hero } from '~/components/landing/Hero'
import { Problem } from '~/components/landing/Problem'
import { HowItWorks } from '~/components/landing/HowItWorks'
import { QuestionEngine } from '~/components/landing/QuestionEngine'
import { Metrics } from '~/components/landing/Metrics'
import { Evidence } from '~/components/landing/Evidence'
import { History } from '~/components/landing/History'
import { ValueLoop } from '~/components/landing/ValueLoop'
import { Pricing } from '~/components/landing/Pricing'
import { FAQ } from '~/components/landing/FAQ'
import { CTAFinal } from '~/components/landing/CTAFinal'
import { Footer } from '~/components/landing/Footer'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main className="min-h-screen bg-canvas">
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <QuestionEngine />
      <Metrics />
      <Evidence />
      <History />
      <ValueLoop />
      <Pricing />
      <FAQ />
      <CTAFinal />
      <Footer />
    </main>
  )
}
