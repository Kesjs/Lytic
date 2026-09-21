// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'
import { isFreePlan } from '~/lib/plan'

export type OpportunityStatus = 'open' | 'resolved' | 'dismissed' | 'no_longer_observed'
export type OpportunityPriority = 'low' | 'medium' | 'high'
export type EvidenceStepType =
  | 'question'
  | 'response'
  | 'observation'
  | 'competitor'
  | 'site'
  | 'gap'
  | 'recommendation'

export interface OpportunityRow {
  id: string
  title: string
  priority: OpportunityPriority
  confidence: number
  status: OpportunityStatus
  observationsCount: number
  reason: string
  currentSiteContent: string | null
  proposedDirection: string
  createdAt: string
  resolvedAt: string | null
  questions: string[]
}

export interface EvidenceStep {
  id: string
  stepOrder: number
  stepType: EvidenceStepType
  label: string
  content: string | null
}

// Plan Free : génération d'une seule opportunité teaser par IA (coût isolé sur clé Free),
// persistée en base pour ne jamais appeler le LLM plus d'une fois.
export interface FreeInsight {
  questionText: string
  notRecommended: true
  title?: string
  priority?: OpportunityPriority
  reason?: string
  proposedDirection?: string
}

const priorityWeight: Record<OpportunityPriority, number> = { high: 0, medium: 1, low: 2 }

// Liste des opportunités de la marque, questions concernées incluses.
// La chaîne de preuves (opportunity_evidence) n'est PAS chargée ici : elle
// est récupérée à la demande via fetchOpportunityEvidence, au clic sur une
// carte, pour éviter une requête lourde si la liste est longue.
export const fetchOpportunities = createServerFn({ method: 'GET' }).handler(async (): Promise<any> => {
  const supabase = getSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { brand: null } as const

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('owner_id', auth.user.id)
    .maybeSingle()

  if (!brand) return { brand: null } as const

  if (isFreePlan(brand.plan)) {
    // 1. Vérifier si une opportunité teaser a déjà été générée et enregistrée pour cette marque
    const { data: existingOpps } = await supabase
      .from('opportunities')
      .select('*')
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (existingOpps && existingOpps.length > 0) {
      const opp = existingOpps[0]
      const { data: link } = await supabase
        .from('opportunity_questions')
        .select('question_id')
        .eq('opportunity_id', opp.id)
        .limit(1)
        .maybeSingle()

      let qText = ''
      if (link?.question_id) {
        const { data: q } = await supabase
          .from('questions')
          .select('text')
          .eq('id', link.question_id)
          .maybeSingle()
        qText = q?.text ?? ''
      }

      const freeInsight: FreeInsight = {
        questionText: qText,
        notRecommended: true,
        title: opp.title,
        priority: opp.priority,
        reason: opp.reason,
        proposedDirection: opp.proposed_direction,
      }
      return { brand, opportunities: [] as OpportunityRow[], freeInsight } as const
    }

    // 2. Pas encore d'opportunité enregistrée. Vérifie la dernière mesure terminée.
    const { data: latestRun } = await supabase
      .from('measurement_runs')
      .select('id')
      .eq('brand_id', brand.id)
      .or('status.eq.success,status.eq.partial')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!latestRun) {
      // Jamais mesuré — pas d'insight possible.
      return { brand, opportunities: [] as OpportunityRow[], freeInsight: null, freeWellRecommended: false } as const
    }

    const { data: notRecommended } = await supabase
      .from('observations')
      .select('id, question_id, raw_answer')
      .eq('run_id', latestRun.id)
      .eq('brand_recommended', false)
      .limit(1)
      .maybeSingle()

    if (!notRecommended) {
      // Marque bien recommandée sur son unique question — bon signal !
      // freeWellRecommended: true permet à l'UI d'afficher un message
      // honnête de félicitations plutôt que "Opportunités indisponibles" (#4).
      return { brand, opportunities: [] as OpportunityRow[], freeInsight: null, freeWellRecommended: true } as const
    }

    const { data: question } = await supabase
      .from('questions')
      .select('text')
      .eq('id', notRecommended.question_id)
      .maybeSingle()

    const questionText = question?.text ?? ''

    // 3. Génération d'une opportunité teaser unique (coût isolé sur clé Free)
    try {
      const { generateOpportunities } = await import('~/lib/analysis')
      const { calculateCost } = await import('~/lib/openai-pricing')
      const { getSupabaseAdminClient } = await import('~/lib/supabase/server')

      const context = `Question posée à l'IA : "${questionText}"
Réponse de l'IA (où notre marque ${brand.name} n'est pas recommandée) :
"${notRecommended.raw_answer ?? ''}"`

      const { opportunities: parsed, usage, model: actualModel } = await generateOpportunities(
        context,
        brand.name,
        brand.website_url || 'inconnu',
        'free',
      )

      const adminSupabase = getSupabaseAdminClient()

      if (usage.inputTokens > 0 || usage.outputTokens > 0) {
        try {
          await (adminSupabase as any).from('api_usage_log').insert({
            brand_id: brand.id,
            user_id: auth.user.id,
            call_type: 'opportunity_generation',
            model: actualModel,
            tokens_input: usage.inputTokens,
            tokens_output: usage.outputTokens,
            estimated_cost_usd: calculateCost(actualModel, usage.inputTokens, usage.outputTokens),
          })
        } catch (logErr) {
          console.warn('[fetchOpportunities] api_usage_log insert skipped:', logErr)
        }
      }

      if (parsed && parsed.length > 0) {
        const firstOpp = parsed[0]
        const { data: insertedOpp } = await (adminSupabase as any)
          .from('opportunities')
          .insert({
            brand_id: brand.id,
            title: firstOpp.title,
            priority: firstOpp.priority,
            confidence: firstOpp.confidence / 100,
            status: 'open',
            observations_count: 1,
            reason: firstOpp.reason,
            proposed_direction: firstOpp.proposed_direction,
          })
          .select('id, title, priority, reason, proposed_direction')
          .maybeSingle()

        if (insertedOpp) {
          await (adminSupabase as any).from('opportunity_questions').insert({
            opportunity_id: insertedOpp.id,
            question_id: notRecommended.question_id,
          })

          const freeInsight: FreeInsight = {
            questionText,
            notRecommended: true,
            title: insertedOpp.title,
            priority: insertedOpp.priority,
            reason: insertedOpp.reason,
            proposedDirection: insertedOpp.proposed_direction,
          }
          return { brand, opportunities: [] as OpportunityRow[], freeInsight } as const
        }
      }
    } catch (err) {
      console.error('[fetchOpportunities] Erreur lors de la génération de teaser opportunité Free:', err)
    }

    const freeInsight: FreeInsight = { questionText, notRecommended: true }
    return { brand, opportunities: [] as OpportunityRow[], freeInsight } as const
  }

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('*')
    .eq('brand_id', brand.id)

  if (!opportunities || opportunities.length === 0) {
    return { brand, opportunities: [] as OpportunityRow[], freeInsight: null } as const
  }

  const opportunityIds = opportunities.map((o) => o.id)
  const { data: links } = await supabase
    .from('opportunity_questions')
    .select('opportunity_id, question_id')
    .in('opportunity_id', opportunityIds)

  const questionIds = [...new Set((links ?? []).map((l) => l.question_id))]
  const { data: questions } = questionIds.length
    ? await supabase.from('questions').select('id, text').in('id', questionIds)
    : { data: [] }

  const questionTextById = new Map((questions ?? []).map((q) => [q.id, q.text]))
  const questionIdsByOpportunity = new Map<string, string[]>()
  for (const link of links ?? []) {
    const list = questionIdsByOpportunity.get(link.opportunity_id) ?? []
    list.push(link.question_id)
    questionIdsByOpportunity.set(link.opportunity_id, list)
  }

  const rows: OpportunityRow[] = opportunities
    .map((o) => ({
      id: o.id,
      title: o.title,
      priority: o.priority,
      confidence: o.confidence,
      status: o.status,
      observationsCount: o.observations_count,
      reason: o.reason,
      currentSiteContent: o.current_site_content,
      proposedDirection: o.proposed_direction,
      createdAt: o.created_at,
      resolvedAt: o.resolved_at,
      questions: (questionIdsByOpportunity.get(o.id) ?? [])
        .map((qId) => questionTextById.get(qId))
        .filter((t): t is string => !!t),
    }))
    .sort((a, b) => {
      const byPriority = priorityWeight[a.priority] - priorityWeight[b.priority]
      if (byPriority !== 0) return byPriority
      return b.confidence - a.confidence
    })

  return { brand, opportunities: rows, freeInsight: null } as const
})

