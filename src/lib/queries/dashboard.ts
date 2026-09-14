// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'

// Toutes les requêtes ci-dessous lisent les vraies tables Supabase
// (brands, measurement_runs, opportunities, events, site_pages…).
// Aucune donnée simulée : si une marque n'a pas encore de run, les pages
// doivent afficher un état "No data" / "Reflet n'a pas encore mesuré",
// jamais un chiffre inventé.

export const fetchCurrentBrand = createServerFn({ method: 'GET' }).handler(async (): Promise<any> => {
  const supabase = getSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data: brand, error } = await supabase
    .from('brands')
    .select('*')
    .eq('owner_id', auth.user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return brand
})

// KPI calculés à partir des observations du dernier run — jamais de chiffre
// inventé : si latestRun n'a pas d'observations exploitables, chaque champ
// reste `null` et l'UI doit afficher "—", pas 0.
export interface HomeKpis {
  mentionsPct: number | null
  recommendationsPct: number | null
  avgPosition: number | null
  competitivePresencePct: number | null
  observationsCount: number
}

export interface QuestionPerf {
  id: string
  text: string
  mentioned: boolean
  recommended: boolean
  position: number | null
}

export interface CompetitorMini {
  id: string
  name: string
  mentions: number
}

async function computeLatestRunInsights(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  brandId: string,
  latestRun: { id: string; status: string } | null,
) {
  const empty = {
    kpis: {
      mentionsPct: null,
      recommendationsPct: null,
      avgPosition: null,
      competitivePresencePct: null,
      observationsCount: 0,
    } as HomeKpis,
    questionsPerf: [] as QuestionPerf[],
    topCompetitors: [] as CompetitorMini[],
  }

  // Pas de run exploitable (aucun run, ou run pas encore terminé) → tout reste vide.
  if (!latestRun || (latestRun.status !== 'success' && latestRun.status !== 'partial')) {
    return empty
  }

  const [{ data: observations }, { data: questions }, { data: competitors }] = await Promise.all([
    supabase.from('observations').select('*').eq('run_id', latestRun.id),
    supabase
      .from('questions')
      .select('id, text, position')
      .eq('brand_id', brandId)
      .order('position', { ascending: true }),
    supabase.from('competitors').select('id, name').eq('brand_id', brandId).eq('hidden', false),
  ])

  if (!observations || observations.length === 0) return empty

  const total = observations.length
  const mentionedCount = observations.filter((o) => o.brand_mentioned).length
  const recommendedCount = observations.filter((o) => o.brand_recommended).length
  const positions = observations
    .map((o) => o.brand_position)
    .filter((p): p is number => p !== null)

  const observationIds = observations.map((o) => o.id)
  const { data: obsCompetitors } = await supabase
    .from('observation_competitors')
    .select('*')
    .in('observation_id', observationIds)
    .eq('mentioned', true)

  const observationsWithCompetitor = new Set((obsCompetitors ?? []).map((oc) => oc.observation_id))

  const competitorMentions = new Map<string, number>()
  for (const oc of obsCompetitors ?? []) {
    competitorMentions.set(oc.competitor_id, (competitorMentions.get(oc.competitor_id) ?? 0) + 1)
  }

  const competitorById = new Map((competitors ?? []).map((c) => [c.id, c.name]))
  const topCompetitors: CompetitorMini[] = [...competitorMentions.entries()]
    .filter(([id]) => competitorById.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, mentions]) => ({ id, name: competitorById.get(id)!, mentions }))

  const observationByQuestion = new Map(observations.map((o) => [o.question_id, o]))
  const questionsPerf: QuestionPerf[] = (questions ?? [])
    .map((q) => {
      const obs = observationByQuestion.get(q.id)
      if (!obs) return null
      return {
        id: q.id,
        text: q.text,
        mentioned: obs.brand_mentioned,
        recommended: obs.brand_recommended,
        position: obs.brand_position,
      }
    })
    .filter((q): q is QuestionPerf => q !== null)
    .slice(0, 5)

  const kpis: HomeKpis = {
    mentionsPct: Math.round((mentionedCount / total) * 100),
    recommendationsPct: Math.round((recommendedCount / total) * 100),
    avgPosition:
      positions.length > 0
        ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
        : null,
    competitivePresencePct: Math.round((observationsWithCompetitor.size / total) * 100),
    observationsCount: total,
  }

  return { kpis, questionsPerf, topCompetitors }
}

export const fetchDashboardHome = createServerFn({ method: 'GET' }).handler(async (): Promise<any> => {
  const supabase = getSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { brand: null } as const

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('owner_id', auth.user.id)
    .maybeSingle()

  if (!brand) return { brand: null } as const

  const [{ data: runs }, { data: opportunities }, { data: events }, { data: pages }] =
    await Promise.all([
      supabase
        .from('measurement_runs')
        .select('*')
        .eq('brand_id', brand.id)
        .order('started_at', { ascending: false })
        .limit(2),
      supabase
        .from('opportunities')
        .select('*')
        .eq('brand_id', brand.id)
        .eq('status', 'open')
        .order('confidence', { ascending: false })
        .limit(5),
      supabase
        .from('events')
        .select('*')
        .eq('brand_id', brand.id)
        .eq('show_history', true)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('site_pages').select('*').eq('brand_id', brand.id),
    ])

  const latestRun = runs?.[0] ?? null
  const previousRun = runs?.[1] ?? null

  const insights = await computeLatestRunInsights(supabase, brand.id, latestRun)

  return {
    brand,
    latestRun,
    previousRun,
    opportunities: opportunities ?? [],
    events: events ?? [],
    pages: pages ?? [],
    kpis: insights.kpis,
    questionsPerf: insights.questionsPerf,
    topCompetitors: insights.topCompetitors,
  } as const
})
