import { describe, it, expect } from 'vitest'
import { computeDiff } from '~/lib/crawler/diff'
import type { PageHashes } from '~/lib/crawler/hash'

const emptyHashes: PageHashes = {
  title_hash: null,
  meta_hash: null,
  headings_hash: null,
  body_hash: null,
  pricing_hash: null,
  cta_hash: null,
  links_hash: null,
  structure_hash: null,
}

const filledHashes: PageHashes = {
  title_hash: 'abc',
  meta_hash: 'def',
  headings_hash: 'ghi',
  body_hash: 'jkl',
  pricing_hash: 'mno',
  cta_hash: 'pqr',
  links_hash: 'stu',
  structure_hash: 'vwx',
}

describe('computeDiff', () => {
  it('baseline (oldHashes=null) → hasChanged=false, changedFields=[]', () => {
    const result = computeDiff(null, filledHashes)
    expect(result.hasChanged).toBe(false)
    expect(result.changedFields).toEqual([])
  })

  it('hashes identiques → hasChanged=false', () => {
    const result = computeDiff(filledHashes, { ...filledHashes })
    expect(result.hasChanged).toBe(false)
    expect(result.changedFields).toHaveLength(0)
  })

  it('un seul hash différent → changedFields contient uniquement ce field', () => {
    const newHashes: PageHashes = { ...filledHashes, title_hash: 'CHANGED' }
    const result = computeDiff(filledHashes, newHashes)
    expect(result.hasChanged).toBe(true)
    expect(result.changedFields).toEqual(['title_hash'])
  })

  it('plusieurs hashes différents → changedFields contient tous les fields modifiés', () => {
    const newHashes: PageHashes = { ...filledHashes, title_hash: 'X', body_hash: 'Y' }
    const result = computeDiff(filledHashes, newHashes)
    expect(result.hasChanged).toBe(true)
    expect(result.changedFields).toContain('title_hash')
    expect(result.changedFields).toContain('body_hash')
    expect(result.changedFields).toHaveLength(2)
  })

  it('tous les hashes changent → changedFields contient tous les 8 fields', () => {
    const otherHashes: PageHashes = {
      title_hash: '1', meta_hash: '2', headings_hash: '3', body_hash: '4',
      pricing_hash: '5', cta_hash: '6', links_hash: '7', structure_hash: '8',
    }
    const result = computeDiff(filledHashes, otherHashes)
    expect(result.hasChanged).toBe(true)
    expect(result.changedFields).toHaveLength(8)
  })

  it('transition null→valeur après baseline → détecte le changement', () => {
    // L'ancien run avait des hashes (page déjà indexée), le nouveau aussi mais différents
    const oldWithNulls: PageHashes = { ...filledHashes, pricing_hash: null }
    const newFilled: PageHashes = { ...filledHashes, pricing_hash: 'new_value' }
    const result = computeDiff(oldWithNulls, newFilled)
    expect(result.hasChanged).toBe(true)
    expect(result.changedFields).toContain('pricing_hash')
  })
})
