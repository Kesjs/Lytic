import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/lib/supabase/database.types'

export interface ChangeReliabilityStatus {
  changeId: string
  detectedAt: string
  windowEndsAt: string
  runsWithinWindow: number
  runsRequired: number
  reliable: boolean
}

// 21 jours en millisecondes
export const RELIABILITY_WINDOW_MS = 21 * 24 * 60 * 60 * 1000
export const RUNS_REQUIRED = 15

export async function getChangeReliabilityStatus(
  supabase: SupabaseClient<Database>,
  brandId: string,
): Promise<ChangeReliabilityStatus | null> {
  // 1. Dernier site_changes pertinent pour cette marque (importance >= 'watch')
  const { data: latestChange } = await supabase
    .from('site_changes')
    .select()
    .eq('brand_id', brandId)
    .neq('importance', 'low')
    .order('detected_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latestChange) return null

  // 3. windowEndsAt = detected_at + FENETRE_MS
  const detectedAtDate = new Date(latestChange.detected_at)
  const windowEndsAtDate = new Date(detectedAtDate.getTime() + RELIABILITY_WINDOW_MS)
  const windowEndsAtStr = windowEndsAtDate.toISOString()

  // 4. runsWithinWindow = count(measurement_runs)
  const { count } = await supabase
    .from('measurement_runs')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brandId)
    .eq('status', 'success')
    .gte('completed_at', latestChange.detected_at)
    .lte('completed_at', windowEndsAtStr)

  const runsWithinWindow = count ?? 0

  return {
    changeId: latestChange.id,
    detectedAt: latestChange.detected_at,
    windowEndsAt: windowEndsAtStr,
    runsWithinWindow,
    runsRequired: RUNS_REQUIRED,
    reliable: runsWithinWindow >= RUNS_REQUIRED,
  }
}
