import { getSupabaseAdminClient } from '~/lib/supabase/server'
import type { Database } from '~/lib/supabase/database.types'
import { generateOpportunities } from '~/lib/analysis'
import { calculateCost } from '~/lib/openai-pricing'
import { insertEvent } from '~/lib/events'

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

  // ── §8.3 de l'audit détection — fermeture automatique des opportunités
  // devenues obsolètes ──────────────────────────────────────────────────
  // Une question qui redevient recommandée avec un accord suffisant doit
  // libérer l'opportunité ouverte qui lui était associée, plutôt que de
  // laisser une carte "morte" dans la liste (et fausser le futur check de
  // déduplication ci-dessous). On ne ferme une opportunité que si TOUTES
  // ses questions liées sont redevenues recommandées — si une seule est
  // encore non recommandée, elle reste pertinente pour elle.
  try {
    const { data: recommendedNow } = await supabase
      .from('observations')
      .select('question_id')
      .eq('run_id', runId)
      .eq('brand_recommended', true)
      .gte('agreement_score', MIN_AGREEMENT)

    const recommendedQuestionIds: string[] = [
      ...new Set((recommendedNow ?? []).map((o: any) => o.question_id)),
    ]

    if (recommendedQuestionIds.length > 0) {
      const { data: links } = await supabase
        .from('opportunity_questions')
        .select('question_id, opportunity_id')
        .in('question_id', recommendedQuestionIds)

      const candidateOppIds: string[] = [
        ...new Set((links ?? []).map((l: any) => l.opportunity_id)),
      ]

      if (candidateOppIds.length > 0) {
        const { data: allLinksForCandidates } = await supabase
          .from('opportunity_questions')
          .select('opportunity_id, question_id')
          .in('opportunity_id', candidateOppIds)

        const recommendedSet = new Set(recommendedQuestionIds)
        const opportunityIdsToClose = candidateOppIds.filter((oppId: string) =>
          (allLinksForCandidates ?? [])
            .filter((l: any) => l.opportunity_id === oppId)
            .every((l: any) => recommendedSet.has(l.question_id)),
        )

        if (opportunityIdsToClose.length > 0) {
          await supabase
            .from('opportunities')
            .update({ status: 'no_longer_observed' })
            .in('id', opportunityIdsToClose)
            .eq('status', 'open')
        }
      }
    }
  } catch (closeErr) {
    console.error('[opportunities_engine] Erreur fermeture opportunités obsolètes :', closeErr)
  }

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

  // ── §8.1 — Garde-fou de déduplication ─────────────────────────────────
  // Ne pas régénérer d'opportunité pour une question qui en a déjà une
  // ouverte, même si sa non-recommandation reste stable run après run.
  // C'était le vrai bug : ce déclenchement automatique ne vérifiait jamais
  // l'existence d'une opportunité déjà ouverte avant d'en créer une
  // nouvelle, contrairement au teaser Free (fetchOpportunities) qui a
  // toujours eu cette logique.
  const stableQuestionIds = stableObservations.map((obs) => obs.question_id)
  const { data: existingLinks } = await supabase
    .from('opportunity_questions')
    .select('question_id, opportunity_id')
    .in('question_id', stableQuestionIds)

  const candidateOpportunityIds: string[] = [
    ...new Set((existingLinks ?? []).map((l: any) => l.opportunity_id)),
  ]

  let coveredQuestionIds = new Set<string>()
  if (candidateOpportunityIds.length > 0) {
    const { data: openOpps } = await supabase
      .from('opportunities')
      .select('id')
      .in('id', candidateOpportunityIds)
      .eq('status', 'open')

    const openOpportunityIds = new Set((openOpps ?? []).map((o: any) => o.id))
    coveredQuestionIds = new Set(
      (existingLinks ?? [])
        .filter((l: any) => openOpportunityIds.has(l.opportunity_id))
        .map((l: any) => l.question_id),
    )
  }

  const newStableObservations = stableObservations.filter(
    (obs) => !coveredQuestionIds.has(obs.question_id),
  )

  if (newStableObservations.length === 0) return

  const context = newStableObservations.map(obs => `
Question posée à l'IA : "${obs.questions?.text}"
Réponse de l'IA (où notre marque ${brand.name} n'est pas recommandée, confirmé sur au moins ${MIN_RUNS_STABLE} runs consécutifs) :
"${obs.raw_answer}"
`).join('\n\n')

  try {
    const { opportunities: parsed, usage, model: actualModel } = await generateOpportunities(context, brand.name, brand.website_url || 'inconnu', brand.plan as 'free' | 'pro')

    if (usage.inputTokens > 0 || usage.outputTokens > 0) {
      try {
        await supabase.from('api_usage_log').insert({
          brand_id: brandId,
          user_id: brand.owner_id,
          call_type: 'opportunity_generation',
          model: actualModel,
          tokens_input: usage.inputTokens,
          tokens_output: usage.outputTokens,
          estimated_cost_usd: calculateCost(actualModel, usage.inputTokens, usage.outputTokens),
        })
      } catch (logErr) {
        console.warn('[opportunities_engine] api_usage_log insert skipped:', logErr)
      }
    }

    for (const opp of parsed) {
      const { data: insertedOpp } = await (supabase as any)
        .from('opportunities')
        .insert({
          brand_id: brandId,
          title: opp.title,
          priority: opp.priority,
          confidence: opp.confidence / 100,
          status: 'open',
          observations_count: newStableObservations.length,
          reason: opp.reason,
          proposed_direction: opp.proposed_direction,
        })
        .select('id')
        .single()

      // Trace les questions qui justifient cette opportunité (Evidence Chain,
      // table déjà présente en base mais non exploitée avant la refonte v2)
      if (insertedOpp) {
        await (supabase as any).from('opportunity_questions').insert(
          newStableObservations.map((obs) => ({
            opportunity_id: insertedOpp.id,
            question_id: obs.question_id,
          })),
        )
      }
    }

    if (parsed.length > 0) {
      // Notifier qu'une opportunité a été générée
      await insertEvent(supabaseClient, {
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
