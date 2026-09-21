// Boucle de validation causale (chantier "point 2" — 21/09/2026).
// Vérifie, en code déterministe (jamais via IA), si une opportunité résolue
// a réellement fait progresser la visibilité sur les questions liées, en
// comparant le score par question entre le dernier run avant resolved_at
// et le premier run après. Voir migration add_outcome_tracking_to_opportunities.
//
// Choix : comparaison par RUN (pas par observation isolée) pour éviter
// l'ambiguïté multi-moteur (chatgpt/perplexity) — une même question produit
// plusieurs observations par run, on les moyenne au sein d'un même run.
//
// Tant qu'aucun run n'a eu lieu après resolved_at, outcome_status reste
// pending : pas de remesure, pas de verdict.

import { computeQuestionScore, type QuestionObservation } from './score'

const IMPROVED_MAJORITY_RATIO = 0.5

interface RunRef {
  id: string
  completed_at: string
}

// Point d'entrée appelé à la fin de chaque run (measure.ts), non-bloquant.
// Recalcule l'outcome de toutes les opportunités résolues de la marque dont
// le verdict n'est pas encore tranché.
export async function computeOutcomesForBrand(brandId: string, supabaseClient: any): Promise<void> {
  const supabase = supabaseClient as any

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, resolved_at, outcome_status')
    .eq('brand_id', brandId)
    .eq('status', 'resolved')
    .or('outcome_status.is.null,outcome_status.eq.pending')

  if (!opportunities || opportunities.length === 0) return

  for (const opp of opportunities) {
    if (!opp.resolved_at) continue
    try {
      await computeOutcomeForOpportunity(opp.id, opp.resolved_at, brandId, supabase)
    } catch (err) {
      // Une opportunité en échec ne doit jamais bloquer les autres, ni le
      // run qui a déclenché ce calcul.
      console.error(`[outcome] Erreur calcul outcome pour opportunité ${opp.id}:`, err)
    }
  }
}

async function findAdjacentRun(
  brandId: string,
  resolvedAt: string,
  direction: 'before' | 'after',
  supabase: any,
): Promise<RunRef | null> {
  let query = supabase
    .from('measurement_runs')
    .select('id, completed_at')
    .eq('brand_id', brandId)
    .not('completed_at', 'is', null)
    .or('status.eq.success,status.eq.partial')

  query =
    direction === 'before'
      ? query.lt('completed_at', resolvedAt).order('completed_at', { ascending: false })
      : query.gt('completed_at', resolvedAt).order('completed_at', { ascending: true })

  const { data } = await query.limit(1).maybeSingle()
  return data ?? null
}

// Une question est "confondue" si une AUTRE opportunité, portant sur cette
// même question, a aussi été résolue dans la même fenêtre avant/après —
// impossible dans ce cas d'attribuer un delta de score à l'une plutôt qu'à
// l'autre. On exclut la question du calcul plutôt que de lui prêter un
// verdict qu'on ne peut pas justifier.
// Limite assumée et non détectable ici : un changement fait hors du flux
// d'opportunités Reflet (site modifié à la main) reste invisible.
async function isQuestionConfounded(
  questionId: string,
  opportunityId: string,
  windowStart: string,
  windowEnd: string,
  supabase: any,
): Promise<boolean> {
  const { data: links } = await supabase
    .from('opportunity_questions')
    .select('opportunity_id')
    .eq('question_id', questionId)
    .neq('opportunity_id', opportunityId)

  const otherOpportunityIds = [...new Set((links ?? []).map((l: any) => l.opportunity_id))] as string[]
  if (otherOpportunityIds.length === 0) return false

  const { data: overlapping } = await supabase
    .from('opportunities')
    .select('id')
    .in('id', otherOpportunityIds)
    .eq('status', 'resolved')
    .gte('resolved_at', windowStart)
    .lte('resolved_at', windowEnd)
    .limit(1)

  return (overlapping ?? []).length > 0
}

async function averageScoreForQuestion(
  runId: string,
  questionId: string,
  supabase: any,
): Promise<number | null> {
  const { data: observations } = await supabase
    .from('observations')
    .select('brand_mentioned, brand_recommended, brand_position')
    .eq('run_id', runId)
    .eq('question_id', questionId)

  if (!observations || observations.length === 0) return null

  const scores = (observations as QuestionObservation[]).map(computeQuestionScore)
  return scores.reduce((sum, s) => sum + s, 0) / scores.length
}

async function computeOutcomeForOpportunity(
  opportunityId: string,
  resolvedAt: string,
  brandId: string,
  supabase: any,
): Promise<void> {
  const runBefore = await findAdjacentRun(brandId, resolvedAt, 'before', supabase)
  const runAfter = await findAdjacentRun(brandId, resolvedAt, 'after', supabase)

  // Pas encore de remesure post-résolution → on ne tranche pas.
  if (!runBefore || !runAfter) return

  const { data: links } = await supabase
    .from('opportunity_questions')
    .select('question_id')
    .eq('opportunity_id', opportunityId)

  const questionIds: string[] = (links ?? []).map((l: any) => l.question_id)
  if (questionIds.length === 0) return

  let improved = 0
  let comparable = 0

  for (const questionId of questionIds) {
    const confounded = await isQuestionConfounded(
      questionId,
      opportunityId,
      runBefore.completed_at,
      runAfter.completed_at,
      supabase,
    )
    if (confounded) continue

    const [scoreBefore, scoreAfter] = await Promise.all([
      averageScoreForQuestion(runBefore.id, questionId, supabase),
      averageScoreForQuestion(runAfter.id, questionId, supabase),
    ])

    if (scoreBefore === null || scoreAfter === null) continue

    comparable++
    if (scoreAfter > scoreBefore) improved++
  }

  // Aucune question comparable (ex. run avant/après existent mais sans
  // observation sur ces questions précises, ou toutes exclues pour cause
  // de confusion avec une autre opportunité résolue) → reste pending.
  if (comparable === 0) return

  const outcomeStatus = improved / comparable >= IMPROVED_MAJORITY_RATIO && improved > 0 ? 'improved' : 'no_change'

  await supabase
    .from('opportunities')
    .update({
      outcome_status: outcomeStatus,
      outcome_computed_at: new Date().toISOString(),
      outcome_questions_improved: improved,
      outcome_questions_total: comparable,
    })
    .eq('id', opportunityId)
}
