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
import { Lock } from 'lucide-react'
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

export function PerformanceChart({ hasAnyRun, free = false }: { hasAnyRun: boolean; free?: boolean }) {
  const [indicator, setIndicator] = useState<Indicator>('score')
  const [period, setPeriod] = useState<MetricPeriod>('30d')

  const { data, isLoading } = useQuery({
    queryKey: ['metrics-history', period],
    queryFn: () => fetchMetricsHistory({ data: period }),
    enabled: hasAnyRun && !free,
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
        ) : free ? (
          <FreeChartTeaser />
        ) : isLoading ? (
          <ChartMessage text="Chargement du graphique…" />
        ) : points.length === 0 ? (
          <ChartMessage text="Aucune donnée exploitable pour cet indicateur sur cette période." />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f2d94e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f2d94e" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                width={44}
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
              <Area
                type="monotone"
                dataKey={indicator}
                stroke="#f2d94e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPerf)"
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// Plan Free : jamais assez de mesures pour tracer une vraie courbe (1 seul
// point). On montre une forme grise abstraite — jamais de données
// fabriquées — plutôt qu'un graphique à point unique trompeur. Même
// principe de flou que la page Concurrents.
function FreeChartTeaser() {
  return (
    <div className="relative h-[260px] overflow-hidden rounded-md border border-border">
      <svg
        aria-hidden="true"
        viewBox="0 0 400 160"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full blur-sm select-none opacity-60"
      >
        <path
          d="M0,120 C40,100 60,60 100,70 C140,80 160,40 200,50 C240,60 260,20 300,35 C340,50 360,90 400,80"
          fill="none"
          stroke="#6b6b6b"
          strokeWidth={3}
        />
        <path
          d="M0,120 C40,100 60,60 100,70 C140,80 160,40 200,50 C240,60 260,20 300,35 C340,50 360,90 400,80 L400,160 L0,160 Z"
          fill="#6b6b6b"
          opacity={0.15}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-canvas/70 px-6 text-center">
        <Lock className="size-4 text-ink-muted" />
        <p className="text-sm text-ink-secondary">
          Ce n'est qu'un instantané — le suivi semaine après semaine est réservé au plan Pro.
        </p>
        <a
          href="/dashboard/parametres"
          className="mt-1 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-black hover:bg-brand-hover"
        >
          Débloquer le suivi dans le temps avec Pro
        </a>
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
