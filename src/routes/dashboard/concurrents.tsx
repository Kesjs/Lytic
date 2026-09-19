import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronDown, EyeOff, Lock } from 'lucide-react'
import { fetchCompetitorsOverview, hideCompetitor, type CompetitorRow } from '~/lib/queries/competitors'
import { CompetitorsChart } from '~/components/dashboard/CompetitorsChart'
import { DashboardStateView } from '~/components/dashboard/DashboardState'
import { ResponsiveTable } from '~/components/dashboard/ResponsiveTable'

export const Route = createFileRoute('/dashboard/concurrents')({
  component: ConcurrentsPage,
})

function ConcurrentsPage() {
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [hidingId, setHidingId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['competitors-overview'],
    queryFn: () => fetchCompetitorsOverview(),
  })

  if (isLoading) {
    return <DashboardStateView state="loading" />
  }

  if (isError) {
    return (
      <DashboardStateView
        state="unavailable"
        title="Impossible de charger cette page"
        description="Vérifiez votre connexion et réessayez."
      />
    )
  }

  if (!data?.brand) {
    return <DashboardStateView state="no_data" title="Aucune marque configurée" description="Ajoutez votre marque dans Paramètres pour commencer à suivre votre visibilité IA." />
  }

  const { brand, latestRun, ownStats, competitors, lockedCount } = data
  // `competitors` est déjà tronqué côté serveur pour le plan Free
  // (fetchCompetitorsOverview) — aucune donnée Pro n'atteint le client ici,
  // `lockedCount` sert uniquement à afficher le nombre de concurrents
  // supplémentaires sans exposer leurs données.
  const visibleCompetitors = competitors

  async function handleHide(id: string, name: string) {
    setHidingId(id)
    try {
      await hideCompetitor({ data: id })
      toast.success(`${name} masqué — il n'apparaîtra plus dans vos comparaisons.`)
      queryClient.invalidateQueries({ queryKey: ['competitors-overview'] })
    } catch (err) {
      toast.error("Impossible de masquer ce concurrent pour le moment.")
    } finally {
      setHidingId(null)
    }
  }

  if (!latestRun) {
    return <DashboardStateView state="no_data" />
  }

  return (
    <div className="space-y-6">
      <CompetitorsChart brandName={brand.name} ownStats={ownStats} competitors={competitors} />

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink-primary">Concurrents détectés</h2>
        <ResponsiveTable
          data={visibleCompetitors}
          getRowKey={(c: CompetitorRow) => c.id}
          pageSize={8}
          emptyState={
            <p className="mt-3 text-sm text-ink-muted">
              Aucun concurrent détecté dans les réponses observées pour l'instant.
            </p>
          }
          columns={[
            { key: 'name', header: 'Concurrent' },
            { key: 'mentions', header: 'Mentions', align: 'right' },
            { key: 'reco', header: 'Recommandations', align: 'right' },
            { key: 'pos', header: 'Position moy.', align: 'right' },
            { key: 'coverage', header: 'Couverture', align: 'right' },
            { key: 'action', header: '', align: 'right' },
          ]}
          renderDesktopRow={(c: CompetitorRow) => (
            <CompetitorRowLine
              competitor={c}
              ownMentionsPct={ownStats?.mentionsPct ?? null}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
              onHide={() => handleHide(c.id, c.name)}
              hiding={hidingId === c.id}
            />
          )}
          renderMobileCard={(c: CompetitorRow) => (
            <CompetitorMobileCard
              competitor={c}
              ownMentionsPct={ownStats?.mentionsPct ?? null}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
              onHide={() => handleHide(c.id, c.name)}
              hiding={hidingId === c.id}
            />
          )}
        />

        {lockedCount > 0 && (
          <div className="relative mt-3 overflow-hidden rounded-lg border border-border">
            <div aria-hidden="true" className="space-y-2 p-3 blur-sm select-none">
              {Array.from({ length: Math.min(lockedCount, 3) }).map((_, i) => (
                <div key={i} className="h-8 rounded bg-elevated" />
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-canvas/70 px-4 text-center">
              <Lock className="size-4 text-ink-muted" />
              <p className="text-sm text-ink-secondary">
                + {lockedCount} autre{lockedCount > 1 ? 's' : ''} concurrent{lockedCount > 1 ? 's' : ''}
              </p>
              <a
                href="/dashboard/parametres"
                className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-black hover:bg-brand-hover"
              >
                Débloquer tous vos concurrents avec Pro
              </a>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function CompetitorRowLine({
  competitor,
  ownMentionsPct,
  expanded,
  onToggle,
  onHide,
  hiding,
}: {
  competitor: CompetitorRow
  ownMentionsPct: number | null
  expanded: boolean
  onToggle: () => void
  onHide: () => void
  hiding: boolean
}) {
  return (
    <>
      <tr className="transition-colors hover:bg-elevated/50">
        <td className="py-3.5 pl-5 pr-3">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-1.5 text-ink-primary hover:text-brand-text"
          >
            <ChevronDown
              className={`size-3.5 shrink-0 text-ink-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
            <span className="truncate">{competitor.name}</span>
          </button>
        </td>
        <td className="px-3 py-3.5 text-right text-ink-secondary">{competitor.mentionsPct}%</td>
        <td className="px-3 py-3.5 text-right text-ink-secondary">
          {competitor.recommendationsPct}%
        </td>
        <td className="px-3 py-3.5 text-right text-ink-secondary">
          {competitor.avgPosition !== null ? `#${competitor.avgPosition}` : '—'}
        </td>
        <td className="px-3 py-3.5 text-right text-ink-secondary">{competitor.coveragePct}%</td>
        <td className="py-3.5 pl-3 pr-5 text-right">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onHide}
                disabled={hiding}
                className="text-ink-muted hover:text-danger disabled:opacity-50"
              >
                <EyeOff className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Masquer ce concurrent</TooltipContent>
          </Tooltip>
        </td>
      </tr>
      {expanded && <CompetitorExcerpts competitor={competitor} ownMentionsPct={ownMentionsPct} colSpan={6} />}
    </>
  )
}

// Extraits de contexte affichés en ligne dépliée (desktop, colSpan) ou sous
// la carte (mobile) — même contenu, deux conteneurs différents.
function CompetitorExcerpts({
  competitor,
  ownMentionsPct,
  colSpan,
}: {
  competitor: CompetitorRow
  ownMentionsPct: number | null
  colSpan?: number
}) {
  const body = (
    <>
      {ownMentionsPct !== null && competitor.mentionsPct > ownMentionsPct && (
        <p className="mb-2 text-xs text-ink-secondary">
          Dans les réponses observées sur vos requêtes, {competitor.name} apparaît plus
          fréquemment que vous.
        </p>
      )}
      {competitor.excerpts.length === 0 ? (
        <p className="text-xs text-ink-muted">Aucun extrait de contexte disponible.</p>
      ) : (
        <ul className="space-y-2">
          {competitor.excerpts.map((excerpt, i) => (
            <li
              key={i}
              className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink-secondary"
            >
              {excerpt}
            </li>
          ))}
        </ul>
      )}
    </>
  )

  if (colSpan) {
    return (
      <tr className="bg-elevated/50">
        <td colSpan={colSpan} className="px-5 py-3">
          {body}
        </td>
      </tr>
    )
  }
  return <div className="bg-elevated/50 px-5 py-3">{body}</div>
}

// Repli mobile : même infos que la ligne de tableau, en carte — nom +
// bouton déplier en tête, stats clés en chips, action masquer à part pour
// rester accessible au pouce (pas de survol requis pour la découvrir).
function CompetitorMobileCard({
  competitor,
  ownMentionsPct,
  expanded,
  onToggle,
  onHide,
  hiding,
}: {
  competitor: CompetitorRow
  ownMentionsPct: number | null
  expanded: boolean
  onToggle: () => void
  onHide: () => void
  hiding: boolean
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3 px-5 py-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-medium text-ink-primary"
        >
          <ChevronDown
            className={`size-3.5 shrink-0 text-ink-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
          <span className="truncate">{competitor.name}</span>
        </button>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onHide}
              disabled={hiding}
              className="shrink-0 text-ink-muted hover:text-danger disabled:opacity-50"
            >
              <EyeOff className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Masquer ce concurrent</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-5 pb-3 text-xs text-ink-secondary">
        <span>Mentions {competitor.mentionsPct}%</span>
        <span>Reco {competitor.recommendationsPct}%</span>
        <span>{competitor.avgPosition !== null ? `Pos. #${competitor.avgPosition}` : 'Pos. —'}</span>
        <span>Couverture {competitor.coveragePct}%</span>
      </div>
      {expanded && <CompetitorExcerpts competitor={competitor} ownMentionsPct={ownMentionsPct} />}
    </div>
  )
}


