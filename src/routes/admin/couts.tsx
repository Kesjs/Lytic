import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAdminCosts } from '~/lib/queries/admin-costs'
import { SectionCard } from '~/components/ui/section-card'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/admin/couts')({
  component: AdminCosts,
})

const ALERT_THRESHOLD = 5.0 // Seuil d'alerte à $5 par jour (modifiable plus tard en DB)

function AdminCosts() {
  const [period, setPeriod] = useState<'7d' | '30d'>('30d')
  
  const { data: costs, isLoading } = useQuery({
    queryKey: ['admin-costs', period],
    queryFn: () => fetchAdminCosts({ data: period }),
  })

  // Aggrégation par date pour le graphique
  const chartData = (costs ?? []).reduce((acc: any[], curr) => {
    let point = acc.find(p => p.date === curr.date)
    if (!point) {
      point = { date: curr.date, totalCost: 0 }
      acc.push(point)
    }
    point.totalCost += curr.cost
    point[curr.callType] = (point[curr.callType] || 0) + curr.cost
    return acc
  }, [])

  const totalPeriodCost = chartData.reduce((sum, p) => sum + p.totalCost, 0)
  const isOverThreshold = chartData.some(p => p.totalCost >= ALERT_THRESHOLD)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink-primary">Coûts IA</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPeriod('7d')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              period === '7d' ? 'bg-ink-primary text-bg' : 'bg-surface text-ink-secondary hover:text-ink-primary'
            }`}
          >
            7 jours
          </button>
          <button
            type="button"
            onClick={() => setPeriod('30d')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              period === '30d' ? 'bg-ink-primary text-bg' : 'bg-surface text-ink-secondary hover:text-ink-primary'
            }`}
          >
            30 jours
          </button>
        </div>
      </div>

      {isOverThreshold && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/20 bg-warning/5 p-4 text-warning">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Alerte : Le coût journalier a dépassé le seuil de ${ALERT_THRESHOLD} durant la période sélectionnée.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Évolution des coûts (USD)">
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center text-ink-muted">Chargement...</div>
            ) : chartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'var(--color-ink-muted)', fontSize: 12 }}
                      tickFormatter={(val) => format(parseISO(val), 'dd MMM', { locale: fr })}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'var(--color-ink-muted)', fontSize: 12 }}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--color-ink-muted)', marginBottom: '4px' }}
                      itemStyle={{ color: 'var(--color-ink-primary)', fontWeight: 500 }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Coût total']}
                      labelFormatter={(label) => format(parseISO(label as string), 'dd MMMM yyyy', { locale: fr })}
                    />
                    <Area type="monotone" dataKey="totalCost" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-ink-muted">Aucune donnée sur cette période.</div>
            )}
          </SectionCard>
        </div>

        <div>
          <SectionCard title="Total de la période">
            <div className="mt-2 text-4xl font-display font-bold text-ink-primary">
              ${totalPeriodCost.toFixed(2)}
            </div>
            <p className="mt-2 text-sm text-ink-muted">Consommation totale estimée</p>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