// Chaîne de preuves d'une opportunité, chargée à la demande au clic sur
// une carte : Question → Réponse observée → Observation → Concurrent →
// Site → Écart → Recommandation.
export const fetchOpportunityEvidence = createServerFn({ method: 'GET' })
  .validator((opportunityId: string) => opportunityId)
  .handler(async ({ data: opportunityId }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) throw new Error('Non authentifié')

    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('id, brand_id')
      .eq('id', opportunityId)
      .maybeSingle()
    if (!opportunity) throw new Error('Opportunité introuvable')

    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('id', opportunity.brand_id)
      .eq('owner_id', auth.user.id)
      .maybeSingle()
    if (!brand) throw new Error('Opportunité introuvable')

    const { data: steps } = await supabase
      .from('opportunity_evidence')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('step_order', { ascending: true })

    const evidence: EvidenceStep[] = (steps ?? []).map((s) => ({
      id: s.id,
      stepOrder: s.step_order,
      stepType: s.step_type,
      label: s.label,
      content: s.content,
    }))

    return { evidence } as const
  })

// Change le statut d'une opportunité (résolue / ignorée / réouverte).
// Jamais de suppression : le statut reste visible dans l'historique des états.
export const updateOpportunityStatus = createServerFn({ method: 'POST' })
  .validator((input: { opportunityId: string; status: OpportunityStatus }) => input)
  .handler(async ({ data: { opportunityId, status } }) => {
    const supabase = getSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) throw new Error('Non authentifié')

    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('id, brand_id')
      .eq('id', opportunityId)
      .maybeSingle()
    if (!opportunity) throw new Error('Opportunité introuvable')

    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('id', opportunity.brand_id)
      .eq('owner_id', auth.user.id)
      .maybeSingle()
    if (!brand) throw new Error('Opportunité introuvable')

    const { error } = await supabase
      .from('opportunities')
      .update({
        status,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
      })
      .eq('id', opportunityId)

    if (error) throw new Error(error.message)
    return { success: true } as const
  })
