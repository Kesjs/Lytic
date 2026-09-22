import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'

export interface AuditScorePoint {
  date: string
  score: number
}

// Historique du score Audit Technique IA, un point par run de crawl terminé
// où le score a pu être calculé (audit_score non nul — cf. migration
// 20260922080000). Les runs antérieurs à cette fonctionnalité n'ont pas de
// score stocké et sont donc absents de la courbe plutôt que d'afficher un
// zéro trompeur.
export const fetchAuditScoreHistory = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuditScorePoint[]> => {
    const supabase = getSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return []

    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('owner_id', auth.user.id)
      .maybeSingle()

    if (!brand) return []

    const { data: runs } = await supabase
      .from('site_crawl_runs')
      .select('audit_score, completed_at')
      .eq('brand_id', brand.id)
      .eq('status', 'completed')
      .not('audit_score', 'is', null)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true })
      .limit(100)

    return (runs ?? []).map((r: any) => ({
      date: r.completed_at as string,
      score: r.audit_score as number,
    }))
  },
)
