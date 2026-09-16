import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '~/components/landing/Navbar'
import { Hero } from '~/components/landing/Hero'
import { DashboardPreviewLight } from '~/components/landing/DashboardPreviewLight'
import { Problem } from '~/components/landing/Problem'
import { HowItWorks } from '~/components/landing/HowItWorks'
import { QuestionEngine } from '~/components/landing/QuestionEngine'
import { Metrics } from '~/components/landing/Metrics'
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
    <main className="min-h-screen bg-canvas">
      <Navbar />
      <Hero />
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-1200">
          <DashboardPreviewLight />
        </div>
      </section>
      <Problem />
      <HowItWorks />
      <QuestionEngine />
      <Metrics />
      <History />
      <Pricing />
      <FAQ />
      <CTAFinal />
      <Footer />
    </main>
  )
}
