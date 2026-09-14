import { fetchSafe } from './fetch-safe'

// ─── User-Agent centralisé ────────────────────────────────────────────────────
// Utilisé partout dans le crawler. Si le domaine change un jour, un seul endroit
// à mettre à jour.
export const REFLET_UA = 'RefletBot/1.0'

// ─── Bots IA connus ───────────────────────────────────────────────────────────
// Liste des user-agents des principaux crawlers IA — utilisée à la fois pour
// vérifier les règles robots.txt (chantier B) et pour les diagnostics produit.
export const IA_BOTS = [
  { id: 'GPTBot',         label: 'ChatGPT (GPTBot)',      ua: 'GPTBot' },
  { id: 'ChatGPT-User',   label: 'ChatGPT (navigation)',  ua: 'ChatGPT-User' },
  { id: 'ClaudeBot',      label: 'Claude (Anthropic)',    ua: 'ClaudeBot' },
  { id: 'anthropic-ai',   label: 'Claude (anthropic-ai)', ua: 'anthropic-ai' },
  { id: 'Google-Extended',label: 'Google Gemini',         ua: 'Google-Extended' },
  { id: 'PerplexityBot',  label: 'Perplexity AI',         ua: 'PerplexityBot' },
  { id: 'CCBot',          label: 'Common Crawl',          ua: 'CCBot' },
  { id: 'Bytespider',     label: 'ByteDance / TikTok',    ua: 'Bytespider' },
  { id: 'Amazonbot',      label: 'Amazon Alexa',          ua: 'Amazonbot' },
] as const

export type IaBotId = (typeof IA_BOTS)[number]['id']
export type BotAccess = 'allowed' | 'blocked' | 'unknown'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Règles extraites du robots.txt pour un user-agent donné */
export interface RobotsRules {
  /** Préfixes de chemins interdits (ex. ["/admin/", "/private"]) */
  disallowed: string[]
  /** Préfixes de chemins explicitement autorisés (prioritaires sur Disallow) */
  allowed: string[]
  /**
   * Délai entre requêtes en ms. Dérivé du champ `Crawl-delay` (en secondes),
   * plafonné à 10 000 ms. Null = non spécifié, l'orchestrateur utilisera 800 ms.
   */
  crawlDelayMs: number | null
  /** URLs de sitemaps trouvées dans le robots.txt */
  sitemaps: string[]
}

export interface BotAccessResult {
  checkedAt: string
  llmsTxtFound: boolean
  /** Statut pour chaque bot IA : allowed / blocked / unknown */
  bots: Record<IaBotId, BotAccess>
}

// ─── Parsing robots.txt ───────────────────────────────────────────────────────

/**
 * Parse le contenu d'un robots.txt et retourne les règles applicables à
 * `targetUa` (ou `*` si aucune règle spécifique n'existe).
 *
 * Logique de priorité (conforme aux specs Google) :
 * - On prend le bloc `User-agent: <targetUa>` s'il existe.
 * - Sinon le bloc `User-agent: *`.
 * - `Allow:` est prioritaire sur `Disallow:` quand les deux matchent un chemin.
 */
export function parseRobotsTxt(content: string, targetUa: string): RobotsRules {
  const lines = content.split('\n').map((l) => l.split('#')[0].trim()).filter(Boolean)

  // Découper en blocs par agent
  const blocks: { agents: string[]; disallowed: string[]; allowed: string[]; crawlDelay: number | null }[] = []
  let current: typeof blocks[number] | null = null

  for (const line of lines) {
    const lower = line.toLowerCase()

    if (lower.startsWith('user-agent:')) {
      const agent = line.slice('user-agent:'.length).trim()
      if (current && current.agents.length > 0 && !current.disallowed.length && !current.allowed.length) {
        // Ligne User-agent consécutive → même bloc
        current.agents.push(agent)
      } else {
        current = { agents: [agent], disallowed: [], allowed: [], crawlDelay: null }
        blocks.push(current)
      }
    } else if (lower.startsWith('disallow:') && current) {
      const path = line.slice('disallow:'.length).trim()
      if (path) current.disallowed.push(path)
    } else if (lower.startsWith('allow:') && current) {
      const path = line.slice('allow:'.length).trim()
      if (path) current.allowed.push(path)
    } else if (lower.startsWith('crawl-delay:') && current) {
      const val = parseFloat(line.slice('crawl-delay:'.length).trim())
      if (!isNaN(val)) current.crawlDelay = Math.min(val * 1000, 10_000) // cap 10s
    }
  }

  // Sitemaps (hors blocs user-agent)
  const sitemaps: string[] = []
  for (const line of lines) {
    if (line.toLowerCase().startsWith('sitemap:')) {
      const url = line.slice('sitemap:'.length).trim()
      if (url) sitemaps.push(url)
    }
  }

  // Sélectionner le bloc le plus spécifique
  const specific = blocks.find((b) => b.agents.some((a) => a.toLowerCase() === targetUa.toLowerCase()))
  const wildcard = blocks.find((b) => b.agents.includes('*'))
  const selected = specific ?? wildcard

  return {
    disallowed: selected?.disallowed ?? [],
    allowed: selected?.allowed ?? [],
    crawlDelayMs: selected?.crawlDelay ?? null,
    sitemaps,
  }
}

