import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, HelpCircle, Loader2, Gauge } from 'lucide-react'
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

export function TechnicalAuditCard({ botAccess, pages, brandId }: Props) {
  const queryClient = useQueryClient()
  const [isChecking, setIsChecking] = useState(false)

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

        <div className="mt-5 space-y-4">
          {/* Bots Access */}
          <div>
            <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider mb-2">Accès Robots.txt</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
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
          </div>

          <div className="h-px bg-border/60" />

          {/* Standards & Structure */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider mb-2">Standards IA</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-1.5">
                  <StatusIcon status={llmsTxtFound ? 'allowed' : 'blocked'} />
                  <span className="text-xs text-ink-primary">Fichier llms.txt</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <StatusIcon status={hasJsonLd && hasOrganization ? 'allowed' : hasJsonLd ? 'unknown' : 'blocked'} />
                  <span className="text-xs text-ink-primary" title={schemaTypes.join(', ')}>
                    JSON-LD {hasOrganization ? '(Organization/Product)' : '(autre)'}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider mb-2">Balises Pages</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-1.5">
                  <StatusIcon status={hasUniqueH1 ? 'allowed' : h1Count === 0 ? 'blocked' : 'unknown'} />
                  <span className="text-xs text-ink-primary">
                    H1 {hasUniqueH1 ? 'Unique' : h1Count === 0 ? 'Manquant' : `Multiples (${h1Count})`}
                  </span>
                </li>
                <li className="flex items-center gap-1.5">
                  <StatusIcon status={hasGoodTitle && hasGoodDesc ? 'allowed' : hasGoodTitle || hasGoodDesc ? 'unknown' : 'blocked'} />
                  <span className="text-xs text-ink-primary">Title & Meta Desc</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* Additional Technical Checks */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider mb-2">Technique</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-1.5">
                  <StatusIcon status={hasCanonical ? 'allowed' : 'blocked'} />
                  <span className="text-xs text-ink-primary">Balise Canonical</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <StatusIcon status={imagesWithoutAlt === 0 ? 'allowed' : totalImages > 0 ? 'unknown' : 'blocked'} />
                  <span className="text-xs text-ink-primary">
                    Alt Images {imagesWithoutAlt === 0 ? 'OK' : `${imagesWithoutAlt} manquant${imagesWithoutAlt > 1 ? 's' : ''}`}
                  </span>
                </li>
              </ul>
            </div>
          </div>
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
