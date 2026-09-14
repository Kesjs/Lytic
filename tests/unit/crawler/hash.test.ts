import { describe, it, expect } from 'vitest'
import { generateHashes } from '~/lib/crawler/hash'
import { sanitizeHtml } from '~/lib/crawler/sanitize'

const html1 = `
<html>
  <head>
    <title>Acme - Solutions logicielles</title>
    <meta name="description" content="Acme est le leader des solutions SaaS.">
  </head>
  <body>
    <h1>Bienvenue chez Acme</h1>
    <h2>Nos produits</h2>
    <p>Texte de contenu principal très important pour le référencement.</p>
    <a href="/produit">Voir les produits</a>
    <button>Essai gratuit</button>
  </body>
</html>
`

describe('generateHashes', () => {
  it('produit les mêmes hashes pour le même HTML (déterminisme)', () => {
    const $ = sanitizeHtml(html1)
    const hashes1 = generateHashes($)
    const hashes2 = generateHashes(sanitizeHtml(html1))
    
    expect(hashes1.title_hash).toBe(hashes2.title_hash)
    expect(hashes1.body_hash).toBe(hashes2.body_hash)
    expect(hashes1.headings_hash).toBe(hashes2.headings_hash)
    expect(hashes1.meta_hash).toBe(hashes2.meta_hash)
    expect(hashes1.links_hash).toBe(hashes2.links_hash)
  })

  it('produit des hashes non-null pour un HTML valide', () => {
    const $ = sanitizeHtml(html1)
    const hashes = generateHashes($)
    
    expect(hashes.title_hash).not.toBeNull()
    expect(hashes.body_hash).not.toBeNull()
    expect(hashes.headings_hash).not.toBeNull()
  })

  it('un changement de whitespace ne change pas le hash (normalisation)', () => {
    const html1Compact = html1.replace(/\s+/g, ' ')
    const html1Extra = html1.replace(/\n/g, '\n\n\n')

    const h1 = generateHashes(sanitizeHtml(html1Compact))
    const h2 = generateHashes(sanitizeHtml(html1Extra))

    // Les hashes de body doivent être identiques après normalisation
    expect(h1.title_hash).toBe(h2.title_hash)
    expect(h1.headings_hash).toBe(h2.headings_hash)
  })

  it('un changement de contenu produit un hash différent', () => {
    const html2 = html1.replace('Bienvenue chez Acme', 'Nouveau titre complètement différent')
    const h1 = generateHashes(sanitizeHtml(html1))
    const h2 = generateHashes(sanitizeHtml(html2))
    expect(h1.headings_hash).not.toBe(h2.headings_hash)
  })

  it('retourne null pour une page sans title', () => {
    const htmlNoTitle = '<html><body><p>Contenu</p></body></html>'
    const hashes = generateHashes(sanitizeHtml(htmlNoTitle))
    expect(hashes.title_hash).toBeNull()
  })
})
