import { useQuery } from '@tanstack/react-query'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { fetchAuditScoreHistory } from '~/lib/queries/audit-history'

// Courbe de progression du score technique dans le temps — n'existait pas
// avant (le score était recalculé à la volée à chaque affichage, jamais
// stocké). Reste discrète : un seul point tant qu'il n'y a eu qu'un crawl
// depuis le déploiement de cette fonctionnalité, pas de fausse tendance.
export function AuditScoreHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-score-history'],
    queryFn: () => fetchAuditScoreHistory(),
  })

  const points = data ?? []

  if (isLoading) {
    return <div className="h-[140px] animate-pulse rounded-md bg-elevated" />
  }

  if (points.length < 2) {
    return (
      <p className="text-xs text-ink-muted">
        La courbe de progression apparaîtra après votre prochain audit (il faut au moins deux
        mesures pour tracer une tendance).
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="colorAuditScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
          stroke="#6b6b6b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis domain={[0, 100]} stroke="#6b6b6b" fontSize={11} tickLine={false} axisLine={false} width={32} />
        <Tooltip
          contentStyle={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 8, fontSize: 12 }}
          labelFormatter={(v: string) => new Date(v).toLocaleDateString('fr-FR')}
          formatter={(value: number) => [`${value}/100`, 'Score technique']}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#93c5fd"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorAuditScore)"
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
