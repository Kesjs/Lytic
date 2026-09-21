import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'
import { isFreePlan, FREE_MAX_COMPETITORS_VISIBLE, FREE_MEASUREMENTS_PER_WEEK, FREE_MEASUREMENT_WINDOW_DAYS } from '~/lib/plan'
import { getFreeRemeasureUnlock } from '~/lib/reliability'
import { getEngineLabel } from '~/lib/engine-labels'

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
    .limit(1)
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

export interface KpiTrends {
  mentionsTrend: number | null
  recommendationsTrend: number | null
  avgPositionTrend: number | null
  competitivePresenceTrend: number | null
}

export interface DashboardInsight {
  headline: string
  bullets: string[]
}

// Fonction pure : calcule les 4 KPI à partir d'observations déjà chargées
// (pas de requête ici) — réutilisée pour le run affiché ET pour le run
// précédent, afin de garder une seule définition de chaque KPI.
function computeKpisFromData(
  observations: { brand_mentioned: boolean; brand_recommended: boolean; brand_position: number | null }[],
  observationsWithCompetitor: Set<string>,
): HomeKpis {
  const total = observations.length
  if (total === 0) {
    return {
      mentionsPct: null,
      recommendationsPct: null,
      avgPosition: null,
      competitivePresencePct: null,
      observationsCount: 0,
    }
  }
  const mentionedCount = observations.filter((o) => o.brand_mentioned).length
  const recommendedCount = observations.filter((o) => o.brand_recommended).length
  const positions = observations.map((o) => o.brand_position).filter((p): p is number => p !== null)

  return {
    mentionsPct: Math.round((mentionedCount / total) * 100),
    recommendationsPct: Math.round((recommendedCount / total) * 100),
    avgPosition:
      positions.length > 0
        ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
        : null,
    competitivePresencePct: Math.round((observationsWithCompetitor.size / total) * 100),
    observationsCount: total,
  }
}

// Recharge juste ce qu'il faut pour calculer les KPI d'un run donné (utilisé
// pour le run précédent, afin de calculer un delta réel — jamais un delta
// inventé). Requête légère : pas de select('*'), pas de thèmes/concurrents.
async function computeKpisForRun(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  runId: string,
): Promise<HomeKpis> {
  const { data: observations } = await supabase
    .from('observations')
    .select('id, brand_mentioned, brand_recommended, brand_position')
    .eq('run_id', runId)

  if (!observations || observations.length === 0) {
    return {
      mentionsPct: null,
      recommendationsPct: null,
      avgPosition: null,
      competitivePresencePct: null,
      observationsCount: 0,
    }
  }

  const observationIds = observations.map((o) => o.id)
  const { data: obsCompetitors } = await supabase
    .from('observation_competitors')
    .select('observation_id')
    .in('observation_id', observationIds)
    .eq('mentioned', true)

  const observationsWithCompetitor = new Set((obsCompetitors ?? []).map((oc) => oc.observation_id))
  return computeKpisFromData(observations, observationsWithCompetitor)
}

// Delta réel entre deux mesures de KPI — null (pas de badge) si l'une des
// deux valeurs manque, jamais 0 inventé.
export function computeKpiTrends(current: HomeKpis, previous: HomeKpis | null): KpiTrends | null {
  if (!previous || previous.observationsCount === 0) return null

  const delta = (a: number | null, b: number | null) => (a !== null && b !== null ? a - b : null)

  return {
    mentionsTrend: delta(current.mentionsPct, previous.mentionsPct),
    recommendationsTrend: delta(current.recommendationsPct, previous.recommendationsPct),
    avgPositionTrend:
      current.avgPosition !== null && previous.avgPosition !== null
        ? Math.round((current.avgPosition - previous.avgPosition) * 10) / 10
        : null,
    competitivePresenceTrend: delta(current.competitivePresencePct, previous.competitivePresencePct),
  }
}

