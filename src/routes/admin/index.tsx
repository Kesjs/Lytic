import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchAdminOverview } from '~/lib/queries/admin-dashboard'
import { KpiCard } from '~/components/ui/kpi-card'
import { SectionCard } from '~/components/ui/section-card'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => fetchAdminOverview(),
  })

  if (isLoading || !overview) {
    return <div className="p-4 text-ink-muted">Chargement...</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink-primary">Vue d'ensemble</h1>
      
      <SectionCard title="Métriques globales">
        <div className="grid grid-cols-2 divide-x divide-y divide-border border-t border-border lg:grid-cols-4 lg:divide-y-0">
          <KpiCard label="Utilisateurs" value={overview.totalUsers.toString()} hint="Comptes inscrits" />
          <KpiCard label="Marques" value={overview.totalBrands.toString()} hint="Projets configurés" />
          <KpiCard label="Mesures" value={overview.totalRuns.toString()} hint="Runs effectués" />
          <KpiCard 
            label="Coûts IA" 
            value={`$${overview.totalCostsUSD.toFixed(2)}`} 
            hint="API OpenAI" 
            tooltip="Coût total estimé depuis le début"
          />
        </div>
      </SectionCard>
    </div>
  )
}
