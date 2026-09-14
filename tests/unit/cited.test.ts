import { describe, it, expect } from 'vitest'
import { extractBrandDomain, isBrandCited } from '~/lib/cited'

describe('extractBrandDomain', () => {
  it('extrait le domaine depuis une URL https avec www.', () => {
    expect(extractBrandDomain('https://www.acme.com')).toBe('acme.com')
  })

  it('extrait le domaine depuis une URL http', () => {
    expect(extractBrandDomain('http://acme.com')).toBe('acme.com')
  })

  it('gère le trailing slash', () => {
    expect(extractBrandDomain('https://acme.com/')).toBe('acme.com')
  })

  it('gère les sous-domaines', () => {
    expect(extractBrandDomain('https://blog.acme.com/article')).toBe('blog.acme.com')
  })

  it('force le lowercase', () => {
    expect(extractBrandDomain('https://ACME.COM')).toBe('acme.com')
  })

  it('retire www. mais pas les autres sous-domaines', () => {
    expect(extractBrandDomain('https://www.acme.com')).toBe('acme.com')
    expect(extractBrandDomain('https://app.acme.com')).toBe('app.acme.com')
  })
})

describe('isBrandCited', () => {
  it('retourne false si la liste de citations est vide', () => {
    expect(isBrandCited([], 'acme.com')).toBe(false)
  })

  it('retourne false si brandDomain est vide', () => {
    expect(isBrandCited(['https://acme.com'], '')).toBe(false)
  })

  it('détecte une correspondance exacte', () => {
    expect(isBrandCited(['https://acme.com/page'], 'acme.com')).toBe(true)
  })

  it('est insensible à la casse', () => {
    expect(isBrandCited(['https://ACME.COM/page'], 'acme.com')).toBe(true)
  })

  it('détecte les sous-domaines (blog.acme.com ⊆ acme.com)', () => {
    expect(isBrandCited(['https://blog.acme.com/article'], 'acme.com')).toBe(true)
  })

  it('ne génère pas de faux positifs sur des domaines similaires', () => {
    expect(isBrandCited(['https://notacme.com'], 'acme.com')).toBe(false)
    expect(isBrandCited(['https://acme.com.evil.com'], 'acme.com')).toBe(false)
  })

  it('retourne true si au moins une citation correspond', () => {
    expect(isBrandCited(['https://other.com', 'https://acme.com'], 'acme.com')).toBe(true)
  })

  it('retourne false si aucune citation ne correspond', () => {
    expect(isBrandCited(['https://other.com', 'https://example.org'], 'acme.com')).toBe(false)
  })

  it('ignore les URLs malformées dans les citations sans crasher', () => {
    expect(isBrandCited(['not-a-url', 'https://acme.com'], 'acme.com')).toBe(true)
    expect(isBrandCited(['not-a-url'], 'acme.com')).toBe(false)
  })
})
