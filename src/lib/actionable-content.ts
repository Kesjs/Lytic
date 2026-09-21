/**
 * Palier 0 - Génération de contenu prêt à copier-coller
 *
 * Transforme les opportunités en contenu concret que l'utilisateur peut
 * copier-coller directement sur son site sans avoir besoin d'un accès
 * en écriture de Reflet.
 */

export interface ActionableContent {
  /** Type de contenu à appliquer */
  type: 'robots_txt' | 'llms_txt' | 'meta_description' | 'json_ld' | 'redirect_rule' | 'custom'
  /** Titre lisible pour l'utilisateur */
  label: string
  /** Contenu exact à copier-coller */
  content: string
  /** Instructions additionnelles (optionnel) */
  instructions?: string
  /** Nom du fichier concerné (ex: robots.txt) */
  filename?: string
}

/**
 * Génère le contenu prêt à appliquer pour une opportunité donnée
 */
export function generateActionableContent(opportunity: {
  title: string
  reason: string
  proposed_direction?: string | null
  website_url?: string | null
}): ActionableContent | null {
  const { title, reason, proposed_direction, website_url } = opportunity

  // robots.txt manquant
  if (title.toLowerCase().includes('robots.txt') || reason.toLowerCase().includes('robots.txt')) {
    return {
      type: 'robots_txt',
      label: 'robots.txt complet',
      filename: 'robots.txt',
      content: generateRobotsTxt(website_url),
      instructions: 'Placez ce fichier à la racine de votre site (ex: https://votre-site.com/robots.txt)'
    }
  }

  // llms.txt manquant
  if (title.toLowerCase().includes('llms.txt') || reason.toLowerCase().includes('llms.txt')) {
    return {
      type: 'llms_txt',
      label: 'llms.txt complet',
      filename: 'llms.txt',
      content: generateLlmsTxt(website_url),
      instructions: 'Placez ce fichier à la racine de votre site (ex: https://votre-site.com/llms.txt)'
    }
  }

  // Bot bloqué dans robots.txt
  if (title.toLowerCase().includes('bot') && (reason.toLowerCase().includes('bloqué') || reason.toLowerCase().includes('disallow'))) {
    return {
      type: 'robots_txt',
      label: 'robots.txt corrigé',
      filename: 'robots.txt',
      content: generateRobotsTxt(website_url, true),
      instructions: 'Placez ce fichier à la racine de votre site (ex: https://votre-site.com/robots.txt)'
    }
  }

  // Meta description manquante
  if (title.toLowerCase().includes('meta') || title.toLowerCase().includes('description')) {
    const metaContent = proposed_direction || 'Une description concise et attrayante de votre page (150-160 caractères)'
    return {
      type: 'meta_description',
      label: 'Meta description',
      content: `<meta name="description" content="${metaContent}" />`,
      instructions: 'Ajoutez cette balise dans la section <head> de votre page HTML'
    }
  }

  // JSON-LD / Schema.org manquant
  if (title.toLowerCase().includes('schema') || title.toLowerCase().includes('json-ld') || title.toLowerCase().includes('structured data')) {
    return {
      type: 'json_ld',
      label: 'Snippet JSON-LD',
      content: generateJsonLd(website_url),
      instructions: 'Ajoutez ce script dans la section <head> de votre page HTML'
    }
  }

  // Page supprimée (redirect)
  if (title.toLowerCase().includes('page') && (title.toLowerCase().includes('supprimée') || title.toLowerCase().includes('removed'))) {
    return {
      type: 'redirect_rule',
      label: 'Règle de redirection',
      content: `# Exemple de redirection dans votre serveur web ou CMS\n# Redirige l'ancienne URL vers une page pertinente\n\n# Apache (.htaccess):\nRedirect 301 /ancienne-page https://${website_url}/nouvelle-page\n\n# Nginx:\nrewrite ^/ancienne-page$ https://${website_url}/nouvelle-page permanent;\n\n# WordPress (plugin redirection):\n# Configurez via l'interface ou un plugin`,
      instructions: 'Choisissez la méthode adaptée à votre hébergement et remplacez les URLs par les vôtres'
    }
  }

  // Contenu générique (proposed_direction)
  if (proposed_direction) {
    return {
      type: 'custom',
      label: 'Suggestion d\'amélioration',
      content: proposed_direction,
      instructions: reason
    }
  }

  return null
}

/**
 * Génère un robots.txt standard autorisant les bots
 */
function generateRobotsTxt(websiteUrl: string | null | undefined, fixBotBlock = false): string {
  const domain = websiteUrl || 'votre-site.com'
  const sitemap = `https://${domain}/sitemap.xml`

  return `# robots.txt pour ${domain}
# Autorise tous les bots d'indexation

User-agent: *
Allow: /

# Sitemap (si applicable)
Sitemap: ${sitemap}

# Pour bloquer des sections spécifiques (ex: admin, API):
# Disallow: /admin/
# Disallow: /api/

# Pour bloquer un bot spécifique (décommentez si nécessaire):
# User-agent: nom-du-bot
# Disallow: /`
}

/**
 * Génère un llms.txt standard
 */
function generateLlmsTxt(websiteUrl: string | null | undefined): string {
  const domain = websiteUrl || 'votre-site.com'

  return `# llms.txt pour ${domain}
# Informations pour les LLM et assistants IA

title: ${domain}
description: Site web de ${domain}
url: https://${domain}

# Sections importantes pour l'indexation IA
sections:
  - path: /
    description: Page d'accueil
  - path: /about
    description: À propos
  - path: /contact
    description: Contact

# Pour ajouter plus de sections, ajoutez des entrées:
#   - path: /votre-page
#     description: Description de la page`
}

/**
 * Génère un snippet JSON-LD basique (Organization)
 */
function generateJsonLd(websiteUrl: string | null | undefined): string {
  const domain = websiteUrl || 'votre-site.com'

  return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${domain}",
  "url": "https://${domain}",
  "logo": "https://${domain}/logo.png",
  "sameAs": [
    "https://twitter.com/${domain}",
    "https://linkedin.com/company/${domain}"
  ]
}
</script>`
}
