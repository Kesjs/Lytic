import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { getSupabaseAdminClient } from '~/lib/supabase/server'
import type { Database } from '~/lib/supabase/database.types'

const MODEL = 'gemini-3.7-flash'

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY non définie.")
  return new GoogleGenerativeAI(apiKey)
}

interface ParsedOpportunity {
  title: string
  priority: 'low' | 'medium' | 'high'
  confidence: number
  reason: string
  proposed_direction: string
}

const OPPORTUNITY_SCHEMA = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING, description: 'Titre court et actionnable de l\'opportunité' },
      priority: { type: SchemaType.STRING, enum: ['low', 'medium', 'high'] },
      confidence: { type: SchemaType.NUMBER, description: 'Score de confiance de 0 à 100' },
      reason: { type: SchemaType.STRING, description: 'Pourquoi cette opportunité est importante, avec des preuves basées sur la réponse IA' },
      proposed_direction: { type: SchemaType.STRING, description: 'Que faut-il faire sur le site web pour saisir cette opportunité (ex: page cible, élément, action)' },
    },
    required: ['title', 'priority', 'confidence', 'reason', 'proposed_direction'],
  },
}

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

  const client = getClient()
  const model = client.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: OPPORTUNITY_SCHEMA as any,
    },
  })

  // Group observations by question to feed the LLM
  const context = obsData.map(obs => `
Question posée à l'IA : "${obs.questions?.text}"
Réponse de l'IA (où notre marque ${brand.name} n'est pas recommandée) :
"${obs.raw_answer}"
`).join('\n\n')

  const prompt = `Tu es un expert en SEO (Optimisation pour Moteurs de Recherche) spécialisé dans les IA génératives (AIO).
Ton client est la marque "${brand.name}" (Site web: ${brand.website_url || 'inconnu'}).
Nous avons posé plusieurs questions à ChatGPT et notre marque n'a pas été recommandée.

Voici le contexte des réponses :
${context}

Analyse ces réponses, identifie les concurrents recommandés et trouve POURQUOI ils sont préférés.
Propose des opportunités d'amélioration pour le site web de notre marque pour pallier ces manques.
Chaque opportunité doit être une recommandation actionnable : quelle page modifier, quel élément cibler, et la direction proposée.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const parsed = JSON.parse(text) as ParsedOpportunity[]

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
