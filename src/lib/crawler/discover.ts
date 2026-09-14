import * as cheerio from 'cheerio'

export function normalizeUrl(rawUrl: string, baseUrl: string): string | null {
  try {
    const url = new URL(rawUrl, baseUrl)
    
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

export async function discoverUrls(baseUrl: string): Promise<string[]> {
  const discovered = new Set<string>()
  discovered.add(normalizeUrl(baseUrl, baseUrl) || baseUrl)

  try {
    // 1. Check robots.txt
    const robotsRes = await fetch(new URL('/robots.txt', baseUrl).toString(), { signal: AbortSignal.timeout(5000) })
    if (robotsRes.ok) {
      const robotsTxt = await robotsRes.text()
      const sitemapMatch = robotsTxt.match(/Sitemap:\s*(.+)/i)
      if (sitemapMatch && sitemapMatch[1]) {
        const sitemapUrl = sitemapMatch[1].trim()
        const sitemapUrls = await extractUrlsFromSitemap(sitemapUrl)
        for (const u of sitemapUrls) discovered.add(u)
      }
    }

    // 2. If we don't have many URLs yet, try standard sitemaps
    if (discovered.size < 5) {
      const paths = ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml']
      for (const p of paths) {
        if (discovered.size > 20) break
        const sitemapUrls = await extractUrlsFromSitemap(new URL(p, baseUrl).toString())
        for (const u of sitemapUrls) discovered.add(u)
      }
    }

    // 3. Fallback: simple HTML crawl of the home page
    if (discovered.size < 5) {
      const homeRes = await fetch(baseUrl, { signal: AbortSignal.timeout(5000) })
      if (homeRes.ok) {
        const html = await homeRes.text()
        const $ = cheerio.load(html)
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

  // Limit to 200 pages as per specs
  return Array.from(discovered).slice(0, 200)
}

async function extractUrlsFromSitemap(sitemapUrl: string, depth = 0): Promise<string[]> {
  if (depth > 2) return [] // Limit recursive depth
  const urls: string[] = []
  try {
    const res = await fetch(sitemapUrl, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const xml = await res.text()
    
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
    // Ignore sitemap fetch errors
  }
  return urls
}
