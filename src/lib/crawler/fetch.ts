import * as cheerio from 'cheerio'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'
import { fetchSafe } from './fetch-safe'

export interface FetchResult {
  url: string
  html: string
  status: number
  isSPA: boolean
}

export async function fetchPage(url: string): Promise<FetchResult> {
  const result = await fetchSafe(url, { timeoutMs: 10_000 })

  let html = result.text
  const $ = cheerio.load(html)
  
  // Détection SPA (Single Page Application sans SSR)
  // Si le body est presque vide ou ne contient qu'un div #root/#app, 
  // et pas de state (__NEXT_DATA__, __NUXT__)
  const bodyText = $('body').text().trim()
  const hasRoot = $('#root').length > 0 || $('#app').length > 0
  const hasSsrState = $('#__NEXT_DATA__').length > 0 || $('script[window.__NUXT__]').length > 0
  
  const isSPA = bodyText.length < 500 && hasRoot && !hasSsrState

  if (isSPA) {
    try {
      const browser = await puppeteer.launch({
        args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 720 },
        executablePath: await chromium.executablePath(
          'https://github.com/Sparticuz/chromium/releases/download/v122.0.0/chromium-v122.0.0-pack.tar'
        ),
        headless: true,
      })
      const page = await browser.newPage()
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15_000 })
      html = await page.content()
      await browser.close()
    } catch (e) {
      console.error(`Erreur SPA headless pour ${url}:`, e)
      // On fallback silencieusement sur le HTML d'origine
    }
  }

  return {
    url: result.url, // URL finale après redirections
    html,
    status: result.status,
    isSPA,
  }
}
