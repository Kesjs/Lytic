// @ts-nocheck
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

export interface MetricAnnotation {
  id: string
  date: string
  changeType: string
  importance: string
  snippet: string | null
}

export interface IndicatorComparison {
  current: number | null
  previous: number | null
  delta: number | null
}

export interface MetricsHistoryResult {
  points: MetricPoint[]
  annotations: MetricAnnotation[]
  comparison: {
    score: IndicatorComparison
    mentionsPct: IndicatorComparison
    recommendationsPct: IndicatorComparison
    avgPosition: IndicatorComparison
  }
}

function daysForPeriod(period: MetricPeriod) {
  return period === '7d' ? 7 : period === '30d' ? 30 : 90
}

function lastValue(points: MetricPoint[], key: keyof MetricPoint): number | null {
  for (let i = points.length - 1; i >= 0; i--) {
    const v = points[i][key]
    if (v !== null) return v as number
  }
  return null
}

function buildComparison(current: MetricPoint[], previous: MetricPoint[], key: keyof MetricPoint): IndicatorComparison {
  const curr = lastValue(current, key)
  const prev = lastValue(previous, key)
  if (curr === null || prev === null) return { current: curr, previous: prev, delta: null }
  return { current: curr, previous: prev, delta: Math.round((curr - prev) * 10) / 10 }
}

// Historique multi-indicateurs, utilisé par le graphique de l'Accueil (score
// seul) et par le graphique de la page Performance (sélecteur d'indicateur).
// Seuls les runs terminés avec succès comptent — un run "partial" a un score
// non fiable et n'est pas inclus dans la tendance.
async function loadPoints(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  brandId: string,
  fromIso: string,
  toIso: string,
): Promise<MetricPoint[]> {
  const { data: runs } = await supabase
    .from('measurement_runs')
    .select('id, completed_at, score')
    .eq('brand_id', brandId)
    .eq('status', 'success')
    .not('completed_at', 'is', null)
    .gte('completed_at', fromIso)
    .lt('completed_at', toIso)
    .order('completed_at', { ascending: true })

  if (!runs || runs.length === 0) return []

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

  return runs.map((run) => {
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
}

// Historique multi-indicateurs, utilisé par le graphique de l'Accueil (score
// seul) et par le graphique de la page Performance (sélecteur d'indicateur).
// Renvoie aussi la période précédente équivalente (pour le delta affiché) et
// les changements de site détectés sur la période, à afficher en annotations
// sur la courbe. Seuls les runs terminés avec succès comptent — un run
// "partial" a un score non fiable et n'est pas inclus dans la tendance.
export const fetchMetricsHistory = createServerFn({ method: 'GET' })
  .validator((period: MetricPeriod) => period)
  .handler(async ({ data: period }): Promise<MetricsHistoryResult> => {
    const empty: MetricsHistoryResult = {
      points: [],
      annotations: [],
      comparison: {
        score: { current: null, previous: null, delta: null },
        mentionsPct: { current: null, previous: null, delta: null },
        recommendationsPct: { current: null, previous: null, delta: null },
        avgPosition: { current: null, previous: null, delta: null },
      },
    }

    const supabase = getSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return empty

    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('owner_id', auth.user.id)
      .maybeSingle()

    if (!brand) return empty

    const days = daysForPeriod(period)
    const now = new Date().toISOString()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const previousSince = new Date(Date.now() - 2 * days * 24 * 60 * 60 * 1000).toISOString()

    const [points, previousPoints] = await Promise.all([
      loadPoints(supabase, brand.id, since, now),
      loadPoints(supabase, brand.id, previousSince, since),
    ])

    if (points.length === 0) return empty

    const { data: changes } = await supabase
      .from('site_changes')
      .select('id, detected_at, change_type, importance, after_snippet')
      .eq('brand_id', brand.id)
      .gte('detected_at', since)
      .order('detected_at', { ascending: true })

    const annotations: MetricAnnotation[] = (changes ?? []).map((c) => ({
      id: c.id,
      date: c.detected_at as string,
      changeType: c.change_type,
      importance: c.importance,
      snippet: c.after_snippet,
    }))

    return {
      points,
      annotations,
      comparison: {
        score: buildComparison(points, previousPoints, 'score'),
        mentionsPct: buildComparison(points, previousPoints, 'mentionsPct'),
        recommendationsPct: buildComparison(points, previousPoints, 'recommendationsPct'),
        avgPosition: buildComparison(points, previousPoints, 'avgPosition'),
      },
    }
  })
