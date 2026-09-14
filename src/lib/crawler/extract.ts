import type { CheerioAPI } from 'cheerio'

export interface ExtractedContent {
  title: string | null
  meta: string | null
  headings: string[]
  body: string | null
  pricing: string[]
  cta: string[]
  links: string[]
  structure: string[]
}

export function extractContent($: CheerioAPI): ExtractedContent {
  // Title
  const title = $('title').text().replace(/\s+/g, ' ').trim() || null
  
  // Meta
  const desc = $('meta[name="description"]').attr('content') || ''
  const ogTitle = $('meta[property="og:title"]').attr('content') || ''
  const ogDesc = $('meta[property="og:description"]').attr('content') || ''
  const meta = [desc, ogTitle, ogDesc].filter(Boolean).join(' | ') || null
  
  // Headings
  const headings: string[] = []
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (text) headings.push(text)
  })
  
  // Body (après sanitize, le body contient juste le texte utile)
  const body = $('body').text().replace(/\s+/g, ' ').trim() || null
  
  // Pricing (détection basique € $ £ FCFA /mois /an)
  const pricing: string[] = []
  $('*:contains("€"), *:contains("$"), *:contains("£"), *:contains("FCFA"), *:contains("/mois"), *:contains("/an")').each((_, el) => {
    // Éviter de récupérer tout le body si le symbole est tout en haut
    // On ne garde que les éléments textes courts
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (text && text.length < 150) {
      pricing.push(text)
    }
  })
  // Déduplication basique
  const uniquePricing = [...new Set(pricing)]
  
  // CTA
  const cta: string[] = []
  $('button, a[class*="btn"], a[class*="button"]').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (text && text.length < 50) {
      cta.push(text)
    }
  })
  const uniqueCta = [...new Set(cta)]
  
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
    title,
    meta,
    headings,
    body,
    pricing: uniquePricing,
    cta: uniqueCta,
    links: uniqueLinks,
    structure,
  }
}
