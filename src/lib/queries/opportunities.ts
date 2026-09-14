// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'

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

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('*')
    .eq('brand_id', brand.id)

  if (!opportunities || opportunities.length === 0) {
    return { brand, opportunities: [] as OpportunityRow[] } as const
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

  return { brand, opportunities: rows } as const
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
