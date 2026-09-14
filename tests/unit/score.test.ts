import { describe, it, expect } from 'vitest'
import { computeQuestionScore, computeRunScore } from '~/lib/score'

describe('computeQuestionScore', () => {
  it('retourne 0 si mention=false, même avec position et recommandation', () => {
    expect(computeQuestionScore({ brand_mentioned: false, brand_recommended: true, brand_position: 1 })).toBe(0)
    expect(computeQuestionScore({ brand_mentioned: false, brand_recommended: false, brand_position: null })).toBe(0)
  })

  it('retourne 40 si mention=true, recommandé=false, position=null', () => {
    expect(computeQuestionScore({ brand_mentioned: true, brand_recommended: false, brand_position: null })).toBe(40)
  })

  it('retourne 100 si mention=true, recommandé=true, position=2', () => {
    // 40 (mention) + 40 (reco) + 20 (position ≤ 3)
    expect(computeQuestionScore({ brand_mentioned: true, brand_recommended: true, brand_position: 2 })).toBe(100)
  })

  it('retourne 90 si mention=true, recommandé=true, position=null', () => {
    // 40 + 40 + 0 = 80
    expect(computeQuestionScore({ brand_mentioned: true, brand_recommended: true, brand_position: null })).toBe(80)
  })

  it('ajoute +20 pour position 1', () => {
    expect(computeQuestionScore({ brand_mentioned: true, brand_recommended: false, brand_position: 1 })).toBe(60)
  })

  it('ajoute +20 pour position 3', () => {
    expect(computeQuestionScore({ brand_mentioned: true, brand_recommended: false, brand_position: 3 })).toBe(60)
  })

  it('ajoute +10 pour position 4', () => {
    expect(computeQuestionScore({ brand_mentioned: true, brand_recommended: false, brand_position: 4 })).toBe(50)
  })

  it('ajoute +10 pour position 5', () => {
    expect(computeQuestionScore({ brand_mentioned: true, brand_recommended: false, brand_position: 5 })).toBe(50)
  })

  it('ajoute +0 pour position 6', () => {
    expect(computeQuestionScore({ brand_mentioned: true, brand_recommended: false, brand_position: 6 })).toBe(40)
  })

  it('ajoute +0 pour position null', () => {
    expect(computeQuestionScore({ brand_mentioned: true, brand_recommended: false, brand_position: null })).toBe(40)
  })
})

describe('computeRunScore', () => {
  it('retourne 0 pour un tableau vide', () => {
    expect(computeRunScore([])).toBe(0)
  })

  it('retourne la moyenne correcte arrondie', () => {
    // (0 + 40 + 100) / 3 = 46.66... → 47
    const observations = [
      { brand_mentioned: false, brand_recommended: false, brand_position: null },
      { brand_mentioned: true, brand_recommended: false, brand_position: null },
      { brand_mentioned: true, brand_recommended: true, brand_position: 2 },
    ]
    expect(computeRunScore(observations)).toBe(47)
  })

  it('retourne 100 si toutes les observations sont parfaites', () => {
    const observations = [
      { brand_mentioned: true, brand_recommended: true, brand_position: 1 },
      { brand_mentioned: true, brand_recommended: true, brand_position: 1 },
    ]
    expect(computeRunScore(observations)).toBe(100)
  })

  it('retourne le bon score pour une seule observation', () => {
    expect(computeRunScore([{ brand_mentioned: true, brand_recommended: false, brand_position: null }])).toBe(40)
  })
})
