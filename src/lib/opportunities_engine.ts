import { getSupabaseAdminClient } from '~/lib/supabase/server'
import type { Database } from '~/lib/supabase/database.types'
import { generateOpportunities } from '~/lib/analysis'

export async function generateOpportunitiesForRun(
  runId: string,
  brandId: string,
  supabaseClient: ReturnType<typeof getSupabaseAdminClient>
) {
  const supabase = supabaseClient as any

  // Récupérer la marque
  const { data: brand } = await supabase.from('brands').select('*').eq('id', brandId).single()
  if (!brand) return

  // Récupérer les observations où la marque n'est pas recommandée
  const { data: observations } = await supabase
    .from('observations')
    .select(`
      id,
      question_id,
      raw_answer,
      questions ( text )
    `)
    .eq('run_id', runId)
    .eq('brand_recommended', false)

  if (!observations || observations.length === 0) return

  const obsData = observations as any[]

  const context = obsData.map(obs => `
Question posée à l'IA : "${obs.questions?.text}"
Réponse de l'IA (où notre marque ${brand.name} n'est pas recommandée) :
"${obs.raw_answer}"
`).join('\n\n')

  try {
    const parsed = await generateOpportunities(context, brand.name, brand.website_url || 'inconnu')

    for (const opp of parsed) {
      await (supabase as any).from('opportunities').insert({
        brand_id: brandId,
        title: opp.title,
        priority: opp.priority,
        confidence: opp.confidence,
        status: 'open',
        observations_count: observations.length,
        reason: opp.reason,
        proposed_direction: opp.proposed_direction,
      })
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
