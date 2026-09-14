import * as cheerio from 'cheerio'
import { fetchSafe } from './fetch-safe'
import { fetchRobots, isAllowed, type RobotsRules } from './robots'
import { REFLET_UA } from './constants'

export function normalizeUrl(rawUrl: string, baseUrl: string): string | null {
  try {
    const url = new URL(rawUrl, baseUrl)
    
    // Rejeter les schémas dangereux (SSRF / XSS)
    if (url.protocol === 'javascript:' || url.protocol === 'data:' || url.protocol === 'vbscript:') return null
    
    // Ignore non-http
    if (!url.protocol.startsWith('http')) return null
    
    // Enforce HTTPS
    url.protocol = 'https:'
    
    // Remove hash
    url.hash = ''
    
    // Remove tracking params
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']
    for (const p of paramsToRemove) {
      url.searchParams.delete(p)
    }
    
    // Remove trailing slash if not root
    let finalStr = url.toString()
    if (finalStr.endsWith('/') && url.pathname !== '/') {
      finalStr = finalStr.slice(0, -1)
    }
    
    return finalStr
  } catch (err) {
    return null
  }
}

export interface DiscoverResult {
  urls: string[]
  robotsRules: RobotsRules
}

/**
 * Découvre les URLs d'un site en respectant son robots.txt.
 *
 * Retourne les URLs filtrées (Disallow respectés) ET les règles robots.txt
 * pour que l'orchestrateur puisse récupérer le crawlDelay sans refaire
 * un fetch supplémentaire.
 */
export async function discoverUrls(baseUrl: string): Promise<DiscoverResult> {
  const discovered = new Set<string>()
  discovered.add(normalizeUrl(baseUrl, baseUrl) || baseUrl)

  // 1. Fetch + parse du robots.txt (une seule fois pour ce domaine)
  const robotsRules = await fetchRobots(baseUrl)

  try {
    // 2. Sitemaps trouvés dans robots.txt
    for (const sitemapUrl of robotsRules.sitemaps) {
      const sitemapUrls = await extractUrlsFromSitemap(sitemapUrl)
      for (const u of sitemapUrls) discovered.add(u)
    }

    // 3. Sitemaps standards si on n'a pas encore beaucoup d'URLs
    if (discovered.size < 5) {
      const paths = ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml']
      for (const p of paths) {
        if (discovered.size > 20) break
        const sitemapUrls = await extractUrlsFromSitemap(new URL(p, baseUrl).toString())
        for (const u of sitemapUrls) discovered.add(u)
      }
    }

    // 4. Fallback: crawl HTML de la page d'accueil
    if (discovered.size < 5) {
      const homeRes = await fetchSafe(baseUrl, {
        timeoutMs: 5_000,
        headers: { 'User-Agent': REFLET_UA },
      })
      if (homeRes.status < 400) {
        const $ = cheerio.load(homeRes.text)
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href')
          if (href) {
            const normalized = normalizeUrl(href, baseUrl)
            if (normalized && normalized.startsWith(baseUrl)) {
              discovered.add(normalized)
            }
          }
        })
      }
    }

  } catch (err) {
    console.error(`[discover] Error discovering ${baseUrl}`, err)
  }

  // 5. Filtrer les URLs interdites par robots.txt avant de retourner
  const filtered = Array.from(discovered)
    .filter((url) => isAllowed(url, robotsRules))
    .slice(0, 200) // Limit to 200 pages

  return { urls: filtered, robotsRules }
}

async function extractUrlsFromSitemap(sitemapUrl: string, depth = 0): Promise<string[]> {
  if (depth > 2) return [] // Limit recursive depth
  const urls: string[] = []
  try {
    const res = await fetchSafe(sitemapUrl, {
      timeoutMs: 5_000,
      headers: { 'User-Agent': REFLET_UA },
    })
    if (res.status >= 400) return []
    const xml = res.text
    
    // Simple regex parsing for <loc> tags
    const matches = xml.matchAll(/<loc>(.*?)<\/loc>/g)
    for (const match of matches) {
      const url = match[1]
      if (url.endsWith('.xml')) {
        const subUrls = await extractUrlsFromSitemap(url, depth + 1)
        urls.push(...subUrls)
      } else {
        const normalized = normalizeUrl(url, sitemapUrl)
        if (normalized) urls.push(normalized)
      }
    }
  } catch (err) {
    // Ignore sitemap fetch errors (SSRF blocked, timeout, etc.)
  }
  return urls
}
