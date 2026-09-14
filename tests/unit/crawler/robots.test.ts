import { describe, expect, it } from 'vitest'
import { parseRobotsTxt, isAllowed } from '../../../src/lib/crawler/robots'

describe('robots.txt parsing and logic', () => {
  it('respects specific user-agent over wildcard', () => {
    const txt = `
User-agent: *
Disallow: /admin/

User-agent: RefletBot
Allow: /
`
    const rules = parseRobotsTxt(txt, 'RefletBot')
    expect(rules.disallowed).toEqual([])
    expect(rules.allowed).toEqual(['/'])
    expect(isAllowed('https://test.com/admin/page', rules)).toBe(true)
  })

  it('falls back to wildcard if no specific user-agent', () => {
    const txt = `
User-agent: *
Disallow: /admin/

User-agent: OtherBot
Allow: /
`
    const rules = parseRobotsTxt(txt, 'RefletBot')
    expect(rules.disallowed).toEqual(['/admin/'])
    expect(rules.allowed).toEqual([])
    expect(isAllowed('https://test.com/admin/page', rules)).toBe(false)
    expect(isAllowed('https://test.com/public/page', rules)).toBe(true)
  })

  it('prioritizes most specific rule (Allow over Disallow)', () => {
    const txt = `
User-agent: *
Disallow: /admin/
Allow: /admin/public/
`
    const rules = parseRobotsTxt(txt, 'RefletBot')
    expect(isAllowed('https://test.com/admin/private', rules)).toBe(false)
    expect(isAllowed('https://test.com/admin/public/page', rules)).toBe(true)
  })

  it('extracts crawl-delay correctly', () => {
    const txt = `
User-agent: *
Crawl-delay: 2.5
`
    const rules = parseRobotsTxt(txt, 'RefletBot')
    expect(rules.crawlDelayMs).toBe(2500)
  })

  it('caps crawl-delay to 10 seconds', () => {
    const txt = `
User-agent: *
Crawl-delay: 60
`
    const rules = parseRobotsTxt(txt, 'RefletBot')
    expect(rules.crawlDelayMs).toBe(10000)
  })

  it('extracts sitemaps', () => {
    const txt = `
Sitemap: https://test.com/sitemap.xml
User-agent: *
Disallow: /
Sitemap: https://test.com/sitemap2.xml
`
    const rules = parseRobotsTxt(txt, 'RefletBot')
    expect(rules.sitemaps).toEqual([
      'https://test.com/sitemap.xml',
      'https://test.com/sitemap2.xml'
    ])
  })

  it('allows everything by default', () => {
    const rules = parseRobotsTxt('', 'RefletBot')
    expect(rules.disallowed).toEqual([])
    expect(isAllowed('https://test.com/any', rules)).toBe(true)
  })
})
