import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '~/components/landing/Navbar'
import { Pricing } from '~/components/landing/Pricing'
import { FAQ } from '~/components/landing/FAQ'
import { CTAFinal } from '~/components/landing/CTAFinal'
import { Footer } from '~/components/landing/Footer'

export const Route = createFileRoute('/tarifs')({
  component: TarifsPage,
})

function TarifsPage() {
  return (
    <main className="theme-landing min-h-screen bg-canvas">
      <Navbar />

      {/* Espace sous la navbar fixe, avant les cards de Pricing (qui
          embarquent déjà leur propre titre + sous-titre). */}
      <div className="pt-32 sm:pt-40" />

      <Pricing />

      {/* Emplacement du futur tableau de comparaison détaillé des plans. */}
      <section className="border-t border-hairline border-border px-6 py-24">
        <div className="mx-auto max-w-1200 text-center">
          <p className="text-sm text-ink-muted">Tableau de comparaison détaillé — à venir.</p>
        </div>
      </section>

      <FAQ />
      <CTAFinal />
      <Footer />
    </main>
  )
}
