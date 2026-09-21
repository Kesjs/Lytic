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
  jsonLd: boolean
  h1Count: number
  titleLength: number
  hasMetaDescription: boolean
  // Nouveaux checks techniques (#15)
  schemaTypes: string[]
  hasUniqueH1: boolean
  metaDescriptionLength: number
  hasCanonical: boolean
  imagesWithoutAlt: number
  duplicateMetaDescriptions: boolean
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

  // SEO & Technical Audit IA metrics (#15/#16)
  const jsonLd = $('script[type="application/ld+json"]').length > 0
  const h1Count = $('h1').length
  const titleLength = title?.length || 0
  const hasMetaDescription = !!$('meta[name="description"]').attr('content')

  // Nouveaux checks techniques (#15)
  const schemaTypes: string[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).text()
      const parsed = JSON.parse(content)
      if (parsed['@type']) {
        const types = Array.isArray(parsed['@type']) ? parsed['@type'] : [parsed['@type']]
        schemaTypes.push(...types)
      }
    } catch (e) {
      // JSON invalide, ignorer
    }
  })
  const uniqueSchemaTypes = [...new Set(schemaTypes)]

  const hasUniqueH1 = h1Count === 1
  const metaDescriptionLength = desc.length
  const hasCanonical = $('link[rel="canonical"]').length > 0

  const imagesWithoutAlt = $('img:not([alt]), img[alt=""]').length

  // Vérifier les meta descriptions dupliquées (basique - même texte sur plusieurs pages)
  // Note: Cette vérification nécessite une comparaison avec d'autres pages, donc on retourne juste la donnée brute
  const duplicateMetaDescriptions = false // À implémenter avec comparaison cross-pages

  return {
    title,
    meta,
    headings,
    body,
    pricing: uniquePricing,
    cta: uniqueCta,
    links: uniqueLinks,
    structure,
    jsonLd,
    h1Count,
    titleLength,
    hasMetaDescription,
    schemaTypes: uniqueSchemaTypes,
    hasUniqueH1,
    metaDescriptionLength,
    hasCanonical,
    imagesWithoutAlt,
    duplicateMetaDescriptions,
  }
}
