import { describe, it, expect } from 'vitest'
import { extractContent } from '~/lib/crawler/extract'
import { sanitizeHtml } from '~/lib/crawler/sanitize'

describe('sanitizeHtml', () => {
  it('supprime les balises <script> et <style>', () => {
    const html = `
      <html>
        <head>
          <script>console.log("test")</script>
          <style>.test { color: red; }</style>
        </head>
        <body>
          <p>Test</p>
        </body>
      </html>
    `
    const $ = sanitizeHtml(html)
    expect($('script').length).toBe(0)
    expect($('style').length).toBe(0)
    expect($('p').text()).toBe('Test')
  })

  it('le body_text est identique pour une page bruyante et sa version nettoyée', () => {
    const htmlWithNoise = `
      <html>
        <body>
          <nav>Menu</nav>
          <p>Contenu principal</p>
          <div id="cookie-banner">Accepter les cookies</div>
          <footer>Footer</footer>
        </body>
      </html>
    `
    
    // Pour simuler la version nettoyée "parfaite" attendue
    const htmlClean = `
      <html>
        <body>
          <p>Contenu principal</p>
        </body>
      </html>
    `

    const contentNoisy = extractContent(sanitizeHtml(htmlWithNoise))
    const contentClean = extractContent(sanitizeHtml(htmlClean))

    expect(contentNoisy.body).toBe(contentClean.body)
  })
})
