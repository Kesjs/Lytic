import * as cheerio from 'cheerio'

export interface FetchResult {
  url: string
  html: string
  status: number
  isSPA: boolean
}

export async function fetchPage(url: string): Promise<FetchResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'RefletBot/1.0 (+https://reflet.app)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    // Timeout of 10s is standard for serverless
    signal: AbortSignal.timeout(10000), 
  })

  const html = await response.text()
  const $ = cheerio.load(html)
  
  // Détection SPA (Single Page Application sans SSR)
  // Si le body est presque vide ou ne contient qu'un div #root/#app, 
  // et pas de state (__NEXT_DATA__, __NUXT__)
  const bodyText = $('body').text().trim()
  const hasRoot = $('#root').length > 0 || $('#app').length > 0
  const hasSsrState = $('#__NEXT_DATA__').length > 0 || $('script[window.__NUXT__]').length > 0
  
  const isSPA = bodyText.length < 500 && hasRoot && !hasSsrState

  return {
    url,
    html,
    status: response.status,
    isSPA,
  }
}
