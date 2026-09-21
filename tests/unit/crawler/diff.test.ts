import { describe, expect, it } from 'vitest'
import { computeDiff, jaccardSimilarity } from '~/lib/crawler/diff'
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
    jsonLd: false,
    h1Count: 1,
    titleLength: 3,
    hasMetaDescription: true,
    schemaTypes: [],
    hasUniqueH1: true,
    metaDescriptionLength: 3,
    hasCanonical: true,
    imagesWithoutAlt: 0,
    duplicateMetaDescriptions: false,
  }

  it('baseline (oldContent === null) → pas de changement détecté par la fonction diff', () => {
    // Si la page vient d'être créée, oldContent est null.
    // L'orchestrateur s'occupe d'insérer un éventement "baseline" manuellement.
    const res = computeDiff(null, filledContent)
    expect(res.hasChanged).toBe(false)
    expect(res.changedFields).toEqual([])
    expect(res.importance).toBe('low')
  })

  it('contenus identiques → hasChanged=false', () => {
    // Une copie exacte pour s'assurer qu'on ne compare pas juste par référence
    const sameContent = JSON.parse(JSON.stringify(filledContent))
    const res = computeDiff(filledContent, sameContent)
    expect(res.hasChanged).toBe(false)
    expect(res.changedFields).toEqual([])
    expect(res.importance).toBe('low')
  })

  it('un seul champ différent (title) → changedFields contient uniquement ce champ, importance=watch', () => {
    const newContent: ExtractedContent = { ...filledContent, title: 'CHANGED' }
    const res = computeDiff(filledContent, newContent)

    expect(res.hasChanged).toBe(true)
    expect(res.changedFields).toEqual(['title'])
    expect(res.importance).toBe('watch')
  })

  it('plusieurs champs différents (pricing + body réécrit) → détectés correctement, importance=watch', () => {
    const newContent: ExtractedContent = {
      ...filledContent,
      pricing: ['mno', 'changed'],
      body: 'un tout autre paragraphe complètement différent du précédent',
    }
    const res = computeDiff(filledContent, newContent)

    expect(res.hasChanged).toBe(true)
    expect(res.changedFields).toContain('pricing')
    expect(res.changedFields).toContain('body')
    expect(res.changedFields.length).toBe(2)
    // pricing (IMMEDIATE_FIELDS) suffit à lui seul à déclencher 'watch'
    expect(res.importance).toBe('watch')
  })

  // ── §3.A / §3.D de l'audit détection — bruit vs changement réel ──────────

  it('bruit pur (structure réordonnée + widget pub inséré) → hasChanged=true mais importance=low', () => {
    const oldContent: ExtractedContent = {
      ...filledContent,
      structure: ['header', 'main', 'p', 'p', 'footer'],
      links: ['/a', '/b'],
      cta: ['En savoir plus'],
    }
    const newContent: ExtractedContent = {
      ...filledContent,
      // Un widget pub/recommandation dynamique change l'ordre et ajoute des
      // tags — c'est exactement le cas décrit dans l'audit (§2.A).
      structure: ['header', 'div', 'main', 'p', 'p', 'aside', 'footer'],
      links: ['/a', '/b', '/pub-partenaire'],
      cta: ['En savoir plus'],
    }
    const res = computeDiff(oldContent, newContent)

    expect(res.hasChanged).toBe(true)
    expect(res.changedFields).toContain('structure')
    expect(res.changedFields).toContain('links')
    // Aucun champ pertinent (title/pricing/meta) ni delta significatif sur
    // body/headings : le bruit ne doit PAS déclencher de 'watch'.
    expect(res.importance).toBe('low')
  })

  it('reformulation mineure du body (< 15% de mots différents) → importance=low', () => {
    const oldContent: ExtractedContent = {
      ...filledContent,
      body: 'Nous accompagnons les artisans et commerçants africains dans leur facturation au quotidien',
    }
    const newContent: ExtractedContent = {
      ...filledContent,
      // Une seule reformulation ("aidons" au lieu de "accompagnons"), le
      // reste du paragraphe est identique.
      body: 'Nous aidons les artisans et commerçants africains dans leur facturation au quotidien',
    }
    const res = computeDiff(oldContent, newContent)

    expect(res.hasChanged).toBe(true)
    expect(res.changedFields).toEqual(['body'])
    expect(res.importance).toBe('low')
  })

  it('changement réel de prix (fixture "vrai changement") → importance=watch', () => {
    const oldContent: ExtractedContent = { ...filledContent, pricing: ['49€/mois'] }
    const newContent: ExtractedContent = { ...filledContent, pricing: ['75€/mois'] }
    const res = computeDiff(oldContent, newContent)

    expect(res.hasChanged).toBe(true)
    expect(res.changedFields).toEqual(['pricing'])
    expect(res.importance).toBe('watch')
  })

  it('body totalement réécrit (delta > seuil) → importance=watch', () => {
    const oldContent: ExtractedContent = {
      ...filledContent,
      body: 'Nous accompagnons les artisans et commerçants africains dans leur facturation au quotidien',
    }
    const newContent: ExtractedContent = {
      ...filledContent,
      body: 'Découvrez notre nouvelle plateforme de gestion locative pour propriétaires en Afrique',
    }
    const res = computeDiff(oldContent, newContent)

    expect(res.hasChanged).toBe(true)
    expect(res.importance).toBe('watch')
  })
})

describe('jaccardSimilarity', () => {
  it('deux textes identiques → similarité de 1', () => {
    expect(jaccardSimilarity('bonjour le monde', 'bonjour le monde')).toBe(1)
  })

  it('deux textes sans aucun mot commun → similarité de 0', () => {
    expect(jaccardSimilarity('abc def', 'ghi jkl')).toBe(0)
  })

  it('deux chaînes vides → similarité de 1 (rien à comparer, pas de faux positif)', () => {
    expect(jaccardSimilarity('', '')).toBe(1)
  })
})
