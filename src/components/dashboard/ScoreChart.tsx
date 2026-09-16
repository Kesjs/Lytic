import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { fetchMetricsHistory, type MetricPeriod } from '~/lib/queries/metrics'

const PERIODS: { value: MetricPeriod; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '3m', label: '3 mois' },
]

export function ScoreChart({ hasAnyRun }: { hasAnyRun: boolean }) {
  const [period, setPeriod] = useState<MetricPeriod>('30d')

  const { data, isLoading } = useQuery({
    queryKey: ['metrics-history', period],
    queryFn: () => fetchMetricsHistory({ data: period }),
    enabled: hasAnyRun,
  })

  const points = (data?.points ?? []).filter((p) => p.score !== null)

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-ink-muted">
          Graphique d'évolution
        </h2>
        <div className="flex gap-1 rounded-md border border-border bg-elevated p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`rounded-sm px-2 py-1 text-xs font-medium transition-colors ${
                period === p.value
                  ? 'bg-brand text-black'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex-1">
        {!hasAnyRun ? (
          <ChartMessage text="Pas encore de mesure — le graphique apparaîtra après la première mesure." />
        ) : isLoading ? (
          <ChartMessage text="Chargement du graphique…" />
        ) : points.length === 0 ? (
          <ChartMessage text={`Aucune mesure réussie sur cette période (${periodLabel(period)}).`} />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f2d94e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f2d94e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} horizontal={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) =>
                  new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                }
                stroke="#6b6b6b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#6b6b6b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1a1a',
                  border: '1px solid #262626',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(v: string) => new Date(v).toLocaleDateString('fr-FR')}
                formatter={(value: number) => [`${value} / 100`, 'Score']}
              />
              <Area
                type="linear"
                dataKey="score"
                stroke="var(--color-brand, #c9ab1e)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorScore)"
                activeDot={{ r: 5, fill: "var(--color-brand, #c9ab1e)", stroke: "var(--color-surface, #141414)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function periodLabel(period: MetricPeriod) {
  return PERIODS.find((p) => p.value === period)?.label ?? period
}

function ChartMessage({ text }: { text: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-center text-sm text-ink-muted">
      {text}
    </div>
  )
}
