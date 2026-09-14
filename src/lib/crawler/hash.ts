import { createHash } from 'crypto'
import type { CheerioAPI } from 'cheerio'

export interface PageHashes {
  title_hash: string | null
  meta_hash: string | null
  headings_hash: string | null
  body_hash: string | null
  pricing_hash: string | null
  cta_hash: string | null
  links_hash: string | null
  structure_hash: string | null
}

function sha256(content: string | null | undefined): string | null {
  if (!content || content.trim().length === 0) return null
  return createHash('sha256').update(content.trim()).digest('hex')
}

export function generateHashes($: CheerioAPI): PageHashes {
  // Title
  const title = $('title').text().replace(/\s+/g, ' ').trim().toLowerCase()
  
  // Meta
  const desc = $('meta[name="description"]').attr('content') || ''
  const ogTitle = $('meta[property="og:title"]').attr('content') || ''
  const ogDesc = $('meta[property="og:description"]').attr('content') || ''
  const meta = `${desc}|${ogTitle}|${ogDesc}`
  
  // Headings
  const headings: string[] = []
  $('h1, h2, h3').each((_, el) => {
    headings.push($(el).text().replace(/\s+/g, ' ').trim())
  })
  
  // Body (après sanitize, le body contient juste le texte utile)
  const body = $('body').text().replace(/\s+/g, ' ').trim()
  
  // Pricing (détection basique € $ £ FCFA /mois /an)
  const pricing: string[] = []
  $('*:contains("€"), *:contains("$"), *:contains("£"), *:contains("FCFA"), *:contains("/mois"), *:contains("/an")').each((_, el) => {
    pricing.push($(el).text().replace(/\s+/g, ' ').trim())
  })
  
  // CTA
  const ctas: string[] = []
  $('button, a[class*="btn"], a[class*="button"]').each((_, el) => {
    ctas.push($(el).text().replace(/\s+/g, ' ').trim())
  })
  
  // Links
  const links: string[] = []
  $('a[href^="/"], a[href^="http"]').each((_, el) => {
    const href = $(el).attr('href')
    if (href) links.push(href.split('#')[0]) // Ignore anchors
  })
  const uniqueLinks = [...new Set(links)].sort()
  
  // Structure
  const structure: string[] = []
  $('*').each((_, el) => {
    if ('tagName' in el) structure.push((el as any).tagName)
  })

  return {
    title_hash: sha256(title),
    meta_hash: sha256(meta),
    headings_hash: sha256(headings.join('|')),
    body_hash: sha256(body),
    pricing_hash: sha256(pricing.join('|')),
    cta_hash: sha256(ctas.join('|')),
    links_hash: sha256(uniqueLinks.join('|')),
    structure_hash: sha256(structure.join('|')),
  }
}
