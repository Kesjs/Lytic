import { describe, expect, it } from 'vitest'
import { computeDiff } from '~/lib/crawler/diff'
import type { ExtractedContent } from '~/lib/crawler/extract'

describe('computeDiff', () => {
  const filledContent: ExtractedContent = {
    title: 'abc',
    meta: 'def',
    headings: ['ghi'],
    body: 'jkl',
    pricing: ['mno'],
    cta: ['pqr'],
    links: ['stu'],
    structure: ['vwx'],
  }

  it('baseline (oldContent === null) → pas de changement détecté par la fonction diff', () => {
    // Si la page vient d'être créée, oldContent est null. 
    // L'orchestrateur s'occupe d'insérer un éventement "baseline" manuellement.
    const res = computeDiff(null, filledContent)
    expect(res.hasChanged).toBe(false)
    expect(res.changedFields).toEqual([])
  })

  it('contenus identiques → hasChanged=false', () => {
    // Une copie exacte pour s'assurer qu'on ne compare pas juste par référence
    const sameContent = JSON.parse(JSON.stringify(filledContent))
    const res = computeDiff(filledContent, sameContent)
    expect(res.hasChanged).toBe(false)
    expect(res.changedFields).toEqual([])
  })

  it('un seul champ différent → changedFields contient uniquement ce champ', () => {
    const newContent: ExtractedContent = { ...filledContent, title: 'CHANGED' }
    const res = computeDiff(filledContent, newContent)

    expect(res.hasChanged).toBe(true)
    expect(res.changedFields).toEqual(['title'])
  })

  it('plusieurs champs différents → détectés correctement', () => {
    const newContent: ExtractedContent = { 
      ...filledContent, 
      pricing: ['mno', 'changed'],
      body: 'jkl modified',
    }
    const res = computeDiff(filledContent, newContent)

    expect(res.hasChanged).toBe(true)
    expect(res.changedFields).toContain('pricing')
    expect(res.changedFields).toContain('body')
    expect(res.changedFields.length).toBe(2)
  })
})
