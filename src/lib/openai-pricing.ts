export interface Pricing {
  inputPer1M: number
  outputPer1M: number
}

// Prix en USD par million de tokens — vérifiés Sept 2026 (plan
// "Automatisation Vérifier → Remesure" §3). Remplace les anciens tarifs
// placeholder gpt-4o-mini / gpt-4o, sans rapport avec les modèles
// réellement appelés (voir src/lib/openai.ts et src/lib/analysis.ts :
// MODEL = 'gpt-5.6-luna', utilisé à la fois pour la mesure et l'analyse).
//
// 'gpt-5.6-luna-nano' est listée avant 'gpt-5.6-luna' pour que le matching
// par préfixe (startsWith) ci-dessous la reconnaisse en priorité si elle est
// un jour réintroduite comme modèle de parsing dédié — sinon elle serait
// toujours masquée par la clé 'gpt-5.6-luna' (dont elle commence par le nom).
export const OPENAI_PRICING: Record<string, Pricing> = {
  'gpt-5.6-luna-nano': {
    inputPer1M: 0.20,
    outputPer1M: 1.25,
  },
  'gpt-5.6-luna': {
    inputPer1M: 0.20,
    outputPer1M: 1.20,
  },
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  let rates = OPENAI_PRICING['gpt-5.6-luna'] // fallback

  for (const [key, value] of Object.entries(OPENAI_PRICING)) {
    if (model.startsWith(key)) {
      rates = value
      break
    }
  }

  const inputCost = (inputTokens / 1_000_000) * rates.inputPer1M
  const outputCost = (outputTokens / 1_000_000) * rates.outputPer1M

  return inputCost + outputCost
}
