export interface Pricing {
  inputPer1M: number
  outputPer1M: number
}

// Prix en USD par million de tokens
export const OPENAI_PRICING: Record<string, Pricing> = {
  'gpt-4o-mini': {
    inputPer1M: 0.15,
    outputPer1M: 0.60,
  },
  'gpt-4o': {
    inputPer1M: 2.50,
    outputPer1M: 10.00,
  }
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  let rates = OPENAI_PRICING['gpt-4o-mini'] // fallback

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
