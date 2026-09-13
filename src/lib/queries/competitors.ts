import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'

export interface CompetitorRow {
  id: string
  name: string
  mentions: number
  mentionsPct: number
  recommendedCount: number
  recommendationsPct: number
  avgPosition: number | null
  coveragePct: number
  excerpts: string[]
}

export interface OwnStats {
  mentionsPct: number
  recommendationsPct: number
}

// Vue d'ensemble de la page Concurrents, calculée à partir des observations
// de la dernière mesure (cohérent avec Accueil/Performance). Un concurrent
// masqué (`hidden = true`) n'apparaît jamais ici.
export const fetchCompetitorsOverview = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = getSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { brand: null } as const

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('owner_id', auth.user.id)
    .maybeSingle()

  if (!brand) return { brand: null } as const

  const { data: runs } = await supabase
    .from('measurement_runs')
    .select('*')
    .eq('brand_id', brand.id)
    .order('started_at', { ascending: false })
    .limit(1)

  const latestRun = runs?.[0] ?? null

  const empty = {
    brand,
    latestRun,
    ownStats: null as OwnStats | null,
    competitors: [] as CompetitorRow[],
  } as const

  if (!latestRun || (latestRun.status !== 'success' && latestRun.status !== 'partial')) {
    return empty
  }

  const [{ data: observations }, { data: competitors }] = await Promise.all([
    supabase.from('observations').select('*').eq('run_id', latestRun.id),
    supabase.from('competitors').select('id, name').eq('brand_id', brand.id).eq('hidden', false),
  ])

  if (!observations || observations.length === 0) return empty

  const totalQuestions = observations.length
  const ownStats: OwnStats = {
    mentionsPct: Math.round(
      (observations.filter((o) => o.brand_mentioned).length / totalQuestions) * 100,
    ),
    recommendationsPct: Math.round(
      (observations.filter((o) => o.brand_recommended).length / totalQuestions) * 100,
    ),
  }

  const observationIds = observations.map((o) => o.id)
  const { data: obsCompetitors } = await supabase
    .from('observation_competitors')
    .select('*')
    .in('observation_id', observationIds)

  type Agg = {
    mentions: number
    recommended: number
    positions: number[]
    questionIds: Set<string>
    excerpts: string[]
  }
  const obsById = new Map(observations.map((o) => [o.id, o]))
  const aggByCompetitor = new Map<string, Agg>()

  for (const oc of obsCompetitors ?? []) {
    if (!oc.mentioned) continue
    const obs = obsById.get(oc.observation_id)
    if (!obs) continue

    const agg = aggByCompetitor.get(oc.competitor_id) ?? {
      mentions: 0,
      recommended: 0,
      positions: [],
      questionIds: new Set<string>(),
      excerpts: [],
    }
    agg.mentions += 1
    if (oc.recommended) agg.recommended += 1
    if (oc.position !== null) agg.positions.push(oc.position)
    agg.questionIds.add(obs.question_id)
    if (oc.context_excerpt && agg.excerpts.length < 3) agg.excerpts.push(oc.context_excerpt)
    aggByCompetitor.set(oc.competitor_id, agg)
  }

  const competitorRows: CompetitorRow[] = (competitors ?? [])
    .map((c) => {
      const agg = aggByCompetitor.get(c.id)
      if (!agg || agg.mentions === 0) return null
      return {
        id: c.id,
        name: c.name,
        mentions: agg.mentions,
        mentionsPct: Math.round((agg.mentions / totalQuestions) * 100),
        recommendedCount: agg.recommended,
        recommendationsPct: Math.round((agg.recommended / totalQuestions) * 100),
        avgPosition:
          agg.positions.length > 0
            ? Math.round((agg.positions.reduce((a, b) => a + b, 0) / agg.positions.length) * 10) /
              10
            : null,
        coveragePct: Math.round((agg.questionIds.size / totalQuestions) * 100),
        excerpts: agg.excerpts,
      }
    })
    .filter((c): c is CompetitorRow => c !== null)
    .sort((a, b) => b.mentions - a.mentions)

  return { brand, latestRun, ownStats, competitors: competitorRows } as const
})

// Masque un concurrent jugé non pertinent — il n'apparaîtra plus dans les
// agrégations tant qu'il n'est pas réaffiché (pas de suppression de données).
export const hideCompetitor = createServerFn({ method: 'POST' })
  .validator((competitorId: string) => competitorId)
  .handler(async ({ data: competitorId }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) throw new Error('Non authentifié')

    const { data: competitor } = await supabase
      .from('competitors')
      .select('id, brand_id')
      .eq('id', competitorId)
      .maybeSingle()

    if (!competitor) throw new Error('Concurrent introuvable')

    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('id', competitor.brand_id)
      .eq('owner_id', auth.user.id)
      .maybeSingle()

    if (!brand) throw new Error('Concurrent introuvable')

    const { error } = await supabase
      .from('competitors')
      .update({ hidden: true })
      .eq('id', competitorId)

    if (error) throw new Error(error.message)
    return { success: true } as const
  })
