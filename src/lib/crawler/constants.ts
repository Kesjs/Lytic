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
