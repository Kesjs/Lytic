import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { fetchMetricsHistory, type MetricPeriod, type MetricPoint } from '~/lib/queries/metrics'

type Indicator = 'score' | 'mentionsPct' | 'recommendationsPct' | 'avgPosition'

const INDICATORS: { value: Indicator; label: string; unit: string; domain: [number, number] | undefined }[] = [
  { value: 'score', label: 'Score', unit: '/ 100', domain: [0, 100] },
  { value: 'mentionsPct', label: 'Mentions', unit: '%', domain: [0, 100] },
  { value: 'recommendationsPct', label: 'Recommandations', unit: '%', domain: [0, 100] },
  { value: 'avgPosition', label: 'Position moyenne', unit: '', domain: undefined },
]

const PERIODS: { value: MetricPeriod; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '3m', label: '3 mois' },
]

export function PerformanceChart({ hasAnyRun }: { hasAnyRun: boolean }) {
  const [indicator, setIndicator] = useState<Indicator>('score')
  const [period, setPeriod] = useState<MetricPeriod>('30d')

  const { data, isLoading } = useQuery({
    queryKey: ['metrics-history', period],
    queryFn: () => fetchMetricsHistory({ data: period }),
    enabled: hasAnyRun,
  })

  const meta = INDICATORS.find((i) => i.value === indicator)!
  // Position moyenne : l'absence de mention n'est pas "position 0" — on filtre
  // les points sans valeur pour ne jamais afficher un résultat inventé.
  const points = (data?.points ?? []).filter((p) => p[indicator] !== null) as (MetricPoint & {
    [k in Indicator]: number
  })[]

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-md border border-border bg-elevated p-0.5">
          {INDICATORS.map((i) => (
            <button
              key={i.value}
              type="button"
              onClick={() => setIndicator(i.value)}
              className={`rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                indicator === i.value
                  ? 'bg-brand text-black'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {i.label}
            </button>
          ))}
        </div>
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

      <div className="mt-4">
        {!hasAnyRun ? (
          <ChartMessage text="Pas encore de mesure — le graphique apparaîtra après la première mesure." />
        ) : isLoading ? (
          <ChartMessage text="Chargement du graphique…" />
        ) : points.length === 0 ? (
          <ChartMessage text="Aucune donnée exploitable pour cet indicateur sur cette période." />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
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
                domain={meta.domain}
                stroke="#6b6b6b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1a1a',
                  border: '1px solid #262626',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(v: string) => new Date(v).toLocaleDateString('fr-FR')}
                formatter={(value: number) => [`${value}${meta.unit ? ` ${meta.unit}` : ''}`, meta.label]}
              />
              <Line
                type="monotone"
                dataKey={indicator}
                stroke="#f2d94e"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f2d94e' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function ChartMessage({ text }: { text: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-center text-sm text-ink-muted">
      {text}
    </div>
  )
}
