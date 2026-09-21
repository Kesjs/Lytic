/**
 * Palier 0 - Génération de contenu prêt à copier-coller avec IA
 *
 * Transforme les opportunités en contenu concret que l'utilisateur peut
 * copier-coller directement sur son site sans avoir besoin d'un accès
 * en écriture de Reflet.
 *
 * Analyse le site réel de l'utilisateur pour générer des instructions
 * personnalisées au lieu de contenus génériques.
 */

import OpenAI from 'openai'
import { getClient } from '~/lib/openai'

const MODEL = 'gpt-5.6-luna'

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

export interface SiteContent {
  title?: string
  metaDescription?: string
  h1?: string
  bodyText?: string
  jsonLd?: any
  hasCanonical?: boolean
  canonicalUrl?: string
}

/**
 * Génère le contenu prêt à appliquer pour une opportunité donnée
 * avec analyse IA personnalisée basée sur le contenu réel du site
 */
export async function generateActionableContent(
  opportunity: {
    title: string
    reason: string
    proposed_direction?: string | null
    website_url?: string | null
  },
  siteContent: SiteContent | null = null,
  plan: 'free' | 'pro' = 'pro'
): Promise<ActionableContent | null> {
  const { title, reason, proposed_direction, website_url } = opportunity

  // robots.txt manquant ou corrigé
  if (title.toLowerCase().includes('robots.txt') || reason.toLowerCase().includes('robots.txt') ||
      (title.toLowerCase().includes('bot') && (reason.toLowerCase().includes('bloqué') || reason.toLowerCase().includes('disallow')))) {
    const content = await generateRobotsTxtWithAI(website_url, siteContent, plan)
    return {
      type: 'robots_txt',
      label: 'robots.txt complet',
      filename: 'robots.txt',
      content,
      instructions: 'Placez ce fichier à la racine de votre site (ex: https://votre-site.com/robots.txt)'
    }
  }

  // llms.txt manquant
  if (title.toLowerCase().includes('llms.txt') || reason.toLowerCase().includes('llms.txt')) {
    const content = await generateLlmsTxtWithAI(website_url, siteContent, plan)
    return {
      type: 'llms_txt',
      label: 'llms.txt complet',
      filename: 'llms.txt',
      content,
      instructions: 'Placez ce fichier à la racine de votre site (ex: https://votre-site.com/llms.txt)'
    }
  }

  // Meta description manquante
  if (title.toLowerCase().includes('meta') || title.toLowerCase().includes('description')) {
    const content = await generateMetaDescriptionWithAI(siteContent, title, reason, plan)
    return {
      type: 'meta_description',
      label: 'Meta description',
      content: `<meta name="description" content="${content}" />`,
      instructions: 'Ajoutez cette balise dans la section <head> de votre page HTML'
    }
  }

  // JSON-LD / Schema.org manquant
  if (title.toLowerCase().includes('schema') || title.toLowerCase().includes('json-ld') || title.toLowerCase().includes('structured data')) {
    const content = await generateJsonLdWithAI(website_url, siteContent, plan)
    return {
      type: 'json_ld',
      label: 'Snippet JSON-LD',
      content,
      instructions: 'Ajoutez ce script dans la section <head> de votre page HTML'
    }
  }

  // Page supprimée (redirect)
  if (title.toLowerCase().includes('page') && (title.toLowerCase().includes('supprimée') || title.toLowerCase().includes('removed'))) {
    const content = await generateRedirectWithAI(website_url, title, reason, plan)
    return {
      type: 'redirect_rule',
      label: 'Règle de redirection',
      content,
      instructions: 'Choisissez la méthode adaptée à votre hébergement et remplacez les URLs par les vôtres'
    }
  }

  // Contenu générique (proposed_direction) - amélioré avec IA
  if (proposed_direction) {
    const enhancedContent = await enhanceProposedDirectionWithAI(siteContent, title, reason, proposed_direction, plan)
    return {
      type: 'custom',
      label: 'Suggestion d\'amélioration',
      content: enhancedContent,
      instructions: reason
    }
  }

  return null
}

/**
 * Génère un robots.txt personnalisé avec IA
 */
async function generateRobotsTxtWithAI(
  websiteUrl: string | null | undefined,
  siteContent: SiteContent | null,
  plan: 'free' | 'pro'
): Promise<string> {
  const domain = websiteUrl || 'votre-site.com'
  const sitemap = `https://${domain}/sitemap.xml`

  // Si pas de contenu ou plan Free, retourne version standard
  if (!siteContent || plan === 'free') {
    return generateStandardRobotsTxt(domain, sitemap)
  }

  try {
    const client = getClient(plan)
    const prompt = `Tu es un expert SEO et accessibilité IA.

Analyse le contenu du site ${domain} et génère un robots.txt optimisé:

Informations du site:
- Titre: ${siteContent.title || 'Non défini'}
- Meta description: ${siteContent.metaDescription || 'Non définie'}
- H1: ${siteContent.h1 || 'Non défini'}
- Texte principal: ${siteContent.bodyText?.substring(0, 500) || 'Non disponible'}

Génère un robots.txt qui:
1. Autorise tous les bots d'IA importants (GPTBot, ChatGPT-User, ClaudeBot, Google-Extended)
2. Inclut le sitemap si pertinent
3. Bloque uniquement les sections admin/API si détectées dans le contenu
4. Ajoute des commentaires explicatifs pour l'utilisateur

Retourne UNIQUEMENT le contenu du fichier robots.txt, sans explication supplémentaire.`

    const response = await client.responses.create({
      model: MODEL,
      input: prompt,
      text: { format: { type: 'text' } }
    })

    const text = response.output?.[0]?.content?.[0]?.text || generateStandardRobotsTxt(domain, sitemap)
    return text.trim()
  } catch (err) {
    console.error('[actionable-content] Erreur génération robots.txt IA:', err)
    return generateStandardRobotsTxt(domain, sitemap)
  }
}

