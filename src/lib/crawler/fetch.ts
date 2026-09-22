import * as cheerio from 'cheerio'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'
import { fetchSafe } from './fetch-safe'

export interface FetchResult {
  url: string
  html: string
  status: number
  isSPA: boolean
  // true uniquement si isSPA=true ET le rendu headless a échoué : le HTML
  // renvoyé est alors la coquille vide d'origine, pas le contenu réellement
  // affiché aux visiteurs. Avant ce fix, cet échec était juste loggé en
  // console puis oublié — l'appelant traitait ce HTML vide comme un succès
  // normal, ce qui aurait reproduit le même type de faux "Aucun H1/JSON-LD
  // détecté" qu'on vient de corriger, mais cette fois sur un vrai contenu
  // existant simplement jamais rendu (cf. #26).
  spaRenderFailed: boolean
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
  const hasSsrState = $('#__NEXT_DATA__').length > 0 || html.includes('window.__NUXT__')
  
  const isSPA = bodyText.length < 500 && hasRoot && !hasSsrState
  let spaRenderFailed = false

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
      // Fallback sur le HTML d'origine (coquille vide) — mais on le signale
      // désormais à l'appelant au lieu de rester silencieux.
      spaRenderFailed = true
    }
  }

  return {
    url: result.url, // URL finale après redirections
    html,
    status: result.status,
    isSPA,
    spaRenderFailed,
  }
}
