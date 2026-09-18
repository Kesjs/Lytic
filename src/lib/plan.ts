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

// Délai entre deux mesures manuelles pour un plan payant (measure.ts).
// Centralisé ici pour que l'affichage du bouton (HeaderMeasureButton) ne
// puisse plus diverger de la valeur réellement appliquée côté serveur.
export const MEASUREMENT_DELAY_DAYS = 1

// Cooldown entre deux scans manuels de site ("Vérifier mon site") pour le
// plan Free uniquement — refonte Free §5. Les plans payants ne sont pas
// soumis à ce délai (monitoring quotidien adaptatif déjà en place).
export const FREE_SITE_SCAN_COOLDOWN_DAYS = 7

export type BrandPlan = 'trial' | 'active' | 'past_due' | 'canceled' | 'free'

export function isFreePlan(plan: string | null | undefined): boolean {
  return plan === 'free'
}

// Statuts de marque exclus de tout traitement automatique (cron) — abonnement
// en échec de paiement ou résilié. Aucun crawl ni appel LLM automatique ne
// doit être déclenché pour ces marques (plan automatisation §4.1).
const CRON_EXCLUDED_PLANS: readonly BrandPlan[] = ['past_due', 'canceled']

export function isBrandEligibleForCron(plan: string | null | undefined): boolean {
  return !!plan && !CRON_EXCLUDED_PLANS.includes(plan as BrandPlan)
}
