import OpenAI from 'openai'
import * as cheerio from 'cheerio'
import { fetchSafe } from '~/lib/crawler/fetch-safe'
import type { ResponseOutputText } from 'openai/resources/responses/responses'

const MODEL = 'gpt-5.6-luna'
const MAX_RETRIES = 3

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY non définie dans les variables d'environnement serveur.")
  return new OpenAI({ apiKey, maxRetries: 0 }) 
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

export interface ParsedObservation {
  brand_mentioned: boolean
  brand_recommended: boolean
  brand_position: number | null
  competitors: ParsedCompetitor[]
}

export interface ParsedCompetitor {
  name: string
  mentioned: boolean
  recommended: boolean
  position: number | null
  context_excerpt: string | null
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    brand_mentioned: { type: "boolean", description: "La marque est-elle explicitement mentionnée dans la réponse ?" },
    brand_recommended: { type: "boolean", description: "La marque est-elle recommandée ou suggérée comme solution ?" },
    brand_position: {
      type: ["number", "null"],
      description: "Rang de la marque dans la réponse (1 = première entité mentionnée). null si non mentionnée.",
    },
    competitors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nom exact de la marque concurrente telle qu'elle apparaît dans la réponse" },
          mentioned: { type: "boolean" },
          recommended: { type: "boolean" },
          position: { type: ["number", "null"], description: "Rang dans la réponse. null si non mentionné." },
          context_excerpt: {
            type: ["string", "null"],
            description: "Courte citation (1-2 phrases) du texte original où ce concurrent est mentionné. null si non mentionné.",
          },
        },
        required: ["name", "mentioned", "recommended", "position", "context_excerpt"],
        additionalProperties: false,
      },
      description: "Toutes les marques concurrentes identifiées dans la réponse (hors la marque analysée elle-même)",
    },
  },
  required: ["brand_mentioned", "brand_recommended", "brand_position", "competitors"],
  additionalProperties: false,
}

function buildPrompt(rawAnswer: string, brandName: string, brandDomain: string, knownCompetitors: string[]): string {
  const knownList = knownCompetitors.length
    ? `\nConcurrents déjà connus pour cette marque (réutilise ces noms exacts si tu les reconnais dans la réponse, ne les renomme pas et n'en change pas légèrement l'orthographe) :\n- ${knownCompetitors.join('\n- ')}\n`
    : ''

  return `Tu es un analyseur de réponses IA spécialisé dans la visibilité de marque.

Analyse la réponse suivante d'un assistant IA et extrais les informations de visibilité pour la marque "${brandName}" (domaine : ${brandDomain}).

Règles strictes :
- brand_mentioned = true uniquement si le nom de la marque ou son domaine est explicitement écrit dans la réponse
- brand_recommended = true uniquement si la marque est suggérée comme solution, produit ou service à utiliser
- brand_position = rang de la marque parmi toutes les entités nommées (1 = premier nommé), null si non mentionnée
- competitors = TOUTES les autres marques/produits nommés dans la réponse (pas la marque analysée)
- context_excerpt = courte citation (1-2 phrases) du texte original où le concurrent est mentionné, null si non mentionné
- Ne pas inventer de concurrents absents de la réponse
${knownList}
Réponse IA à analyser :
---
${rawAnswer}
---`
}

export async function analyzeAnswer(
  rawAnswer: string,
  brandName: string,
  brandDomain: string,
  knownCompetitors: string[] = [],
): Promise<ParsedObservation> {
  const client = getClient()
  const prompt = buildPrompt(rawAnswer, brandName, brandDomain, knownCompetitors)
  let lastError: unknown

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoffMs = 1000 * Math.pow(2, attempt - 1)
      await new Promise((r) => setTimeout(r, backoffMs))
    }

    try {
      const response = await client.responses.create({
        model: MODEL,
        input: prompt,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "parsed_observation",
            schema: RESPONSE_SCHEMA,
            strict: true
          }
        }
      })

      const text = extractText(response)
      const parsed = JSON.parse(text) as ParsedObservation
      return parsed
    } catch (err) {
      lastError = err
      if (err instanceof OpenAI.APIError && err.status >= 400 && err.status < 500) {
        throw err
      }
    }
  }

  throw lastError
}

const QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: { type: "string" },
      description: "Liste de 3 à 5 questions que les prospects posent à une IA concernant cette marque ou ce domaine.",
    }
  },
  required: ["questions"],
  additionalProperties: false
}

