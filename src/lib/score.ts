// Score déterministe (§20.1 du doc de conception).
// Formule par question puis score global 0–100 — en code, jamais via IA.
//
// Plan de calibration : une fois les premières données réelles disponibles,
// revoir les pondérations (mention/reco/position) en comparant les scores
// calculés à des évaluations manuelles réelles sur 5–10 questions.
// Pas de validation empirique encore intégrée au code.

export interface QuestionObservation {
  brand_mentioned: boolean
  brand_recommended: boolean
  /** Rang de la marque dans la réponse (1 = premier mentionné). null si non mentionnée. */
  brand_position: number | null
}

/**
 * Score pour une question individuelle, sur 100.
 *
 * Pondération :
 *   - Mention        : 40 pts
 *   - Recommandation : 40 pts
 *   - Position 1–3   : 20 pts / Position 4–5 : 10 pts / >5 ou null : 0 pt
 *
 * Le score est 0 si la marque n'est pas mentionnée, même si position renseignée
 * (cas impossible en pratique, mais garde-fou défensif).
 */
export function computeQuestionScore(obs: QuestionObservation): number {
  if (!obs.brand_mentioned) return 0

  let score = 40 // mention

  if (obs.brand_recommended) score += 40

  if (obs.brand_position !== null) {
    if (obs.brand_position <= 3) score += 20
    else if (obs.brand_position <= 5) score += 10
  }

  return score
}

/**
 * Score global d'un run, 0–100, arrondi à l'entier.
 * Moyenne des scores individuels. Retourne 0 si aucune observation.
 */
export function computeRunScore(observations: QuestionObservation[]): number {
  if (observations.length === 0) return 0
  const total = observations.reduce((sum, obs) => sum + computeQuestionScore(obs), 0)
  return Math.round(total / observations.length)
}
