// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'
import type { IaBotId, BotAccess } from '../crawler/robots'

export interface BotAccessData {
  checkedAt: string
  llmsTxtFound: boolean
  bots: Record<IaBotId, BotAccess>
}

/**
 * Récupère le dernier diagnostic d'accès aux bots IA pour la marque courante.
 * Retourne null si aucun crawl n'a encore eu lieu.
 */
export const fetchBotAccess = createServerFn({ method: 'GET' }).handler(
  async (): Promise<BotAccessData | null> => {
    const supabase = getSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return null

    // 1. Trouver la marque de l'utilisateur
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('owner_id', auth.user.id)
      .maybeSingle()

    if (!brand) return null

    // 2. Récupérer le diagnostic
    const { data: access } = await supabase
      .from('brand_bot_access')
      .select('*')
      .eq('brand_id', brand.id)
      .maybeSingle()

    if (!access) return null

    return {
      checkedAt: access.checked_at,
      llmsTxtFound: access.llms_txt_found,
      bots: access.bot_rules as Record<IaBotId, BotAccess>,
    }
  },
)
