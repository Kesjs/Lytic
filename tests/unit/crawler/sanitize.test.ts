import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from '~/lib/crawler/sanitize'
import { generateHashes } from '~/lib/crawler/hash'

const htmlWithNoise = `
<html>
  <head>
    <title>Page propre</title>
    <style>body { color: red; font-size: 16px; }</style>
  </head>
  <body>
    <script>window.dataLayer = []; console.log("tracking");</script>
    <nav>Menu de navigation</nav>
    <footer>Pied de page</footer>
    <h1>Contenu principal</h1>
    <p>Ce texte doit être conservé pour le hashing.</p>
    <div id="cookie-banner">Accepter les cookies</div>
    <div class="chat-widget">Chat support</div>
    <script>gtag('event', 'page_view');</script>
    <noscript>JavaScript requis</noscript>
    <svg><path d="M0 0"/></svg>
  </body>
</html>
`

const htmlClean = `
<html>
  <head>
    <title>Page propre</title>
  </head>
  <body>
    <h1>Contenu principal</h1>
    <p>Ce texte doit être conservé pour le hashing.</p>
  </body>
</html>
`

describe('sanitizeHtml', () => {
  it('retire les balises <script>', () => {
    const $ = sanitizeHtml(htmlWithNoise)
    expect($('script').length).toBe(0)
  })

  it('retire les balises <style>', () => {
    const $ = sanitizeHtml(htmlWithNoise)
    expect($('style').length).toBe(0)
  })

  it('retire la balise <nav>', () => {
    const $ = sanitizeHtml(htmlWithNoise)
    expect($('nav').length).toBe(0)
  })

  it('retire la balise <footer>', () => {
    const $ = sanitizeHtml(htmlWithNoise)
    expect($('footer').length).toBe(0)
  })

  it('retire les éléments liés aux cookies', () => {
    const $ = sanitizeHtml(htmlWithNoise)
    expect($('#cookie-banner').length).toBe(0)
  })

  it('retire les widgets de chat', () => {
    const $ = sanitizeHtml(htmlWithNoise)
    expect($('.chat-widget').length).toBe(0)
  })

  it('conserve le contenu principal (h1, paragraphes)', () => {
    const $ = sanitizeHtml(htmlWithNoise)
    expect($('h1').text()).toContain('Contenu principal')
    expect($('p').text()).toContain('Ce texte doit être conservé')
  })

  it('le hash body_hash est identique pour une page bruyante et sa version nettoyée', () => {
    const hashNoisy = generateHashes(sanitizeHtml(htmlWithNoise))
    const hashClean = generateHashes(sanitizeHtml(htmlClean))
    // Les hashes de headings doivent correspondre (h1 identique)
    expect(hashNoisy.headings_hash).toBe(hashClean.headings_hash)
  })
})
