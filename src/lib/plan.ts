import { MAX_TRACKED_QUESTIONS } from '~/lib/utils'

// Limites par plan, centralisées ici pour ne pas les disperser dans chaque
// fichier (reflet-plan-free-spec.md §0). PRO_* référencent les constantes
// déjà existantes plutôt que de les dupliquer avec une autre valeur.

export const FREE_MAX_QUESTIONS = 1
export const FREE_SAMPLES_PER_QUESTION = 1 // vs PRO_SAMPLES_PER_QUESTION (measure.ts)

// Quota de mesures Free : 3 par période de 7 jours glissants, à vie récurrent.
// Décision produit #7 — remplace l'ancien FREE_MAX_MEASUREMENTS = 1 (one-shot).
// Fenêtre glissante : on compte les runs 'success'|'partial' des 7 derniers jours.
export const FREE_MEASUREMENTS_PER_WEEK = 3
export const FREE_MEASUREMENT_WINDOW_DAYS = 7

// Un changement de site significatif (importance != 'low') débloque un slot
// BONUS au-delà du quota hebdomadaire — slot additif, pas remplaçant (#12).
// Voir getFreeRemeasureUnlock dans reliability.ts.

export const FREE_MAX_COMPETITORS_VISIBLE = 2 // décision #8 : 1 → 2

export const PRO_MAX_QUESTIONS = MAX_TRACKED_QUESTIONS // déjà existant dans utils.ts
export const PRO_SAMPLES_PER_QUESTION = 3 // déjà existant dans measure.ts

// Délai entre deux mesures manuelles pour un plan payant (measure.ts).
// Centralisé ici pour que l'affichage du bouton (HeaderMeasureButton) ne
// puisse plus diverger de la valeur réellement appliquée côté serveur.
export const MEASUREMENT_DELAY_DAYS = 1

// Cooldown entre deux scans manuels de site ("Vérifier mon site") pour le
// plan Free uniquement — refonte Free §5. Les plans payants ne sont pas
// soumis à ce délai (monitoring quotidien adaptatif déjà en place).
export const FREE_SITE_SCAN_COOLDOWN_DAYS = 1

export type BrandPlan = 'trial' | 'active' | 'past_due' | 'canceled' | 'free'

export function isFreePlan(plan: string | null | undefined): boolean {
  return plan === 'free'
}

// Multi-moteur (ajout Perplexity) — répartition du budget d'échantillons
// EXISTANT entre moteurs, plutôt que d'ajouter des appels en plus.
// FREE_SAMPLES_PER_QUESTION / PRO_SAMPLES_PER_QUESTION ci-dessus restent la
// source de vérité pour l'affichage ; measure.ts dérive le nombre réel
// d'appels de la longueur de ce mix (mix.length === SAMPLES_PER_QUESTION
// correspondant), donc les deux ne peuvent pas diverger silencieusement —
// voir la vérification dans measure.ts au chargement du module.
export type MeasurementEngine = 'openai' | 'perplexity'

// Free reste 100% ChatGPT : c'est déjà l'aperçu gratuit le moins cher
// (1 seul appel), pas de raison d'y ajouter un deuxième provider.
export const FREE_ENGINE_MIX: MeasurementEngine[] = ['openai']

// Pro : 2 échantillons ChatGPT + 1 Perplexity au lieu de 3 ChatGPT.
// Coût neutre (même nombre total d'appels qu'avant), et le score/dashboard
// affichent désormais un vrai signal cross-IA au lieu d'un seul moteur.
export const PRO_ENGINE_MIX: MeasurementEngine[] = ['openai', 'openai', 'perplexity']

export function getEngineMix(plan: string | null | undefined): MeasurementEngine[] {
  return isFreePlan(plan) ? FREE_ENGINE_MIX : PRO_ENGINE_MIX
}

// Statuts de marque exclus de tout traitement automatique (cron) — abonnement
// en échec de paiement ou résilié. Aucun crawl ni appel LLM automatique ne
// doit être déclenché pour ces marques (plan automatisation §4.1).
const CRON_EXCLUDED_PLANS: readonly BrandPlan[] = ['past_due', 'canceled']

export function isBrandEligibleForCron(plan: string | null | undefined): boolean {
  return !!plan && !CRON_EXCLUDED_PLANS.includes(plan as BrandPlan)
}
