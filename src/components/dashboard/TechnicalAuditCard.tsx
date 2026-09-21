import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, HelpCircle, Loader2, Gauge, ChevronDown, Lightbulb } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { cn } from '~/lib/utils'
import type { BotAccessData } from '~/lib/queries/bot-access'
import { IA_BOTS } from '~/lib/crawler/constants'
import { triggerSiteCrawl, processNextPage } from '~/lib/crawler/orchestrate'

interface Props {
  botAccess: BotAccessData | null
  pages: any[]
  brandId: string
}

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

  // 3. Extraction Homepage SEO / IA
  const homepage = pages.find((p) => p.status === 'ok')
  const extracted = homepage?.extracted_content

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
  }
}

// Points de chaque item (doit rester synchro avec computeAuditMetrics), pour
// hiérarchiser la synthèse "quels correctifs rapportent le plus de points".
const ITEM_POINTS = { bots: 30, llms: 20, jsonld: 15, altImages: 10, h1: 10, titleMeta: 10, canonical: 5 } as const

export function TechnicalAuditCard({ botAccess, pages, brandId }: Props) {
  const queryClient = useQueryClient()
  const [isChecking, setIsChecking] = useState(false)
  const [botsExpanded, setBotsExpanded] = useState(false)

  const checkMutation = useMutation({
    mutationFn: () => triggerSiteCrawl({ data: { brandId } }),
    onSuccess: async (result) => {
      setIsChecking(true)
      let done = false
      let runId = result.runId

      while (!done) {
        try {
          const res = await processNextPage({ data: { runId } })
          done = res.done
        } catch (err) {
          console.error(err)
          break
        }
      }

      setIsChecking(false)
      queryClient.invalidateQueries({ queryKey: ['bot-access'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-home'] })
      toast.success('Audit technique terminé')
    },
    onError: (err: Error) => {
      setIsChecking(false)
      toast.error(err.message || 'Erreur lors de la vérification')
    },
  })

  // ── Calcul du score et des métriques ───────────────────────────────────────
  const metrics = useMemo(() => computeAuditMetrics(botAccess, pages), [botAccess, pages])

  if (!botAccess || !metrics) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink-primary">Audit Technique IA</h2>
        <p className="mt-3 text-sm text-ink-muted">
          Reflet peut vérifier si votre site est techniquement optimisé pour les IA
          (accès bots, llms.txt, balisage Schema.org, structure H1...).
        </p>
        <button
          type="button"
          onClick={() => checkMutation.mutate()}
          disabled={checkMutation.isPending || isChecking}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink-secondary hover:text-ink-primary disabled:opacity-50"
        >
          {(checkMutation.isPending || isChecking) && <Loader2 className="size-3.5 animate-spin" />}
          {checkMutation.isPending || isChecking ? 'Audit en cours…' : "Lancer l'audit"}
        </button>
      </div>
    )
  }

  const { checkedAt, llmsTxtFound, bots } = botAccess
  const { score, hasJsonLd, hasOrganization, h1Count, hasUniqueH1, hasGoodTitle, hasDesc, hasGoodDesc, hasCanonical, imagesWithoutAlt, totalImages, schemaTypes } = metrics

  const scoreColor = score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-danger'
  const ScoreIcon = score >= 80 ? CheckCircle2 : score >= 50 ? HelpCircle : XCircle

  const allowedBotsCount = IA_BOTS.filter((bot) => bots[bot.id] === 'allowed').length
  const blockedBotsCount = IA_BOTS.filter((bot) => bots[bot.id] === 'blocked').length
  const botsRowStatus: 'allowed' | 'blocked' | 'unknown' =
    blockedBotsCount > 0 ? 'blocked' : allowedBotsCount === IA_BOTS.length ? 'allowed' : 'unknown'

  // Lignes reformulées en phrases d'action ("ce que ça veut dire" plutôt que
  // le nom technique du champ), avec points et une phrase expliquant
  // pourquoi ça compte pour les IA.
  type Row = { key: keyof typeof ITEM_POINTS; passed: boolean; label: string; why: string }
  const rows: Row[] = [
    {
      key: 'llms',
      passed: llmsTxtFound,
      label: llmsTxtFound ? 'Fichier llms.txt présent' : "Aucun fichier llms.txt",
      why: "Donne aux IA un résumé structuré de votre site, plus fiable qu'un crawl classique.",
    },
    {
      key: 'jsonld',
      passed: hasJsonLd && hasOrganization,
      label:
        hasJsonLd && hasOrganization
          ? 'Organisation/Produit balisée (JSON-LD)'
          : hasJsonLd
            ? "Le type d'organisation n'est pas précisé"
            : 'Aucun balisage JSON-LD',
      why: 'Le balisage structuré aide les IA à identifier qui vous êtes et ce que vous vendez.',
    },
    {
      key: 'h1',
      passed: hasUniqueH1,
      label: hasUniqueH1
        ? 'Titre principal (H1) unique'
        : h1Count === 0
          ? 'Aucun titre principal (H1) détecté'
          : `Plusieurs titres H1 sur la page (${h1Count})`,
      why: 'Un H1 unique et clair indique aux IA le sujet principal de la page.',
    },
    {
      key: 'titleMeta',
      passed: hasGoodTitle && hasGoodDesc,
      label:
        hasGoodTitle && hasGoodDesc
          ? 'Titre et description bien dimensionnés'
          : 'Titre ou description de page à retravailler',
      why: 'Un titre et une méta-description bien calibrés sont souvent repris tels quels par les IA.',
    },
    {
      key: 'canonical',
      passed: hasCanonical,
      label: hasCanonical ? 'URL de référence définie' : 'URL de référence par page manquante',
      why: 'Sans URL canonique, une IA peut hésiter entre plusieurs versions de la même page.',
    },
    {
      key: 'altImages',
      passed: imagesWithoutAlt === 0,
      label:
        imagesWithoutAlt === 0
          ? 'Toutes les images ont un texte alternatif'
          : `${imagesWithoutAlt} image${imagesWithoutAlt > 1 ? 's' : ''} sans texte alternatif`,
      why: 'Le texte alternatif est la seule façon pour une IA de "voir" le contenu de vos images.',
    },
  ]

  // Synthèse hiérarchisée : les correctifs qui rapportent le plus de points,
  // triés par valeur décroissante — pour dire d'abord ce qui compte le plus.
  const failedRows = rows.filter((r) => !r.passed).sort((a, b) => ITEM_POINTS[b.key] - ITEM_POINTS[a.key])
  const quickWins = failedRows.slice(0, 3)
  const quickWinsPoints = quickWins.reduce((sum, r) => sum + ITEM_POINTS[r.key], 0)

  return (
    <div className="rounded-lg border border-border bg-surface p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-primary">Audit Technique IA</h2>
          <div className="flex items-center gap-1.5">
            <ScoreIcon className={`size-4 ${scoreColor}`} />
            <span className={`text-sm font-bold ${scoreColor}`}>{score}/100</span>
          </div>
        </div>

        {quickWins.length > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-brand/5 border border-brand/20 px-3 py-2">
            <Lightbulb className="size-3.5 shrink-0 mt-0.5 text-brand" />
            <p className="text-xs text-ink-secondary">
              <span className="font-medium text-ink-primary">{quickWinsPoints} points à gagner rapidement : </span>
              {quickWins.map((r) => r.label).join(' · ')}
            </p>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {/* Bots Access — regroupés en une ligne de synthèse, détail dépliable */}
          <div>
            <button
              type="button"
              onClick={() => setBotsExpanded((v) => !v)}
              className="flex w-full items-center justify-between gap-1.5"
            >
              <span className="flex items-center gap-1.5">
                <StatusIcon status={botsRowStatus} />
                <span className="text-xs text-ink-primary">
                  Robots IA : {allowedBotsCount}/{IA_BOTS.length} autorisés
                </span>
              </span>
              <ChevronDown className={cn('size-3.5 text-ink-muted transition-transform', botsExpanded && 'rotate-180')} />
            </button>
            {botsExpanded && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 pl-5">
                {IA_BOTS.map((bot) => {
                  const status = bots[bot.id] ?? 'unknown'
                  return (
                    <div key={bot.id} className="flex items-center gap-1.5">
                      <StatusIcon status={status} />
                      <span className="text-xs text-ink-primary" title={bot.id}>{bot.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="h-px bg-border/60" />

          {/* Reste des vérifications, en phrases d'action + tooltip explicatif */}
          <ul className="space-y-2.5">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center gap-1.5">
                <StatusIcon status={r.passed ? 'allowed' : 'blocked'} />
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-ink-primary cursor-help" title={r.key === 'jsonld' ? schemaTypes.join(', ') : undefined}>
                      {r.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[220px] text-center">
                    {r.why}
                  </TooltipContent>
                </Tooltip>
                {!r.passed && (
                  <Link
                    to="/dashboard/opportunites"
                    className="ml-auto shrink-0 text-[10.5px] font-medium text-brand hover:underline"
                  >
                    Voir le correctif →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
        <p className="text-[11px] text-ink-muted">
          Dernier audit : {new Date(checkedAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        <button
          type="button"
          onClick={() => checkMutation.mutate()}
          disabled={checkMutation.isPending || isChecking}
          className="inline-flex items-center gap-1.5 rounded-md bg-elevated px-2 py-1 text-[11px] font-medium text-ink-secondary hover:text-ink-primary disabled:opacity-50 border border-border"
        >
          {(checkMutation.isPending || isChecking) ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Gauge className="size-3" />
          )}
          Re-tester
        </button>
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: 'allowed' | 'blocked' | 'unknown' }) {
  if (status === 'allowed') {
    return <CheckCircle2 className="size-3.5 text-success" />
  }
  if (status === 'blocked') {
    return <XCircle className="size-3.5 text-danger" />
  }
  return <HelpCircle className="size-3.5 text-warning" />
}
