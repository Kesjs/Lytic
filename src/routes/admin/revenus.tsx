import { createFileRoute } from '@tanstack/react-router'
import { SectionCard } from '~/components/ui/section-card'
import { Receipt } from 'lucide-react'

export const Route = createFileRoute('/admin/revenus')({
  component: AdminRevenus,
})

function AdminRevenus() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink-primary">Revenus</h1>

      <SectionCard title="Intégration Stripe à venir">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface">
            <Receipt className="h-6 w-6 text-ink-muted" />
          </div>
          <h3 className="mt-4 font-display text-lg font-medium text-ink-primary">Aucune donnée financière</h3>
          <p className="mt-2 max-w-sm text-sm text-ink-secondary">
            Les métriques de revenus (MRR, abonnements actifs, churn) seront disponibles ici une fois l'intégration Stripe finalisée.
          </p>
        </div>
      </SectionCard>
    </div>
  )
}
