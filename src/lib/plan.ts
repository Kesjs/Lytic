import { MAX_TRACKED_QUESTIONS } from '~/lib/utils'

// Limites par plan, centralisées ici pour ne pas les disperser dans chaque
// fichier (reflet-plan-free-spec.md §0). PRO_* référencent les constantes
// déjà existantes plutôt que de les dupliquer avec une autre valeur.

export const FREE_MAX_QUESTIONS = 1
export const FREE_SAMPLES_PER_QUESTION = 1 // vs PRO_SAMPLES_PER_QUESTION (measure.ts)
export const FREE_MAX_MEASUREMENTS = 1 // jamais de remesure
export const FREE_MAX_COMPETITORS_VISIBLE = 1

export const PRO_MAX_QUESTIONS = MAX_TRACKED_QUESTIONS // déjà existant dans utils.ts
export const PRO_SAMPLES_PER_QUESTION = 3 // déjà existant dans measure.ts

export type BrandPlan = 'trial' | 'active' | 'past_due' | 'canceled' | 'free'

export function isFreePlan(plan: string | null | undefined): boolean {
  return plan === 'free'
}
