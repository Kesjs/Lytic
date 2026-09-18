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

interface ScoreChartProps {
  hasAnyRun: boolean
  /**
   * 'full' = carte autonome avec sélecteur de période (utilisé sur les pages
   * qui veulent explorer le détail). 'compact' = sparkline sans axes/tooltip,
   * pensée pour être intégrée dans la carte score de l'Accueil — l'exploration
   * détaillée reste disponible sur la page Performance (mêmes données, plus
   * d'indicateurs).
   */
  variant?: 'full' | 'compact'
}

export function ScoreChart({ hasAnyRun, variant = 'full' }: ScoreChartProps) {
  const [period, setPeriod] = useState<MetricPeriod>('30d')

  const { data, isLoading } = useQuery({
    queryKey: ['metrics-history', period],
    queryFn: () => fetchMetricsHistory({ data: period }),
    enabled: hasAnyRun,
  })

  const points = (data?.points ?? []).filter((p) => p.score !== null)

  if (variant === 'compact') {
    // Pas de skeleton/message ici : si rien à montrer, la carte score
    // affiche juste le chiffre sans sparkline en dessous — pas de bloc vide.
    if (!hasAnyRun || isLoading || points.length < 2) return null
    return (
      <div className="mt-2 h-12 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="colorScoreCompact" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f2d94e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f2d94e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="linear"
              dataKey="score"
              stroke="var(--color-brand, #c9ab1e)"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorScoreCompact)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

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
                  background: 'rgb(var(--color-elevated))',
                  border: '1px solid rgb(var(--color-border))',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'rgb(var(--color-ink-primary))',
                }}
                itemStyle={{ color: 'rgb(var(--color-ink-primary))' }}
                labelStyle={{ color: 'rgb(var(--color-ink-secondary))', marginBottom: 4 }}
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
