// Client OpenAI — Responses API (§7.3 du doc de conception).
// Modèle : gpt-5.6-luna (famille GPT-5.6, juillet 2026 — décision fixée dans le doc,
// ne pas remplacer sans vérifier les docs OpenAI à la date d'implémentation).
// Si gpt-5.6-luna ne retourne pas de citations url_citation avec web_search activé
// pour ce tier précis, replier sur gpt-5.6-terra (tier supérieur, mêmes docs).
// JAMAIS d'import depuis un composant client ou une route — clé API serveur uniquement.

import OpenAI from 'openai'
import type { ResponseOutputText } from 'openai/resources/responses/responses'

const MODEL = 'gpt-5.6-luna'
const TIMEOUT_MS = 90_000 // 90s — appels web_search peuvent prendre 10–60s
const MAX_RETRIES = 3

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY non d\u00e9finie dans les variables d'environnement serveur.")
  return new OpenAI({ apiKey, timeout: TIMEOUT_MS, maxRetries: 0 }) // retries gérés manuellement
}

export interface OpenAIQueryResult {
  text: string
  /** URLs citées par le modèle via web_search — utilisées pour isBrandCited() */
  citations: string[]
}

/** Extrait les URLs citées dans une réponse Responses API */
function extractCitations(response: OpenAI.Responses.Response): string[] {
  const urls: string[] = []
  for (const item of response.output ?? []) {
    if (item.type === 'message') {
      for (const part of item.content ?? []) {
        if (part.type === 'output_text') {
          for (const annotation of (part as ResponseOutputText).annotations ?? []) {
            if (annotation.type === 'url_citation') {
              urls.push(annotation.url)
            }
          }
        }
      }
    }
  }
  return urls
}

/** Extrait le texte brut d'une réponse Responses API */
function extractText(response: OpenAI.Responses.Response): string {
  for (const item of response.output ?? []) {
    if (item.type === 'message') {
      for (const part of item.content ?? []) {
        if (part.type === 'output_text') {
          return (part as ResponseOutputText).text ?? ''
        }
      }
    }
  }
  return ''
}

/**
 * Pose une question à ChatGPT avec web_search activé, en mode stateless.
 * Retourne le texte de la réponse + les URLs citées séparément.
 *
 * Retry exponentiel : 3 tentatives, backoff 1s / 2s / 4s.
 */
export async function runOpenAIQuery(question: string): Promise<OpenAIQueryResult> {
  const client = getClient()
  let lastError: unknown

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoffMs = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s
      await new Promise((r) => setTimeout(r, backoffMs))
    }

    try {
      const response = await client.responses.create({
        model: MODEL,
        input: question,
        tools: [{ type: 'web_search' }],
      })

      const text = extractText(response)
      const citations = extractCitations(response)
      return { text, citations }
    } catch (err) {
      lastError = err
      console.error(`[openai] Erreur API OpenAI (tentative ${attempt + 1}/${MAX_RETRIES}):`, err)
      // Ne pas réessayer sur les erreurs 4xx (paramètres invalides, quota, etc.)
      if (err instanceof OpenAI.APIError && err.status >= 400 && err.status < 500) {
        throw err
      }
    }
  }

  throw lastError
}
