import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient, getSupabaseAdminClient } from '~/lib/supabase/server'
import { calculateCost } from '~/lib/openai-pricing'
import { generateActionableContent, type ActionableContent, type SiteContent } from '~/lib/actionable-content'
import { isFreePlan } from '~/lib/plan'

// Server function pour le panel "contenu actionnable" (Palier 0).
//
// Corrige un bug où ActionableContentPanel.tsx (composant CLIENT) importait
// directement generateActionableContent, qui appelle l'API OpenAI avec une
// clé lue côté serveur (process.env) — inutilisable dans le navigateur, donc
// le contenu IA n'était en réalité jamais généré (silent fallback générique).
//
// Ajoute aussi un cache en base (opportunity_actionable_content) : un seul
// appel IA par opportunité tant que le contenu du site n'a pas changé,
// au lieu d'un appel à chaque affichage/remontage du panel.

/** Empreinte simple du site_content utilisé — sert à détecter un site changé
 *  et invalider le cache, sans stocker de hash cryptographique inutile ici. */
function hashSiteContent(siteContent: SiteContent | null): string {
  if (!siteContent) return 'none'
  return JSON.stringify({
    t: siteContent.title ?? '',
    m: siteContent.metaDescription ?? '',
    h1: siteContent.h1 ?? '',
    // Les 500 premiers caractères suffisent : c'est aussi ce que les prompts utilisent.
    b: (siteContent.bodyText ?? '').slice(0, 500),
  })
}

interface GetActionableContentInput {
  opportunityId: string
  opportunity: {
    title: string
    reason: string
    proposed_direction?: string | null
    website_url?: string | null
  }
  siteContent: SiteContent | null
}

export const getActionableContentForOpportunity = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (
      typeof data !== 'object' ||
      data === null ||
      typeof (data as Record<string, unknown>).opportunityId !== 'string'
    ) {
      throw new Error('opportunityId manquant')
    }
    return data as GetActionableContentInput
  })
  .handler(async ({ data }): Promise<ActionableContent | null> => {
    const { opportunityId, opportunity, siteContent } = data

    const userSupabase = getSupabaseServerClient()
    const adminSupabase = getSupabaseAdminClient()

    const { data: auth } = await userSupabase.auth.getUser()
    if (!auth.user) throw new Error('Non authentifié')

    // Vérifie l'appartenance : opportunité -> brand -> owner_id
    const { data: opp, error: oppError } = await adminSupabase
      .from('opportunities')
      .select('id, brand_id')
      .eq('id', opportunityId)
      .single()
    if (oppError || !opp) throw new Error('Opportunité introuvable')

    const { data: brand, error: brandError } = await adminSupabase
      .from('brands')
      .select('id, owner_id, plan')
      .eq('id', opp.brand_id)
      .single()
    if (brandError || !brand) throw new Error('Marque introuvable')
    if (brand.owner_id !== auth.user.id) throw new Error('Accès refusé')

    const plan = isFreePlan(brand.plan) ? 'free' : 'pro'
    const contentHash = hashSiteContent(siteContent)

    // 1. Cache hit : contenu déjà généré pour ce site_content -> pas de nouvel appel IA
    const { data: cached } = await (adminSupabase as any)
      .from('opportunity_actionable_content')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .maybeSingle()

    if (cached && cached.source_content_hash === contentHash) {
      return {
        type: cached.type,
        label: cached.label,
        content: cached.content,
        instructions: cached.instructions ?? undefined,
        filename: cached.filename ?? undefined,
      }
    }

    // 2. Cache miss ou site changé -> génère (appel IA seulement si plan pro + siteContent dispo)
    const { content: generated, usage } = await generateActionableContent(opportunity, siteContent, plan)
    if (!generated) return null

    // 3. Log du coût réel (0 si le fallback standard a été utilisé, ex. plan free)
    if (usage.calledModel) {
      try {
        await (adminSupabase as any).from('api_usage_log').insert({
          brand_id: brand.id,
          user_id: auth.user.id,
          call_type: 'actionable_content',
          model: 'gpt-5.6-luna',
          tokens_input: usage.inputTokens,
          tokens_output: usage.outputTokens,
          estimated_cost_usd: calculateCost('gpt-5.6-luna', usage.inputTokens, usage.outputTokens),
        })
      } catch (logErr) {
        console.warn('[getActionableContentForOpportunity] api_usage_log insert skipped:', logErr)
      }
    }

    // 4. Écrit/rafraîchit le cache (upsert sur opportunity_id, colonne UNIQUE)
    try {
      await (adminSupabase as any).from('opportunity_actionable_content').upsert(
        {
          opportunity_id: opportunityId,
          type: generated.type,
          label: generated.label,
          content: generated.content,
          instructions: generated.instructions ?? null,
          filename: generated.filename ?? null,
          plan,
          source_content_hash: contentHash,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'opportunity_id' }
      )
    } catch (cacheErr) {
      // Le cache est une optimisation, pas une dépendance critique : on sert
      // quand même le contenu généré si l'écriture échoue.
      console.warn('[getActionableContentForOpportunity] cache write skipped:', cacheErr)
    }

    return generated
  })
