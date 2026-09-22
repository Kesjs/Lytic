import * as cheerio from 'cheerio'

export function sanitizeHtml(html: string): cheerio.CheerioAPI {
  const $ = cheerio.load(html)
  
  // Supprimer les éléments qui causent des faux positifs (horodatages, bannières dynamiques)
  $('nav, footer, script, style, noscript, svg, iframe, [id*="cookie"], [class*="cookie"], [id*="chat"], [class*="chat"], .cmp, #cmp').remove()

  // Supprimer les éléments de chargement (skeleton/spinner/placeholder) qui
  // restent parfois dans le DOM rendu par Puppeteer à côté du vrai contenu
  // hydraté (cf. bug "Chargement...T.Y.L.ATHE..." — le extract récupérait
  // à la fois le placeholder de chargement ET le contenu final). On ne
  // matche que sur class/id pour éviter de supprimer du texte éditorial
  // légitime qui contiendrait accidentellement le mot "loading".
  $('[aria-busy="true"]').remove()
  $('*').each((_, el) => {
    const classAndId = `${$(el).attr('class') || ''} ${$(el).attr('id') || ''}`
    if (/\b(loading|loader|skeleton|spinner)\b/i.test(classAndId)) {
      $(el).remove()
    }
  })

  return $
}
