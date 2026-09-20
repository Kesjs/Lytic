import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '~/components/landing/Navbar'
import { Pricing } from '~/components/landing/Pricing'
import { PricingComparisonTable } from '~/components/landing/PricingComparisonTable'
import { Footer } from '~/components/landing/Footer'

export const Route = createFileRoute('/tarifs')({
  component: TarifsPage,
})

function TarifsPage() {
  return (
    <main className="theme-landing min-h-screen bg-canvas">
      <Navbar />

      {/* La navbar est fixe, le composant Pricing inclut déjà son padding (py-24). */}
      <Pricing />

      <PricingComparisonTable />
      <Footer />
    </main>
  )
}