/**
 * Génère un llms.txt personnalisé avec IA
 */
async function generateLlmsTxtWithAI(
  websiteUrl: string | null | undefined,
  siteContent: SiteContent | null,
  plan: 'free' | 'pro'
): Promise<string> {
  const domain = websiteUrl || 'votre-site.com'

  // Si pas de contenu ou plan Free, retourne version standard
  if (!siteContent || plan === 'free') {
    return generateStandardLlmsTxt(domain)
  }

  try {
    const client = getClient(plan)
    const prompt = `Tu es un expert en accessibilité IA pour les LLM.

Analyse le contenu du site ${domain} et génère un llms.txt optimisé:

Informations du site:
- Titre: ${siteContent.title || 'Non défini'}
- Meta description: ${siteContent.metaDescription || 'Non définie'}
- H1: ${siteContent.h1 || 'Non défini'}
- Texte principal: ${siteContent.bodyText?.substring(0, 500) || 'Non disponible'}

Génère un llms.txt qui:
1. Présente clairement le site (title, description, url)
2. Liste les sections importantes pour l'indexation IA (homepage, about, contact, products, etc.)
3. Est basé sur la structure réelle détectée dans le contenu
4. Utilise le format standard du projet llms.txt

Retourne UNIQUEMENT le contenu du fichier llms.txt, sans explication supplémentaire.`

    const response = await client.responses.create({
      model: MODEL,
      input: prompt,
      text: { format: { type: 'text' } }
    })

    const text = response.output?.[0]?.content?.[0]?.text || generateStandardLlmsTxt(domain)
    return text.trim()
  } catch (err) {
    console.error('[actionable-content] Erreur génération llms.txt IA:', err)
    return generateStandardLlmsTxt(domain)
  }
}

/**
 * Génère une meta description personnalisée avec IA
 */
