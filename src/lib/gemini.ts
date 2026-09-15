// Client Gemini — parsing structuré des réponses OpenAI (§18.2bis du doc de conception).
// Modèle : gemini-3.7-flash (Flash stable génération Gemini 3, août 2026).
// Si indisponible, vérifier ai.google.dev/gemini-api/docs/models pour la version
// Flash stable la plus récente — pas Flash-Lite.
// JAMAIS d'import depuis un composant client — clé API serveur uniquement.

import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai'
import * as cheerio from 'cheerio'

const MODEL = 'gemini-3.7-flash'
const MAX_RETRIES = 2

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY non d\u00e9finie dans les variables d'environnement serveur.")
  return new GoogleGenerativeAI(apiKey)
}

/** Structure parsée retournée par Gemini pour une observation */
export interface ParsedObservation {
  brand_mentioned: boolean
  brand_recommended: boolean
  /** Rang de la marque dans la réponse (1-indexed). null si non mentionnée. */
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

// Schéma JSON strict transmis à Gemini pour forcer une réponse structurée
const RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    brand_mentioned: { type: SchemaType.BOOLEAN, description: 'La marque est-elle explicitement mentionnée dans la réponse ?' },
    brand_recommended: { type: SchemaType.BOOLEAN, description: 'La marque est-elle recommandée ou suggérée comme solution ?' },
    brand_position: {
      type: SchemaType.NUMBER,
      nullable: true,
      description: 'Rang de la marque dans la réponse (1 = première entité mentionnée). null si non mentionnée.',
    },
    competitors: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: "Nom exact de la marque concurrente telle qu'elle apparaît dans la réponse" },
          mentioned: { type: SchemaType.BOOLEAN },
          recommended: { type: SchemaType.BOOLEAN },
          position: { type: SchemaType.NUMBER, nullable: true, description: 'Rang dans la réponse. null si non mentionné.' },
          context_excerpt: {
            type: SchemaType.STRING,
            nullable: true,
            description: 'Courte citation (1-2 phrases) du texte original où ce concurrent est mentionné. null si non mentionné.',
          },
        },
        required: ['name', 'mentioned', 'recommended', 'position', 'context_excerpt'],
      },
      description: "Toutes les marques concurrentes identifi\u00e9es dans la r\u00e9ponse (hors la marque analys\u00e9e elle-m\u00eame)",
    },
  },
  required: ['brand_mentioned', 'brand_recommended', 'brand_position', 'competitors'],
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

/**
 * Analyse une réponse OpenAI brute avec Gemini pour extraire les données structurées.
 * Retry 2 tentatives avec backoff 1s.
 */
export async function analyzeWithGemini(
  rawAnswer: string,
  brandName: string,
  brandDomain: string,
  knownCompetitors: string[] = [],
): Promise<ParsedObservation> {
  const client = getClient()
  const prompt = buildPrompt(rawAnswer, brandName, brandDomain, knownCompetitors)
  let lastError: unknown

  const modelsToTry = [MODEL, 'gemini-2.5-flash-lite']

  for (const modelName of modelsToTry) {
    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    })

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1000))
      }

      try {
        const result = await model.generateContent(prompt)
        const text = result.response.text()
        const parsed = JSON.parse(text) as ParsedObservation

        // Normalisation défensive
        return {
          brand_mentioned: Boolean(parsed.brand_mentioned),
          brand_recommended: Boolean(parsed.brand_recommended),
          brand_position: parsed.brand_position != null ? Number(parsed.brand_position) : null,
          competitors: (parsed.competitors ?? []).map((c) => ({
            name: String(c.name),
            mentioned: Boolean(c.mentioned),
            recommended: Boolean(c.recommended),
            position: c.position != null ? Number(c.position) : null,
            context_excerpt: c.context_excerpt ?? null,
          })),
        }
      } catch (err) {
        lastError = err
      }
    }
  }

  throw lastError
}

export async function generateBrandQuestions(brandName: string, websiteUrl: string): Promise<string[]> {
  const client = getClient()
  
  // Tente de récupérer le contenu du site pour donner du contexte à l'IA
  let websiteContext = ''
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    // Ajout d'un faux User-Agent pour éviter certains blocages basiques
    const response = await fetch(websiteUrl, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    })
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const html = await response.text()
      const $ = cheerio.load(html)
      $('script, style, noscript, iframe, img, svg, video, nav, footer').remove()
      const text = $('body').text().replace(/\s+/g, ' ').trim()
      websiteContext = text.substring(0, 3000) // On limite la taille pour ne pas exploser le prompt
    }
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
- Retourne uniquement le tableau JSON de 5 questions.`

  let lastError: unknown
  const modelsToTry = [MODEL, 'gemini-2.5-flash-lite']

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1000))
      }
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: 'Liste de 3 à 5 questions que les prospects posent à une IA concernant cette marque ou ce domaine.',
            },
          },
        })

        const result = await model.generateContent(prompt)
        const text = result.response.text()
        const parsed = JSON.parse(text) as string[]
        return parsed.slice(0, 5)
      } catch (err) {
        lastError = err
      }
    }
  }

  throw lastError
}
