import type { BotAccessData } from '~/lib/queries/bot-access'

// Extrait de src/components/dashboard/TechnicalAuditCard.tsx (§27) : logique
// pure, sans dépendance React, pour pouvoir être appelée aussi bien côté UI
// (TechnicalAuditCard, audit-technique.tsx) que côté serveur juste après un
// crawl (orchestrate.ts), afin d'historiser le score dans
// site_crawl_runs.audit_score au lieu de le recalculer à la volée à chaque
// affichage sans jamais le stocker.
export function computeAuditMetrics(botAccess: BotAccessData | null, pages: any[]) {
  if (!botAccess) return null

  // 1. Bot Access (30 points)
  const botsToCheck = ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Google-Extended']
  let allowedBots = 0
  let blockedBots = 0
  botsToCheck.forEach(b => {
    if (botAccess.bots[b] === 'allowed') allowedBots++
    if (botAccess.bots[b] === 'blocked') blockedBots++
  })
  const botsScore = blockedBots === 0 ? 30 : Math.max(0, 30 - blockedBots * 10)

  // 2. llms.txt (20 points)
  const llmsScore = botAccess.llmsTxtFound ? 20 : 0

  // 3. Extraction Homepage SEO / IA — on préfère une page dont le rendu SPA
  // a réussi ; à défaut on retombe sur la 1ère 'ok' quand même (cf. §26).
  const homepage =
    pages.find((p) => p.status === 'ok' && !(p.extracted_content as any)?.renderIncomplete) ??
    pages.find((p) => p.status === 'ok')
  const extracted = homepage?.extracted_content
  const homepageRenderIncomplete = !!(extracted as any)?.renderIncomplete

  // 4. JSON-LD (15 points)
  const hasJsonLd = extracted?.jsonLd ?? false
  const schemaTypes = extracted?.schemaTypes ?? []
  const hasOrganization = schemaTypes.includes('Organization') || schemaTypes.includes('Product')
  const jsonLdScore = hasJsonLd && hasOrganization ? 15 : hasJsonLd ? 8 : 0

  // 5. H1 Unique (10 points)
  const h1Count = extracted?.h1Count ?? 0
  const hasUniqueH1 = extracted?.hasUniqueH1 ?? false
  const h1Score = hasUniqueH1 ? 10 : h1Count === 0 ? 0 : 3

  // 6. Title / Meta Desc (10 points)
  const titleLength = extracted?.titleLength ?? 0
  const hasDesc = extracted?.hasMetaDescription ?? false
  const hasGoodTitle = titleLength >= 30 && titleLength <= 65
  const hasGoodDesc = extracted?.metaDescriptionLength >= 120 && extracted?.metaDescriptionLength <= 160
  let titleMetaScore = 0
  if (hasGoodTitle && hasGoodDesc) titleMetaScore = 10
  else if (hasGoodTitle || hasDesc) titleMetaScore = 5

  // 7. Canonical (5 points)
  const hasCanonical = extracted?.hasCanonical ?? false
  const canonicalScore = hasCanonical ? 5 : 0

  // 8. Images Alt (10 points)
  const imagesWithoutAlt = extracted?.imagesWithoutAlt ?? 0
  const totalImages = extracted?.totalImages ?? 0
  const altScore = totalImages > 0 && imagesWithoutAlt === 0 ? 10 : Math.max(0, 10 - imagesWithoutAlt * 2)

  const totalScore = botsScore + llmsScore + jsonLdScore + h1Score + titleMetaScore + canonicalScore + altScore

  // Valeurs brutes extraites (pas des booléens dérivés) — uniquement pour
  // affichage : permettent à l'UI de montrer ce qui a réellement été trouvé
  // sur le site audité (titre, H1, URL de la page) plutôt qu'un simple ✅/❌
  // dont rien ne prouve à l'utilisateur qu'il porte bien sur son propre site.
  const pageUrl: string | null = homepage?.url ?? null
  const rawTitle: string | null = extracted?.title ?? null
  const rawFirstHeading: string | null = extracted?.headings?.[0] ?? null

  return {
    score: totalScore,
    botsScore,
    hasJsonLd,
    hasOrganization,
    h1Count,
    hasUniqueH1,
    hasGoodTitle,
    hasDesc,
    hasGoodDesc,
    hasCanonical,
    imagesWithoutAlt,
    totalImages,
    schemaTypes,
    homepageRenderIncomplete,
    pageUrl,
    rawTitle,
    rawFirstHeading,
  }
}

// Points de chaque item (doit rester synchro avec computeAuditMetrics), pour
// hiérarchiser la synthèse "quels correctifs rapportent le plus de points".
export const ITEM_POINTS = { bots: 30, llms: 20, jsonld: 15, altImages: 10, h1: 10, titleMeta: 10, canonical: 5 } as const