export async function generateBrandQuestions(brandName: string, websiteUrl: string): Promise<string[]> {
  const client = getClient()
  
  let websiteContext = ''
  try {
    const { text: html } = await fetchSafe(websiteUrl, { timeoutMs: 5000 })
    const $ = cheerio.load(html)
    $('script, style, noscript, iframe, img, svg, video, nav, footer').remove()
    const text = $('body').text().replace(/\s+/g, ' ').trim()
    websiteContext = text.substring(0, 3000)
  } catch (err) {
    console.warn(`Impossible de scraper ${websiteUrl} pour le contexte:`, err)
  }

  const contextPrompt = websiteContext 
    ? `\n\nVoici le contenu extrait de leur page d'accueil pour comprendre exactement ce qu'ils font :\n"""\n${websiteContext}\n"""\n\nUtilise ce contexte pour générer des questions ultra-ciblées sur leur VRAIE activité, et non des questions génériques.` 
    : ''

  const prompt = `Tu es un expert en marketing IA. Génère 5 questions ultra-pertinentes qu'un utilisateur humain poserait naturellement à ChatGPT pour se renseigner sur la marque "${brandName}" (Site web : ${websiteUrl}). Les questions doivent tester si l'IA connaît la marque et la recommande par rapport à ses concurrents.${contextPrompt}

Exemples de bonnes questions (naturelles) :
- "Avis sur ${brandName}, est-ce que c'est fiable ?"
- "Je cherche un [leur vrai service/produit], tu connais ${brandName} ?"
- "Quelles sont les meilleures alternatives à [Concurrent principal] ?"
Règles :
- Les questions doivent être naturelles, comme si un humain tapait sur son clavier.
- Interdiction d'utiliser des formulations robotiques comme "Qu'est-ce que la plateforme...".
- Pas plus de 300 caractères par question.
- Retourne uniquement un tableau JSON de 5 questions.`

  let lastError: unknown
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoffMs = 1000 * Math.pow(2, attempt - 1)
      await new Promise((r) => setTimeout(r, backoffMs))
    }
    try {
      const response = await client.responses.create({
        model: MODEL,
        input: prompt,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "brand_questions",
            schema: QUESTIONS_SCHEMA,
            strict: true
          }
        }
      })

      const text = extractText(response)
      const parsed = JSON.parse(text) as { questions: string[] }
      
      const questions = (parsed.questions || [])
        .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
        .map((q) => q.trim())
        .slice(0, 5)
        
      if (questions.length === 0) throw new Error('OpenAI n\'a retourné aucune question exploitable.')
      return questions
    } catch (err) {
      lastError = err
      if (err instanceof OpenAI.APIError && err.status >= 400 && err.status < 500) {
        throw err
      }
    }
  }

  throw lastError
}

export interface ParsedOpportunity {
  title: string
  priority: 'low' | 'medium' | 'high'
  confidence: number
  reason: string
  proposed_direction: string
}

const OPPORTUNITIES_SCHEMA = {
  type: "object",
  properties: {
    opportunities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Titre court et actionnable de l'opportunité" },
          priority: { type: "string", enum: ['low', 'medium', 'high'] },
          confidence: { type: "number", description: "Score de confiance de 0 à 100" },
          reason: { type: "string", description: "Pourquoi cette opportunité est importante, avec des preuves basées sur la réponse IA" },
          proposed_direction: { type: "string", description: "Que faut-il faire sur le site web pour saisir cette opportunité (ex: page cible, élément, action)" },
        },
        required: ['title', 'priority', 'confidence', 'reason', 'proposed_direction'],
        additionalProperties: false
      }
    }
  },
  required: ["opportunities"],
  additionalProperties: false
}

export async function generateOpportunities(context: string, brandName: string, websiteUrl: string): Promise<ParsedOpportunity[]> {
  const client = getClient()
  const prompt = `Tu es un expert en SEO (Optimisation pour Moteurs de Recherche) spécialisé dans les IA génératives (AIO).
Ton client est la marque "${brandName}" (Site web: ${websiteUrl}).
Nous avons posé plusieurs questions à ChatGPT et notre marque n'a pas été recommandée.

Voici le contexte des réponses :
${context}

Analyse ces réponses, identifie les concurrents recommandés et trouve POURQUOI ils sont préférés.
Propose des opportunités d'amélioration pour le site web de notre marque pour pallier ces manques.
Chaque opportunité doit être une recommandation actionnable : quelle page modifier, quel élément cibler, et la direction proposée.`

  let lastError: unknown
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoffMs = 1000 * Math.pow(2, attempt - 1)
      await new Promise((r) => setTimeout(r, backoffMs))
    }
    try {
      const response = await client.responses.create({
        model: MODEL,
        input: prompt,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "opportunities",
            schema: OPPORTUNITIES_SCHEMA,
            strict: true
          }
        }
      })

      const text = extractText(response)
      const parsed = JSON.parse(text) as { opportunities: ParsedOpportunity[] }
      return parsed.opportunities || []
    } catch (err) {
      lastError = err
      if (err instanceof OpenAI.APIError && err.status >= 400 && err.status < 500) {
        throw err
      }
    }
  }

  throw lastError
}
