import { getSupabaseAdminClient } from '~/lib/supabase/server'
import type { Database } from '~/lib/supabase/database.types'
import { generateOpportunities } from '~/lib/analysis'

// Refonte v2 (Evidence Engine) — une opportunité n'est plus générée sur la base
// d'un seul run isolé. Deux garde-fous avant tout appel LLM de génération :
//   1. MIN_AGREEMENT  : l'observation elle-même doit reposer sur un consensus
//      suffisant entre les échantillons du run (voir aggregate.ts / measure.ts)
//   2. MIN_RUNS_STABLE : la non-recommandation doit se répéter sur au moins
//      MIN_RUNS_STABLE runs consécutifs pour la même question — un run isolé,
//      même bien confirmé en interne, ne suffit pas ("evidence first").
// Voir doc de refonte §4.
const MIN_AGREEMENT = 0.66
const MIN_RUNS_STABLE = 2

export async function generateOpportunitiesForRun(
  runId: string,
  brandId: string,
  supabaseClient: ReturnType<typeof getSupabaseAdminClient>
) {
  const supabase = supabaseClient as any

  // Récupérer la marque
  const { data: brand } = await supabase.from('brands').select('*').eq('id', brandId).single()
  if (!brand) return

  // Récupérer les observations agrégées de CE run où la marque n'est pas
  // recommandée, avec un accord suffisant entre les échantillons du run.
  // agreement_score peut être NULL pour d'anciennes observations pré-refonte
  // (1 seul échantillon) — on les exclut volontairement (pas de confiance suffisante).
  const { data: observations } = await supabase
    .from('observations')
    .select(`
      id,
      question_id,
      raw_answer,
      agreement_score,
      questions ( text )
    `)
    .eq('run_id', runId)
    .eq('brand_recommended', false)
    .gte('agreement_score', MIN_AGREEMENT)

  if (!observations || observations.length === 0) return

  const obsData = observations as any[]

  // Pour chaque question candidate, vérifie que la non-recommandation est
  // stable sur les MIN_RUNS_STABLE derniers runs (pas juste celui-ci).
  const stableObservations: typeof obsData = []
  for (const obs of obsData) {
    const { data: recentForQuestion } = await supabase
      .from('observations')
      .select('brand_recommended, agreement_score, created_at')
      .eq('question_id', obs.question_id)
      .order('created_at', { ascending: false })
      .limit(MIN_RUNS_STABLE)

    const history = (recentForQuestion ?? []) as { brand_recommended: boolean; agreement_score: number | null }[]
    const isStable =
      history.length >= MIN_RUNS_STABLE &&
      history.every((h) => h.brand_recommended === false && (h.agreement_score ?? 0) >= MIN_AGREEMENT)

    if (isStable) stableObservations.push(obs)
  }

  if (stableObservations.length === 0) return

  const context = stableObservations.map(obs => `
Question posée à l'IA : "${obs.questions?.text}"
Réponse de l'IA (où notre marque ${brand.name} n'est pas recommandée, confirmé sur au moins ${MIN_RUNS_STABLE} runs consécutifs) :
"${obs.raw_answer}"
`).join('\n\n')

  try {
    const parsed = await generateOpportunities(context, brand.name, brand.website_url || 'inconnu')

    for (const opp of parsed) {
      const { data: insertedOpp } = await (supabase as any)
        .from('opportunities')
        .insert({
          brand_id: brandId,
          title: opp.title,
          priority: opp.priority,
          confidence: opp.confidence / 100,
          status: 'open',
          observations_count: stableObservations.length,
          reason: opp.reason,
          proposed_direction: opp.proposed_direction,
        })
        .select('id')
        .single()

      // Trace les questions qui justifient cette opportunité (Evidence Chain,
      // table déjà présente en base mais non exploitée avant la refonte v2)
      if (insertedOpp) {
        await (supabase as any).from('opportunity_questions').insert(
          stableObservations.map((obs) => ({
            opportunity_id: insertedOpp.id,
            question_id: obs.question_id,
          })),
        )
      }
    }

    if (parsed.length > 0) {
      // Notifier qu'une opportunité a été générée
      await (supabase as any).from('events').insert({
        brand_id: brandId,
        type: 'info',
        title: 'Nouvelles opportunités détectées',
        message: `${parsed.length} nouvelle(s) opportunité(s) générée(s) par l'IA.`,
        source_type: 'opportunity',
        show_toast: true,
        show_notification: true,
        show_history: true,
        read: false,
      })
    }
  } catch (err) {
    console.error('[opportunities_engine] Erreur lors de la génération des opportunités', err)
  }
}
