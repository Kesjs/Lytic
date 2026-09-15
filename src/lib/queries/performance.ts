// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'

export interface PerformanceQuestionRow {
  id: string
  text: string
  hasObservation: boolean
  mentioned: boolean
  recommended: boolean
  position: number | null
}

// Vue d'ensemble de la page Performance : rappel du score + toutes les
// questions actives avec le résultat de la dernière mesure (pas de tri/slice
// à 5 comme sur l'Accueil, c'est la page de référence complète).
export const fetchPerformanceOverview = createServerFn({ method: 'GET' }).handler(async (): Promise<any> => {
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
    .limit(3)

  const latestRun = runs?.[0] ?? null
  const validRuns = runs?.filter(r => r.status === 'success' || r.status === 'partial') || []
  let displayRun = validRuns[0] ?? null

  const { data: questions } = await supabase
    .from('questions')
    .select('id, text, active, position')
    .eq('brand_id', brand.id)
    .eq('active', true)
    .order('position', { ascending: true })

  let rows: PerformanceQuestionRow[] = (questions ?? []).map((q) => ({
    id: q.id,
    text: q.text,
    hasObservation: false,
    mentioned: false,
    recommended: false,
    position: null,
  }))

  if (displayRun && (displayRun.status === 'success' || displayRun.status === 'partial')) {
    const { data: observations } = await supabase
      .from('observations')
      .select('question_id, brand_mentioned, brand_recommended, brand_position')
      .eq('run_id', displayRun.id)

    const byQuestion = new Map((observations ?? []).map((o) => [o.question_id, o]))

    rows = rows.map((row) => {
      const obs = byQuestion.get(row.id)
      if (!obs) return row
      return {
        ...row,
        hasObservation: true,
        mentioned: obs.brand_mentioned,
        recommended: obs.brand_recommended,
        position: obs.brand_position,
      }
    })
  }

  return {
    brand,
    latestRun,
    displayRun,
    questions: rows,
  } as const
})

export interface QuestionObservationEntry {
  runId: string
  completedAt: string | null
  engine: string
  mentioned: boolean
  recommended: boolean
  position: number | null
  rawAnswer: string | null
}

export interface QuestionCompetitorEntry {
  name: string
  mentioned: boolean
  recommended: boolean
  position: number | null
  contextExcerpt: string | null
}

// Détail d'une question pour le drawer de la page Performance : historique
// des observations (toutes mesures confondues) + concurrents détectés sur
// la dernière observation. Aucune donnée simulée : listes vides si rien.
export const fetchQuestionDetail = createServerFn({ method: 'GET' })
  .validator((questionId: string) => questionId)
  .handler(async ({ data: questionId }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return null

    const { data: question } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .maybeSingle()

    if (!question) return null

    // RLS filtre déjà par owner via brand_id, mais on vérifie explicitement
    // que la question appartient bien à une marque de l'utilisateur connecté.
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('id', question.brand_id)
      .eq('owner_id', auth.user.id)
      .maybeSingle()

    if (!brand) return null

    const { data: observations } = await supabase
      .from('observations')
      .select('*, measurement_runs(completed_at)')
      .eq('question_id', questionId)
      .order('created_at', { ascending: false })
      .limit(10)

    const history: QuestionObservationEntry[] = (observations ?? []).map((o: any) => ({
      runId: o.run_id,
      completedAt: o.measurement_runs?.completed_at ?? null,
      engine: o.engine,
      mentioned: o.brand_mentioned,
      recommended: o.brand_recommended,
      position: o.brand_position,
      rawAnswer: o.raw_answer,
    }))

    let competitors: QuestionCompetitorEntry[] = []
    const latestObservation = observations?.[0] ?? null

    if (latestObservation) {
      const { data: obsCompetitors } = await supabase
        .from('observation_competitors')
        .select('*, competitors(name)')
        .eq('observation_id', latestObservation.id)

      competitors = (obsCompetitors ?? [])
        .filter((oc: any) => oc.mentioned)
        .map((oc: any) => ({
          name: oc.competitors?.name ?? 'Concurrent inconnu',
          mentioned: oc.mentioned,
          recommended: oc.recommended,
          position: oc.position,
          contextExcerpt: oc.context_excerpt,
        }))
    }

    return {
      question,
      history,
      competitors,
    } as const
  })
