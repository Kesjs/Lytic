import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'

export type MetricPeriod = '7d' | '30d' | '3m'

export interface MetricPoint {
  date: string
  score: number | null
  mentionsPct: number | null
  recommendationsPct: number | null
  avgPosition: number | null
}

function daysForPeriod(period: MetricPeriod) {
  return period === '7d' ? 7 : period === '30d' ? 30 : 90
}

// Historique multi-indicateurs, utilisé par le graphique de l'Accueil (score
// seul) et par le graphique de la page Performance (sélecteur d'indicateur).
// Seuls les runs terminés avec succès comptent — un run "partial" a un score
// non fiable et n'est pas inclus dans la tendance.
export const fetchMetricsHistory = createServerFn({ method: 'GET' })
  .validator((period: MetricPeriod) => period)
  .handler(async ({ data: period }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return { points: [] as MetricPoint[] }

    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('owner_id', auth.user.id)
      .maybeSingle()

    if (!brand) return { points: [] as MetricPoint[] }

    const since = new Date(Date.now() - daysForPeriod(period) * 24 * 60 * 60 * 1000).toISOString()

    const { data: runs } = await supabase
      .from('measurement_runs')
      .select('id, completed_at, score')
      .eq('brand_id', brand.id)
      .eq('status', 'success')
      .not('completed_at', 'is', null)
      .gte('completed_at', since)
      .order('completed_at', { ascending: true })

    if (!runs || runs.length === 0) return { points: [] as MetricPoint[] }

    const runIds = runs.map((r) => r.id)
    const { data: observations } = await supabase
      .from('observations')
      .select('run_id, brand_mentioned, brand_recommended, brand_position')
      .in('run_id', runIds)

    const byRun = new Map<string, typeof observations>()
    for (const obs of observations ?? []) {
      const list = byRun.get(obs.run_id) ?? []
      list.push(obs)
      byRun.set(obs.run_id, list)
    }

    const points: MetricPoint[] = runs.map((run) => {
      const obs = byRun.get(run.id) ?? []
      const total = obs.length
      const positions = obs
        .map((o) => o.brand_position)
        .filter((p): p is number => p !== null)

      return {
        date: run.completed_at as string,
        score: run.score,
        mentionsPct: total > 0 ? Math.round((obs.filter((o) => o.brand_mentioned).length / total) * 100) : null,
        recommendationsPct:
          total > 0 ? Math.round((obs.filter((o) => o.brand_recommended).length / total) * 100) : null,
        avgPosition:
          positions.length > 0
            ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
            : null,
      }
    })

    return { points }
  })