async function generateMetaDescriptionWithAI(
  siteContent: SiteContent | null,
  title: string,
  reason: string,
  plan: 'free' | 'pro'
): Promise<string> {
  // Si pas de contenu ou plan Free, utilise proposed_direction ou générique
  if (!siteContent || plan === 'free') {
    return 'Une description concise et attrayante de votre page (150-160 caractères)'
  }

  try {
    const client = getClient(plan)
    const prompt = `Tu es un expert SEO et copywriting.

Génère une meta description optimisée pour le site actuel:

Informations du site:
- Titre actuel: ${siteContent.title || 'Non défini'}
- Meta description actuelle: ${siteContent.metaDescription || 'Non définie'}
- H1: ${siteContent.h1 || 'Non défini'}
- Texte principal: ${siteContent.bodyText?.substring(0, 300) || 'Non disponible'}

Opportunité détectée: ${title}
Raison: ${reason}

Génère une meta description qui:
1. Est entre 150 et 160 caractères
2. Répond à l'opportunité détectée
3. Est attrayante et incite au clic
4. Reflète le contenu réel du site
5. Inclut les mots-clés pertinents

Retourne UNIQUEMENT la meta description (texte entre guillemets si nécessaire), sans autre explication.`

    const response = await client.responses.create({
      model: MODEL,
      input: prompt,
      text: { format: { type: 'text' } }
    })

    const text = response.output?.[0]?.content?.[0]?.text || 'Une description concise et attrayante de votre page (150-160 caractères)'
    return text.trim().replace(/^["']|["']$/g, '')
  } catch (err) {
    console.error('[actionable-content] Erreur génération meta description IA:', err)
    return 'Une description concise et attrayante de votre page (150-160 caractères)'
  }
}

/**
 * Génère un JSON-LD personnalisé avec IA
 */
async function generateJsonLdWithAI(
  websiteUrl: string | null | undefined,
  siteContent: SiteContent | null,
  plan: 'free' | 'pro'
): Promise<string> {
  const domain = websiteUrl || 'votre-site.com'

  // Si pas de contenu ou plan Free, retourne version standard
  if (!siteContent || plan === 'free') {
    return generateStandardJsonLd(domain)
  }

  try {
    const client = getClient(plan)
    const prompt = `Tu es un expert en données structurées Schema.org.

Génère un snippet JSON-LD optimisé pour le site ${domain}:

Informations du site:
- Titre: ${siteContent.title || 'Non défini'}
- Meta description: ${siteContent.metaDescription || 'Non définie'}
- H1: ${siteContent.h1 || 'Non défini'}
- JSON-LD existant: ${siteContent.jsonLd ? JSON.stringify(siteContent.jsonLd, null, 2) : 'Non'}
- URL canonique: ${siteContent.canonicalUrl || 'Non'}

Génère un JSON-LD qui:
1. Utilise le type approprié (Organization, Product, WebSite, etc.)
2. Est basé sur le contenu réel du site
3. Inclut les propriétés pertinentes (name, url, description, logo, sameAs)
4. Est valide et conforme à Schema.org
5. Est entouré de balises <script type="application/ld+json">

Retourne UNIQUEMENT le snippet JSON-LD complet, sans explication supplémentaire.`

    const response = await client.responses.create({
      model: MODEL,
      input: prompt,
      text: { format: { type: 'text' } }
    })

    const text = response.output?.[0]?.content?.[0]?.text || generateStandardJsonLd(domain)
    return text.trim()
  } catch (err) {
    console.error('[actionable-content] Erreur génération JSON-LD IA:', err)
    return generateStandardJsonLd(domain)
  }
}

/**
 * Génère des règles de redirection personnalisées avec IA
 */
async function generateRedirectWithAI(
  websiteUrl: string | null | undefined,
  title: string,
  reason: string,
  plan: 'free' | 'pro'
): Promise<string> {
  const domain = websiteUrl || 'votre-site.com'

  if (plan === 'free') {
    return generateStandardRedirect(domain)
  }

  try {
    const client = getClient(plan)
    const prompt = `Tu es un expert en gestion de sites web et redirections.

Génère des règles de redirection pour le site ${domain}:

Opportunité détectée: ${title}
Raison: ${reason}

Génère des exemples de redirection pour:
1. Apache (.htaccess)
2. Nginx
3. WordPress (via plugin ou functions.php)
4. Next.js (middleware.ts)
5. Un serveur générique

Les exemples doivent:
- Être clairs et prêts à copier-coller
- Inclure des commentaires explicatifs
- Être adaptés au contexte de l'opportunité
- Utiliser des URLs placeholder réalistes

Retourne UNIQUEMENT les exemples de code, sans explication supplémentaire.`

    const response = await client.responses.create({
      model: MODEL,
      input: prompt,
      text: { format: { type: 'text' } }
    })

    const text = response.output?.[0]?.content?.[0]?.text || generateStandardRedirect(domain)
    return text.trim()
  } catch (err) {
    console.error('[actionable-content] Erreur génération redirection IA:', err)
    return generateStandardRedirect(domain)
  }
}

/**
 * Améliore le proposed_direction avec IA
 */
async function enhanceProposedDirectionWithAI(
  siteContent: SiteContent | null,
  title: string,
  reason: string,
  proposedDirection: string,
  plan: 'free' | 'pro'
): Promise<string> {
  if (!siteContent || plan === 'free') {
    return proposedDirection
  }

  try {
    const client = getClient(plan)
    const prompt = `Tu es un expert en optimisation de contenu et SEO.

Améliore les instructions suivantes en les personnalisant au site actuel:

Informations du site:
- Titre: ${siteContent.title || 'Non défini'}
- Meta description: ${siteContent.metaDescription || 'Non définie'}
- H1: ${siteContent.h1 || 'Non défini'}
- Texte principal: ${siteContent.bodyText?.substring(0, 500) || 'Non disponible'}

Opportunité détectée: ${title}
Raison: ${reason}
Instructions actuelles: ${proposedDirection}

Améliore les instructions pour:
1. Être plus concrètes et actionnables
2. Être spécifiques au contenu réel du site
3. Inclure des exemples concrets basés sur le site
4. Être claires et faciles à suivre
5. Garder le même objectif mais être plus précis

Retourne UNIQUEMENT les instructions améliorées, sans explication supplémentaire.`

    const response = await client.responses.create({
      model: MODEL,
      input: prompt,
      text: { format: { type: 'text' } }
    })

    const text = response.output?.[0]?.content?.[0]?.text || proposedDirection
    return text.trim()
  } catch (err) {
    console.error('[actionable-content] Erreur amélioration proposed_direction IA:', err)
    return proposedDirection
  }
}

// === Fonctions de fallback (versions standard) ===

function generateStandardRobotsTxt(domain: string, sitemap: string): string {
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

function generateStandardLlmsTxt(domain: string): string {
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

function generateStandardJsonLd(domain: string): string {
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

function generateStandardRedirect(domain: string): string {
  return `# Exemple de redirection dans votre serveur web ou CMS
# Redirige l'ancienne URL vers une page pertinente

# Apache (.htaccess):
Redirect 301 /ancienne-page https://${domain}/nouvelle-page

# Nginx:
rewrite ^/ancienne-page$ https://${domain}/nouvelle-page permanent;

# WordPress (plugin redirection):
# Configurez via l'interface ou un plugin`
}
