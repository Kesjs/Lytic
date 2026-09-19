import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts'
import { Lock, TableProperties, TrendingUp } from 'lucide-react'
import { fetchMetricsHistory, type MetricPeriod, type MetricPoint } from '~/lib/queries/metrics'

type Indicator = 'score' | 'mentionsPct' | 'recommendationsPct' | 'avgPosition'
type ViewMode = 'chart' | 'table'

const INDICATORS: { value: Indicator; label: string; unit: string; domain: [number, number] | undefined; color: string }[] = [
  { value: 'score', label: 'Score', unit: '/ 100', domain: [0, 100], color: '#f2d94e' },
  { value: 'mentionsPct', label: 'Mentions', unit: '%', domain: [0, 100], color: '#5eead4' },
  { value: 'recommendationsPct', label: 'Recommandations', unit: '%', domain: [0, 100], color: '#93c5fd' },
  { value: 'avgPosition', label: 'Position moyenne', unit: '', domain: undefined, color: '#f0abfc' },
]

const PERIODS: { value: MetricPeriod; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '3m', label: '3 mois' },
]

const IMPORTANCE_LABEL: Record<string, string> = {
  high: 'Impact fort',
  low: 'Impact faible',
  watch: 'À surveiller',
}

// Une position moyenne qui baisse est une amélioration (1er = mieux que 5e) —
// c'est le seul indicateur où le sens du delta s'inverse.
function isImprovement(indicator: Indicator, delta: number) {
  if (indicator === 'avgPosition') return delta < 0
  return delta > 0
}

