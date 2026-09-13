// Calcul déterministe de `cited` (§3 du plan Bloc 0).
// Comparaison domaine marque / urls_citation — jamais demandé à une IA.
// Reçoit les citations déjà extraites par runOpenAIQuery() pour éviter
// de re-parser le texte brut.

/**
 * Normalise un hostname : retire "www.", force lowercase, retire le port.
 */
function normalizeHostname(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/:\d+$/, '')
}

/**
 * Extrait le hostname d'une URL, retourne null si l'URL est invalide.
 */
function hostnameFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

/**
 * Extrait le domaine racine d'une URL de marque (website_url).
 * Ex : "https://www.acme.com/about" → "acme.com"
 */
export function extractBrandDomain(websiteUrl: string): string {
  try {
    return normalizeHostname(new URL(websiteUrl).hostname)
  } catch {
    // Fallback : normalise directement la chaîne si ce n'est pas une URL complète
    return normalizeHostname(websiteUrl)
  }
}

/**
 * Détermine si la marque est citée en source dans une réponse OpenAI.
 *
 * @param citations - URLs extraites des annotations url_citation de la réponse
 * @param brandDomain - domaine normalisé de la marque (ex. "acme.com")
 *   Utiliser extractBrandDomain(brand.website_url) pour le calculer.
 *
 * Retourne true si au moins une citation correspond au domaine de la marque
 * (correspondance exacte ou sous-domaine : "blog.acme.com" ⊆ "acme.com").
 */
export function isBrandCited(citations: string[], brandDomain: string): boolean {
  if (!brandDomain || citations.length === 0) return false

  const normalizedBrand = normalizeHostname(brandDomain)

  return citations.some((url) => {
    const hostname = hostnameFromUrl(url)
    if (!hostname) return false
    const normalized = normalizeHostname(hostname)
    // Correspondance exacte ou sous-domaine (ex. "blog.acme.com" → "acme.com")
    return normalized === normalizedBrand || normalized.endsWith(`.${normalizedBrand}`)
  })
}
