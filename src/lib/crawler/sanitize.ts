import * as cheerio from 'cheerio'

export function sanitizeHtml(html: string): cheerio.CheerioAPI {
  const $ = cheerio.load(html)
  
  // Supprimer les éléments qui causent des faux positifs (horodatages, bannières dynamiques)
  $('nav, footer, script, style, noscript, svg, iframe, [id*="cookie"], [class*="cookie"], [id*="chat"], [class*="chat"], .cmp, #cmp').remove()

  return $
}
