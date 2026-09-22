import type { CheerioAPI } from 'cheerio'

// Section structurée du contenu (heading + contenu associé)
export interface ContentSection {
  heading: string
  level: number // 1, 2, 3 pour h1, h2, h3
  content: string
}

export interface ExtractedContent {
  title: string | null
  meta: string | null
  headings: string[]
  body: string | null
  // Nouveau : contenu structuré par sections (heading + contenu)
  sections: ContentSection[]
  // Nouveau : contenu principal isolé (sans nav/footer/sidebar)
  mainContent: string | null
  // Nouveau : FAQ détectée et structurée
  faq: Array<{ question: string; answer: string }> | null
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
  
  // === NOUVEAU : Extraction du contenu principal (main, article, ou body sans nav/footer/aside) ===
  let $main = $('main')
  if ($main.length === 0) {
    $main = $('article')
  }
  if ($main.length === 0) {
    // Fallback : body sans nav, header, footer, aside
    $main = $('body').clone()
    $main.find('nav, header, footer, aside, [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]').remove()
  }

  // === NOUVEAU : Extraction des sections structurées (heading + contenu) ===
  const sections: ContentSection[] = []
  $main.find('h1, h2, h3').each((_, headingEl) => {
    const heading = $(headingEl).text().replace(/\s+/g, ' ').trim()
    if (!heading) return

    const level = Number.parseInt(headingEl.tagName.toLowerCase().replace('h', ''))
    
    // Récupérer tout le contenu jusqu'au prochain heading de même niveau ou supérieur
    const content: string[] = []
    let $next = $(headingEl).next()
    
    while ($next.length > 0) {
      const nextTag = $next.prop('tagName')?.toLowerCase()
      
      // Arrêter si on rencontre un heading de même niveau ou supérieur
      if (nextTag && ['h1', 'h2', 'h3'].includes(nextTag)) {
        const nextLevel = Number.parseInt(nextTag.replace('h', ''))
        if (nextLevel <= level) break
      }
      
      // Ajouter le texte de cet élément
      const text = $next.text().replace(/\s+/g, ' ').trim()
      if (text) content.push(text)
      
      $next = $next.next()
    }
    
    sections.push({
      heading,
      level,
      content: content.join(' ')
    })
  })

  // === NOUVEAU : Détection et extraction FAQ ===
  const faq: Array<{ question: string; answer: string }> = []
  
  // Méthode 1 : JSON-LD FAQPage
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text())
      if (parsed['@type'] === 'FAQPage' && Array.isArray(parsed.mainEntity)) {
        parsed.mainEntity.forEach((item: any) => {
          if (item['@type'] === 'Question' && item.name && item.acceptedAnswer?.text) {
            faq.push({
              question: item.name,
              answer: item.acceptedAnswer.text
            })
          }
        })
      }
    } catch (e) {
      // JSON invalide, ignorer
    }
  })
  
  // Méthode 2 : Structure HTML FAQ (dt/dd, ou sections avec "?" dans le titre)
  if (faq.length === 0) {
    // Chercher des paires dt/dd
    $('dl').each((_, dl) => {
      $(dl).find('dt').each((_, dt) => {
        const question = $(dt).text().replace(/\s+/g, ' ').trim()
        const dd = $(dt).next('dd')
        if (question && dd.length > 0) {
          const answer = dd.text().replace(/\s+/g, ' ').trim()
          if (answer) {
            faq.push({ question, answer })
          }
        }
      })
    })
  }
  
  // Méthode 3 : Sections avec headings contenant "?" ou "FAQ"
  if (faq.length === 0) {
    sections.forEach(section => {
      if (section.heading.includes('?') || /faq|questions?|r[ée]ponses?/i.test(section.heading)) {
        faq.push({
          question: section.heading,
          answer: section.content
        })
      }
    })
  }

  // === Body principal (pour compatibilité avec l'existant) ===
  // Insérer des espaces entre blocs avant d'extraire le texte
  const BLOCK_SELECTOR =
    'p, div, li, td, th, h1, h2, h3, h4, h5, h6, br, section, article, header, footer, nav, ul, ol, table, tr'
  $main.find(BLOCK_SELECTOR).each((_, el) => {
    $(el).after(' ')
  })
  const mainContent = $main.text().replace(/\s+/g, ' ').trim() || null
  
  // Body complet (pour compatibilité, mais moins utile maintenant)
  $('body').find(BLOCK_SELECTOR).each((_, el) => {
    $(el).after(' ')
  })
  const body = $('body').text().replace(/\s+/g, ' ').trim() || null
  
  // === Pricing amélioré : cibler plus précisément ===
  const pricing: string[] = []
  
  // Chercher dans les sections structurées d'abord
  sections.forEach(section => {
    if (/prix|tarif|pricing|abonnement|forfait|plan/i.test(section.heading)) {
      // Extraire les prix de cette section
      const priceMatches = section.content.match(/\d+(?:[,\.]\d+)?\s*(?:€|\$|£|FCFA|EUR|USD)\s*(?:\/\s*(?:mois|an|année|month|year))?/gi)
      if (priceMatches) {
        pricing.push(...priceMatches.map(p => p.replace(/\s+/g, ' ').trim()))
      }
    }
  })
  
  // Fallback : méthode originale
  if (pricing.length === 0) {
    $('*:contains("€"), *:contains("$"), *:contains("£"), *:contains("FCFA"), *:contains("/mois"), *:contains("/an")').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim()
      if (text && text.length < 150) {
        // Essayer d'extraire un prix précis
        const priceMatches = text.match(/\d+(?:[,\.]\d+)?\s*(?:€|\$|£|FCFA|EUR|USD)\s*(?:\/\s*(?:mois|an|année|month|year))?/gi)
        if (priceMatches) {
          pricing.push(...priceMatches.map(p => p.replace(/\s+/g, ' ').trim()))
        }
      }
    })
  }
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
    sections,
    mainContent,
    faq: faq.length > 0 ? faq : null,
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
