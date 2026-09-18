// Client Perplexity — Sonar API, chat completions endpoint (compatible
// OpenAI-style body : { model, messages }). Contrat de retour identique à
// runOpenAIQuery() (openai.ts) pour que measure.ts puisse traiter les deux
// moteurs de façon interchangeable dans la même boucle.
//
// Modèle : 'sonar' (le tier de base, PAS 'sonar-pro') — choix volontairement
// économique : $1/1M tokens in+out + un frais fixe par requête (~$5/1000 en
// search_context_size 'low'), très inférieur au coût d'un modèle "pro".
// Vérifier https://docs.perplexity.ai avant de changer de tier : si jamais
// on veut plus de profondeur de recherche, passer search_context_size à
// 'medium' plutôt que de changer de modèle (impact coût moindre).
//
// JAMAIS d'import depuis un composant client ou une route — clé API serveur
// uniquement (même règle que openai.ts).

const MODEL = 'sonar'
const API_URL = 'https://api.perplexity.ai/chat/completions'
const TIMEOUT_MS = 90_000
const MAX_RETRIES = 3

export interface PerplexityQueryResult {
  text: string
  /** URLs citées — Perplexity les retourne nativement, pas besoin de les extraire d'annotations */
  citations: string[]
  usage: {
    inputTokens: number
    outputTokens: number
  }
  model: string
}

function getApiKey(): string {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) throw new Error("Clé API Perplexity non définie (PERPLEXITY_API_KEY) dans les variables d'environnement serveur.")
  return apiKey
}

/**
 * Pose une question à Perplexity (Sonar) avec recherche web native, en mode
 * stateless. Retourne le texte de la réponse + les URLs citées séparément —
 * même forme que runOpenAIQuery() pour rester interchangeable côté appelant.
 *
 * Retry exponentiel : 3 tentatives, backoff 1s / 2s / 4s (même politique
 * que openai.ts, pour un comportement cohérent entre moteurs).
 */
export async function runPerplexityQuery(question: string): Promise<PerplexityQueryResult> {
  const apiKey = getApiKey()
  let lastError: unknown

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoffMs = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s
      await new Promise((r) => setTimeout(r, backoffMs))
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'user', content: question }],
          // 'low' = le moins de contexte web récupéré = frais par requête
          // le plus bas du tier Sonar. Suffisant : on pose une question
          // factuelle courte, pas une recherche approfondie.
          web_search_options: { search_context_size: 'low' },
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        const err = new Error(`Erreur API Perplexity ${response.status}: ${body}`) as Error & { status?: number }
        err.status = response.status
        throw err
      }

      const data = await response.json()
      const text: string = data?.choices?.[0]?.message?.content ?? ''
      const citations: string[] = Array.isArray(data?.citations) ? data.citations : []
      const usage = {
        inputTokens: data?.usage?.prompt_tokens ?? 0,
        outputTokens: data?.usage?.completion_tokens ?? 0,
      }

      return { text, citations, usage, model: data?.model ?? MODEL }
    } catch (err) {
      lastError = err
      console.error(`[perplexity] Erreur API Perplexity (tentative ${attempt + 1}/${MAX_RETRIES}):`, err)
      // Ne pas réessayer sur les erreurs 4xx (clé invalide, quota, paramètres) — même logique que openai.ts
      const status = (err as { status?: number })?.status
      if (typeof status === 'number' && status >= 400 && status < 500) {
        throw err
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError
}