export function PerformanceChart({ hasAnyRun, free = false }: { hasAnyRun: boolean; free?: boolean }) {
  const [indicator, setIndicator] = useState<Indicator>('score')
  const [overlay, setOverlay] = useState(false)
  const [period, setPeriod] = useState<MetricPeriod>('30d')
  const [view, setView] = useState<ViewMode>('chart')

  const { data, isLoading } = useQuery({
    queryKey: ['metrics-history', period],
    queryFn: () => fetchMetricsHistory({ data: period }),
    enabled: hasAnyRun && !free,
  })

  const meta = INDICATORS.find((i) => i.value === indicator)!
  const rawPoints = data?.points ?? []
  // Position moyenne : l'absence de mention n'est pas "position 0" — on filtre
  // les points sans valeur pour ne jamais afficher un résultat inventé.
  const points = rawPoints.filter((p) => p[indicator] !== null) as (MetricPoint & {
    [k in Indicator]: number
  })[]
  const overlayPoints = rawPoints as MetricPoint[]
  const comparison = data?.comparison?.[indicator]
  const annotations = data?.annotations ?? []

  // Associe chaque annotation au point de données le plus proche pour la
  // positionner sur l'axe X du graphique (même échelle de dates que `points`).
  const annotationsForChart = useMemo(() => {
    const basis = overlay ? overlayPoints : points
    if (basis.length === 0) return []
    return annotations
      .map((a) => {
        const closest = basis.reduce((best, p) =>
          Math.abs(new Date(p.date).getTime() - new Date(a.date).getTime()) <
          Math.abs(new Date(best.date).getTime() - new Date(a.date).getTime())
            ? p
            : best,
        )
        return { ...a, chartDate: closest.date }
      })
      .filter((a) => basis.some((p) => p.date === a.chartDate))
  }, [annotations, points, overlayPoints, overlay])

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
        <div className="flex flex-wrap items-center gap-2">
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
          <button
            type="button"
            onClick={() => setView((v) => (v === 'chart' ? 'table' : 'chart'))}
            className="flex items-center gap-1.5 rounded-md border border-border bg-elevated px-2 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:text-ink-primary"
            title={view === 'chart' ? 'Voir en tableau' : 'Voir en graphique'}
          >
            <TableProperties className="size-3.5" />
            {view === 'chart' ? 'Tableau' : 'Graphique'}
          </button>
        </div>
      </div>

      {hasAnyRun && !free && view === 'chart' && (
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs text-ink-secondary">
            <input
              type="checkbox"
              checked={overlay}
              onChange={(e) => setOverlay(e.target.checked)}
              className="size-3.5 rounded border-border accent-brand"
            />
            Superposer tous les indicateurs
          </label>
          {comparison && comparison.delta !== null && (
            <ComparisonBadge indicator={indicator} comparison={comparison} unit={meta.unit} periodLabel={PERIODS.find((p) => p.value === period)!.label} />
          )}
        </div>
      )}

      <div className="mt-4">
        {!hasAnyRun ? (
          <ChartMessage text="Pas encore de mesure — le graphique apparaîtra après la première mesure." />
        ) : free ? (
          <FreeChartTeaser />
        ) : isLoading ? (
          <ChartMessage text="Chargement du graphique…" />
        ) : rawPoints.length === 0 ? (
          <ChartMessage text="Aucune donnée exploitable pour cette période." />
        ) : view === 'table' ? (
          <MetricsTable points={rawPoints} annotations={annotations} />
        ) : overlay ? (
          <OverlayChart points={overlayPoints} annotations={annotationsForChart} />
        ) : points.length === 0 ? (
          <ChartMessage text="Aucune donnée exploitable pour cet indicateur sur cette période." />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={meta.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={meta.color} stopOpacity={0} />
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
              {annotationsForChart.map((a) => (
                <ReferenceLine
                  key={a.id}
                  x={a.chartDate}
                  stroke={a.importance === 'high' ? '#f87171' : '#6b6b6b'}
                  strokeDasharray="4 3"
                  label={{
                    value: '●',
                    position: 'top',
                    fill: a.importance === 'high' ? '#f87171' : '#a3a3a3',
                    fontSize: 10,
                  }}
                />
              ))}
              <Area
                type="monotone"
                dataKey={indicator}
                stroke={meta.color}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPerf)"
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {hasAnyRun && !free && view === 'chart' && annotationsForChart.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-border pt-3">
          {annotationsForChart.map((a) => (
            <p key={a.id} className="flex items-start gap-2 text-xs text-ink-muted">
              <span
                className={`mt-1 size-1.5 shrink-0 rounded-full ${a.importance === 'high' ? 'bg-danger' : 'bg-ink-muted'}`}
              />
              <span>
                <span className="font-medium text-ink-secondary">
                  {new Date(a.date).toLocaleDateString('fr-FR')}
                </span>{' '}
                — {IMPORTANCE_LABEL[a.importance] ?? a.importance} · {a.changeType}
                {a.snippet ? ` · « ${a.snippet} »` : ''}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function ComparisonBadge({
  indicator,
  comparison,
  unit,
  periodLabel,
}: {
  indicator: Indicator
  comparison: { current: number | null; previous: number | null; delta: number | null }
  unit: string
  periodLabel: string
}) {
  if (comparison.delta === null) return null
  const improved = isImprovement(indicator, comparison.delta)
  const flat = comparison.delta === 0
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
        flat
          ? 'bg-elevated text-ink-muted'
          : improved
            ? 'bg-success/10 text-success'
            : 'bg-danger/10 text-danger'
      }`}
      title={`vs période précédente (${periodLabel.toLowerCase()}) : ${comparison.previous}${unit ? ` ${unit}` : ''}`}
    >
      <TrendingUp className={`size-3 ${!flat && !improved ? 'rotate-180' : ''}`} />
      {comparison.delta > 0 ? '+' : ''}
      {comparison.delta}
      {unit ? ` ${unit}` : ''} vs période précédente
    </span>
  )
}

function OverlayChart({ points, annotations }: { points: MetricPoint[]; annotations: { id: string; chartDate: string; importance: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
          stroke="#6b6b6b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis yAxisId="pct" domain={[0, 100]} stroke="#6b6b6b" fontSize={11} tickLine={false} axisLine={false} width={40} />
        <YAxis
          yAxisId="pos"
          orientation="right"
          reversed
          stroke="#6b6b6b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 8, fontSize: 12 }}
          labelFormatter={(v: string) => new Date(v).toLocaleDateString('fr-FR')}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {annotations.map((a) => (
          <ReferenceLine key={a.id} yAxisId="pct" x={a.chartDate} stroke={a.importance === 'high' ? '#f87171' : '#6b6b6b'} strokeDasharray="4 3" />
        ))}
        <Line yAxisId="pct" type="monotone" dataKey="score" name="Score" stroke="#f2d94e" strokeWidth={2} dot={false} connectNulls />
        <Line yAxisId="pct" type="monotone" dataKey="mentionsPct" name="Mentions %" stroke="#5eead4" strokeWidth={2} dot={false} connectNulls />
        <Line yAxisId="pct" type="monotone" dataKey="recommendationsPct" name="Recommandations %" stroke="#93c5fd" strokeWidth={2} dot={false} connectNulls />
        <Line yAxisId="pos" type="monotone" dataKey="avgPosition" name="Position moyenne" stroke="#f0abfc" strokeWidth={2} dot={false} connectNulls />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function MetricsTable({ points, annotations }: { points: MetricPoint[]; annotations: { id: string; date: string; changeType: string; importance: string }[] }) {
  const annotationByDate = new Map<string, string[]>()
  for (const a of annotations) {
    const key = new Date(a.date).toDateString()
    const list = annotationByDate.get(key) ?? []
    list.push(a.changeType)
    annotationByDate.set(key, list)
  }

  return (
    <div className="max-h-[320px] overflow-y-auto overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-elevated text-xs text-ink-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Date</th>
            <th className="px-3 py-2 text-right font-medium">Score</th>
            <th className="px-3 py-2 text-right font-medium">Mentions</th>
            <th className="px-3 py-2 text-right font-medium">Reco</th>
            <th className="px-3 py-2 text-right font-medium">Position</th>
            <th className="px-3 py-2 text-left font-medium">Événement</th>
          </tr>
        </thead>
        <tbody>
          {[...points].reverse().map((p) => {
            const key = new Date(p.date).toDateString()
            const events = annotationByDate.get(key)
            return (
              <tr key={p.date} className="border-t border-border">
                <td className="px-3 py-2 text-ink-secondary">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink-primary">{p.score ?? '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink-primary">{p.mentionsPct !== null ? `${p.mentionsPct}%` : '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink-primary">{p.recommendationsPct !== null ? `${p.recommendationsPct}%` : '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink-primary">{p.avgPosition !== null ? `#${p.avgPosition}` : '—'}</td>
                <td className="px-3 py-2 text-xs text-ink-muted">{events ? events.join(', ') : ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
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