/**
 * Détermine si une URL est autorisée selon les règles robots.txt.
 * Retourne true (autorisé) par défaut si aucune règle ne matche.
 */
export function isAllowed(url: string, rules: RobotsRules): boolean {
  let pathname: string
  try {
    pathname = new URL(url).pathname
  } catch {
    return true
  }

  // Trouver le préfixe le plus long qui matche (règle Google : spécificité)
  let longestDisallow = ''
  let longestAllow = ''

  for (const d of rules.disallowed) {
    if (pathname.startsWith(d) && d.length > longestDisallow.length) {
      longestDisallow = d
    }
  }
  for (const a of rules.allowed) {
    if (pathname.startsWith(a) && a.length > longestAllow.length) {
      longestAllow = a
    }
  }

  if (!longestDisallow) return true           // Aucune règle Disallow → OK
  if (longestAllow.length >= longestDisallow.length) return true  // Allow plus spécifique → OK
  return false
}

// ─── Fetch + parse du robots.txt ─────────────────────────────────────────────

/**
 * Récupère et parse le robots.txt du domaine.
 * Retourne des règles vides (tout autorisé) en cas d'erreur ou de 404.
 */
export async function fetchRobots(baseUrl: string): Promise<RobotsRules> {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).toString()
    const res = await fetchSafe(robotsUrl, {
      timeoutMs: 5_000,
      headers: { 'User-Agent': REFLET_UA },
    })
    if (res.status >= 400) {
      return { disallowed: [], allowed: [], crawlDelayMs: null, sitemaps: [] }
    }
    return parseRobotsTxt(res.text, 'RefletBot')
  } catch {
    return { disallowed: [], allowed: [], crawlDelayMs: null, sitemaps: [] }
  }
}

// ─── Diagnostic bots IA ───────────────────────────────────────────────────────

/**
 * Analyse l'accès des bots IA majeurs depuis le robots.txt du domaine.
 * Vérifie également la présence d'un llms.txt à la racine.
 *
 * Le résultat est stocké dans `brand_bot_access` (upsert par brand_id).
 * Appelé une seule fois par run dans `triggerSiteCrawl`.
 */
export async function checkBotAccess(baseUrl: string): Promise<BotAccessResult> {
  const robotsUrl = new URL('/robots.txt', baseUrl).toString()
  let robotsContent = ''

  try {
    const res = await fetchSafe(robotsUrl, {
      timeoutMs: 5_000,
      headers: { 'User-Agent': REFLET_UA },
    })
    if (res.status < 400) robotsContent = res.text
  } catch {
    // robots.txt inaccessible → tout unknown
  }

  // Vérifier llms.txt
  let llmsTxtFound = false
  try {
    const llmsUrl = new URL('/llms.txt', baseUrl).toString()
    const llmsRes = await fetchSafe(llmsUrl, {
      timeoutMs: 3_000,
      headers: { 'User-Agent': REFLET_UA },
    })
    llmsTxtFound = llmsRes.status >= 200 && llmsRes.status < 400
  } catch {
    // pas de llms.txt accessible
  }

  // Analyser l'accès pour chaque bot IA
  const bots = {} as Record<IaBotId, BotAccess>

  for (const bot of IA_BOTS) {
    if (!robotsContent) {
      bots[bot.id] = 'unknown'
      continue
    }

    const rules = parseRobotsTxt(robotsContent, bot.ua)

    // Si aucune règle spécifique et aucune wildcard → unknown
    const hasSpecificBlock = robotsContent
      .toLowerCase()
      .includes(`user-agent: ${bot.ua.toLowerCase()}`)

    if (!hasSpecificBlock && rules.disallowed.length === 0) {
      // Vérifier si wildcard couvre quelque chose
      const wildcardRules = parseRobotsTxt(robotsContent, '*')
      if (wildcardRules.disallowed.includes('/')) {
        bots[bot.id] = 'blocked'
      } else if (wildcardRules.disallowed.length === 0) {
        bots[bot.id] = 'unknown'
      } else {
        // Wildcard avec quelques disallow partiels → allowed (root accessible)
        bots[bot.id] = isAllowed(baseUrl, wildcardRules) ? 'allowed' : 'blocked'
      }
      continue
    }

    // `Disallow: /` = tout bloqué
    const isFullyBlocked = rules.disallowed.includes('/')
    if (isFullyBlocked) {
      bots[bot.id] = 'blocked'
    } else if (rules.disallowed.length === 0 && rules.allowed.length === 0 && hasSpecificBlock) {
      // Bloc spécifique vide → bot explicitement autorisé
      bots[bot.id] = 'allowed'
    } else {
      bots[bot.id] = isAllowed(baseUrl, rules) ? 'allowed' : 'blocked'
    }
  }

  return {
    checkedAt: new Date().toISOString(),
    llmsTxtFound,
    bots,
  }
}
