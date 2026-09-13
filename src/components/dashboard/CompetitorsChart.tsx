import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { CompetitorRow, OwnStats } from '~/lib/queries/competitors'

export function CompetitorsChart({
  brandName,
  ownStats,
  competitors,
}: {
  brandName: string
  ownStats: OwnStats | null
  competitors: CompetitorRow[]
}) {
  if (!ownStats || competitors.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-lg border border-border bg-surface text-center text-sm text-ink-muted">
        Pas encore de concurrent détecté dans les réponses observées.
      </div>
    )
  }

  const data = [
    {
      name: brandName,
      mentions: ownStats.mentionsPct,
      recommandations: ownStats.recommendationsPct,
      isBrand: true,
    },
    ...competitors.slice(0, 6).map((c) => ({
      name: c.name,
      mentions: c.mentionsPct,
      recommandations: c.recommendationsPct,
      isBrand: false,
    })),
  ]

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="text-xs font-medium text-ink-muted">
        Présence dans les réponses observées
      </h2>
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#6b6b6b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              domain={[0, 100]}
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
              formatter={(value: number) => [`${value}%`, '']}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="mentions" name="Mentions" fill="#f2d94e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="recommandations" name="Recommandations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-ink-muted">
        Calculé sur les réponses observées lors de la dernière mesure — pas une mesure du marché
        entier.
      </p>
    </div>
  )
}
