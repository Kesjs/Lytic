// Prix Perplexity Sonar — vérifiés Sept 2026. Contrairement à OpenAI, Sonar
// facture aussi un frais fixe PAR REQUÊTE (en plus des tokens), qui dépend
// de search_context_size (voir perplexity.ts, on utilise 'low' partout).
// Revérifier https://docs.perplexity.ai/getting-started/pricing avant de
// changer le tier ou le search_context_size, les deux affectent ce frais.
export interface PerplexityPricing {
  inputPer1M: number
  outputPer1M: number
  /** Frais fixe par requête, pour search_context_size = 'low' */
  perRequest: number
}

export const PERPLEXITY_PRICING: Record<string, PerplexityPricing> = {
  sonar: {
    inputPer1M: 1.0,
    outputPer1M: 1.0,
    perRequest: 0.005, // $5 / 1000 requêtes en contexte 'low'
  },
}

export function calculatePerplexityCost(model: string, inputTokens: number, outputTokens: number, requests: number): number {
  const rates = PERPLEXITY_PRICING[model] ?? PERPLEXITY_PRICING.sonar

  const inputCost = (inputTokens / 1_000_000) * rates.inputPer1M
  const outputCost = (outputTokens / 1_000_000) * rates.outputPer1M
  const requestCost = requests * rates.perRequest

  return inputCost + outputCost + requestCost
}
