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

// ─── Remesure conditionnelle Free (refonte §4) ────────────────────────────
// Un compte Free n'a plus de remesure automatique : il en débloque UNE
// lorsqu'un changement de site significatif (importance != 'low') a été
// détecté depuis sa dernière mesure ET n'a pas déjà servi à débloquer une
// remesure précédente (site_changes.linked_run_id encore vide).
// Partagé entre measure.ts (application du blocage) et dashboard.ts
// (affichage du bouton) pour ne jamais diverger sur la même règle.

export interface FreeRemeasureUnlock {
  available: boolean
  changeId: string | null
}

export async function getFreeRemeasureUnlock(
  supabase: SupabaseClient<Database>,
  brandId: string,
  sinceIso: string | null,
): Promise<FreeRemeasureUnlock> {
  // Pas de mesure précédente : c'est la toute première mesure, jamais
  // bloquée par cette règle (le blocage "une seule mesure gratuite" est
  // géré séparément, avant l'appel à cette fonction).
  if (!sinceIso) return { available: true, changeId: null }

  const { data: unusedChange } = await supabase
    .from('site_changes')
    .select('id')
    .eq('brand_id', brandId)
    .neq('importance', 'low')
    .is('linked_run_id', null)
    .gte('detected_at', sinceIso)
    .order('detected_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return { available: !!unusedChange, changeId: unusedChange?.id ?? null }
}
