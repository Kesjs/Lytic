// Agrégation de N échantillons IA indépendants pour une même question (§3.2/3.3
// du doc de refonte "Evidence Engine v2"). Isole la logique de vote/médiane du
// pipeline de mesure pour qu'elle reste testable indépendamment.
//
// Principe : une IA générative n'est pas déterministe — interroger 3 fois la
// même question peut donner 3 réponses différentes. On ne considère une
// observation "confirmée" qu'après agrégation de plusieurs échantillons,
// jamais sur un seul appel.

export interface RawSample {
  brand_mentioned: boolean
  brand_recommended: boolean
  brand_position: number | null
}

export interface AggregatedObservation {
  brand_mentioned: boolean
  brand_recommended: boolean
  brand_position: number | null
  /** Proportion d'échantillons d'accord avec la conclusion majoritaire (0–1). */
  agreement_score: number
  samples_count: number
}

/** Médiane d'une liste de nombres. Retourne null si la liste est vide. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

/**
 * Agrège N échantillons bruts en une observation unique par vote majoritaire.
 * - brand_mentioned / brand_recommended : majorité simple (>= moitié des échantillons)
 * - brand_position : médiane des positions renseignées (ignore les null)
 * - agreement_score : force du consensus sur brand_mentioned, la donnée la plus
 *   structurante (0.5 = échantillons également partagés, 1 = accord total)
 */
export function aggregateSamples(samples: RawSample[]): AggregatedObservation {
  const n = samples.length
  if (n === 0) {
    return { brand_mentioned: false, brand_recommended: false, brand_position: null, agreement_score: 0, samples_count: 0 }
  }

  const mentionedVotes = samples.filter((s) => s.brand_mentioned).length
  const recommendedVotes = samples.filter((s) => s.brand_recommended).length

  const brand_mentioned = mentionedVotes >= Math.ceil(n / 2)
  const brand_recommended = recommendedVotes >= Math.ceil(n / 2)

  const positions = samples.map((s) => s.brand_position).filter((p): p is number => p !== null)
  const brand_position = brand_mentioned ? median(positions) : null

  const agreement_score = Math.max(mentionedVotes, n - mentionedVotes) / n

  return { brand_mentioned, brand_recommended, brand_position, agreement_score, samples_count: n }
}