// Génère l'"Insight IA" de façon déterministe (aucun appel IA, coût nul) à
// partir des données déjà calculées dans le loader. Ne mentionne jamais un
// moteur non mesuré, ni un chiffre sans donnée source correspondante.
export function buildDashboardInsight(
  displayRun: { score_delta: number | null } | null,
  brandName: string,
  enginePerformance: { engine: string; mentioned: number; recommended: number; total: number }[],
  topThemes: { text: string; count: number }[],
  topCompetitors: CompetitorMini[],
  shareOfVoice: { name: string; mentions: number }[],
): DashboardInsight | null {
  if (!displayRun) return null

  let headline: string
  if (displayRun.score_delta === null) {
    headline = 'Première mesure enregistrée — revenez après la prochaine pour voir votre évolution.'
  } else if (displayRun.score_delta >= 0) {
    headline = `Bonne progression : votre score a gagné ${displayRun.score_delta} pt${displayRun.score_delta > 1 ? 's' : ''} depuis la dernière mesure.`
  } else {
    headline = `Votre score a reculé de ${Math.abs(displayRun.score_delta)} pt${Math.abs(displayRun.score_delta) > 1 ? 's' : ''} depuis la dernière mesure.`
  }

  const bullets: string[] = []

  // Uniquement les moteurs réellement mesurés pour ce plan.
  for (const ep of enginePerformance) {
    if (ep.total === 0) continue
    const pct = Math.round((ep.mentioned / ep.total) * 100)
    bullets.push(`${getEngineLabel(ep.engine)} vous cite dans ${pct}% des réponses mesurées.`)
  }

  if (topThemes.length > 0) {
    bullets.push(`Meilleure performance sur le thème « ${topThemes[0].text} ».`)
  }

  const topCompetitor = topCompetitors[0]
  if (topCompetitor) {
    const brandEntry = shareOfVoice.find((s) => s.name === brandName)
    if (brandEntry) {
      if (brandEntry.mentions > topCompetitor.mentions) {
        bullets.push(`Vous êtes mentionné plus souvent que ${topCompetitor.name}, votre concurrent le plus cité.`)
      } else if (brandEntry.mentions < topCompetitor.mentions) {
        bullets.push(`${topCompetitor.name} est actuellement mentionné plus souvent que vous.`)
      }
    }
  }

  return { headline, bullets: bullets.slice(0, 3) }
}

