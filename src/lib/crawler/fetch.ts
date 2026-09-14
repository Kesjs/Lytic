import * as cheerio from 'cheerio'
import { fetchSafe } from './fetch-safe'

export interface FetchResult {
  url: string
  html: string
  status: number
  isSPA: boolean
}

export async function fetchPage(url: string): Promise<FetchResult> {
  const result = await fetchSafe(url, { timeoutMs: 10_000 })

  const html = result.text
  const $ = cheerio.load(html)
  
  // Détection SPA (Single Page Application sans SSR)
  // Si le body est presque vide ou ne contient qu'un div #root/#app, 
  // et pas de state (__NEXT_DATA__, __NUXT__)
  const bodyText = $('body').text().trim()
  const hasRoot = $('#root').length > 0 || $('#app').length > 0
  const hasSsrState = $('#__NEXT_DATA__').length > 0 || $('script[window.__NUXT__]').length > 0
  
  const isSPA = bodyText.length < 500 && hasRoot && !hasSsrState

  return {
    url: result.url, // URL finale après redirections
    html,
    status: result.status,
    isSPA,
  }
}