async function computeLatestRunInsights(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  brandId: string,
  brandName: string,
  latestRun: { id: string; status: string } | null,
  opts: { isFree?: boolean } = {},
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
    totalCompetitorsCount: 0,
    shareOfVoice: [] as { name: string; mentions: number }[],
    enginePerformance: [] as { engine: string; mentioned: number; recommended: number; total: number }[],
    sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
    topThemes: [] as { text: string; count: number }[],
    actualStatus: null as string | null
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
  const sortedCompetitors = [...competitorMentions.entries()]
    .filter(([id]) => competitorById.has(id))
    .sort((a, b) => b[1] - a[1])
  const totalCompetitorsCount = sortedCompetitors.length
  const visibleLimit = opts.isFree ? FREE_MAX_COMPETITORS_VISIBLE : 3
  const topCompetitors: CompetitorMini[] = sortedCompetitors
    .slice(0, visibleLimit)
    .map(([id, mentions]) => ({ id, name: competitorById.get(id)!, mentions }))

  // Pas de `.slice(0, 5)` ici : QuestionsTable pagine côté client sur
  // l'ensemble des questions, il lui faut donc la liste complète.
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

  const kpis: HomeKpis = computeKpisFromData(observations, observationsWithCompetitor)

  // Retroactive fix for runs that were marked as success despite having null raw_answers
  const successCount = observations.filter(o => o.raw_answer !== null).length
  const actualStatus = latestRun.status === 'success' && successCount < (questions ?? []).length ? 'partial' : latestRun.status

  // --- New Rich Charts Data ---

  // 1. Share of Voice (Brand vs Top Competitors)
  const shareOfVoice = [
    { name: brandName, mentions: mentionedCount },
    ...topCompetitors.map(c => ({ name: c.name, mentions: c.mentions }))
  ];

  // 2. Engine Performance
  const engines = Array.from(new Set(observations.map(o => o.engine).filter(Boolean)));
  const enginePerformance = engines.map(engine => {
    const obs = observations.filter(o => o.engine === engine);
    return {
      engine,
      mentioned: obs.filter(o => o.brand_mentioned).length,
      recommended: obs.filter(o => o.brand_recommended).length,
      total: obs.length
    };
  });

  // Aucune injection de moteurs fictifs ici : si un moteur (chatgpt,
  // perplexity, copilot, gemini...) n'a pas encore de mesure réelle dans
  // `observations`, il n'apparaît simplement pas dans enginePerformance.
  // EngineRadarChart gère déjà l'état vide ("Aucune donnée par moteur pour
  // la dernière mesure.") — jamais de chiffre inventé (cf. en-tête de fichier).

  // 3. Sentiment Distribution
  const sentimentDistribution = {
    positive: recommendedCount,
    neutral: mentionedCount - recommendedCount,
    negative: total - mentionedCount
  };

  // 4. Thèmes abordés — comptage réel sur la colonne `observations.themes`,
  // extraite par l'IA (analyzeAnswer, même appel que brand_mentioned/competitors,
  // aucun coût supplémentaire). Les observations mesurées avant ce chantier
  // ont un tableau vide et ne contribuent simplement à rien ici.
  const themeCounts = new Map<string, number>();
  observations.forEach(o => {
    (o.themes ?? []).forEach((t: string) => {
      themeCounts.set(t, (themeCounts.get(t) || 0) + 1);
    });
  });
  const topThemes = Array.from(themeCounts.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { 
    kpis, 
    questionsPerf, 
    topCompetitors, 
    totalCompetitorsCount, 
    actualStatus,
    shareOfVoice,
    enginePerformance,
    sentimentDistribution,
    topThemes
  }
}

export const fetchDashboardHome = createServerFn({ method: 'GET' }).handler(async (): Promise<any> => {
  const supabase = getSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { brand: null } as const

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('owner_id', auth.user.id)
    .limit(1)
    .maybeSingle()

  if (!brand) return { brand: null } as const

  const [{ data: runs }, { data: opportunities }, { data: events }, { data: pages }] =
    await Promise.all([
      supabase
        .from('measurement_runs')
        .select('*')
        .eq('brand_id', brand.id)
        .order('started_at', { ascending: false })
        .limit(3),
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

  // latestRun sert pour l'état du bouton "Mesurer" et la date "Dernière mesure"
  let latestRun = runs?.[0] ?? null
  
  // dataRun sert à afficher les données (ne pas afficher de vide si la dernière a planté)
  const validRuns = runs?.filter(r => r.status === 'success' || r.status === 'partial') || []
  let dataRun = validRuns[0] ?? null
  const previousRun = validRuns[1] ?? null

  const { 
    kpis, 
    questionsPerf, 
    topCompetitors, 
    totalCompetitorsCount, 
    actualStatus,
    shareOfVoice,
    enginePerformance,
    sentimentDistribution,
    topThemes
  } = await computeLatestRunInsights(
    supabase,
    brand.id,
    brand.name,
    dataRun,
    { isFree: isFreePlan(brand.plan) },
  )

  if (latestRun && actualStatus && latestRun.id === dataRun?.id && latestRun.status !== actualStatus) {
    latestRun = { ...latestRun, status: actualStatus }
  }
  if (dataRun && actualStatus && dataRun.status !== actualStatus) {
    dataRun = { ...dataRun, status: actualStatus }
  }

  // Plan Free uniquement : expose le compteur hebdo et le slot bonus pour
  // le bouton "Mesurer" (HeaderMeasureButton) et la bannière Free du dashboard.
  // freeMeasurementsThisWeek : runs validés dans la fenêtre glissante de 7 jours.
  // freeRemeasureBonus       : un changement de site non consommé débloque un slot
  //                            supplémentaire au-delà du quota (élément #12).
  let freeMeasurementsThisWeek = 0
  let freeRemeasureBonus = false

  if (isFreePlan(brand.plan)) {
    const windowStart = new Date(
      Date.now() - FREE_MEASUREMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString()

    const { count: weekCount } = await supabase
      .from('measurement_runs')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
      .or('status.eq.success,status.eq.partial')
      .gte('completed_at', windowStart)

    freeMeasurementsThisWeek = weekCount ?? 0

    // Vérifier le slot bonus (changement de site) indépendamment du quota
    if (dataRun) {
      const unlock = await getFreeRemeasureUnlock(supabase, brand.id, dataRun.completed_at)
      freeRemeasureBonus = unlock.available
    }
  }

  // Tendance réelle des 4 KPI vs le run success/partial précédent — jamais
  // de delta inventé : null (pas de badge) tant qu'il n'y a qu'un seul run.
  const previousKpis = previousRun ? await computeKpisForRun(supabase, previousRun.id) : null
  const kpiTrends = computeKpiTrends(kpis, previousKpis)

  // Insight IA déterministe (coût nul), à partir des données déjà calculées
  // ci-dessus — jamais de texte ou de chiffre inventé.
  const aiInsight = buildDashboardInsight(
    dataRun,
    brand.name,
    enginePerformance,
    topThemes,
    topCompetitors,
    shareOfVoice,
  )

  return {
    brand,
    latestRun,
    freeMeasurementsThisWeek,
    freeMeasurementsPerWeek: FREE_MEASUREMENTS_PER_WEEK,
    freeRemeasureBonus,
    displayRun: dataRun,
    previousRun,
    opportunities: opportunities ?? [],
    events: events ?? [],
    pages: pages ?? [],
    kpis,
    kpiTrends,
    aiInsight,
    questionsPerf,
    topCompetitors,
    totalCompetitorsCount,
    shareOfVoice,
    enginePerformance,
    sentimentDistribution,
    topThemes,
  } as const
})

