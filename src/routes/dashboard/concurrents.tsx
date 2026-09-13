import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronDown, EyeOff } from 'lucide-react'
import { fetchCompetitorsOverview, hideCompetitor, type CompetitorRow } from '~/lib/queries/competitors'
import { CompetitorsChart } from '~/components/dashboard/CompetitorsChart'

export const Route = createFileRoute('/dashboard/concurrents')({
  component: ConcurrentsPage,
})

function ConcurrentsPage() {
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [hidingId, setHidingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['competitors-overview'],
    queryFn: () => fetchCompetitorsOverview(),
  })

  if (isLoading) {
    return <StateMessage title="Chargement…" description="Récupération de vos données Reflet." />
  }

  if (!data?.brand) {
    return (
      <StateMessage
        title="Aucune marque configurée"
        description="Ajoutez votre marque dans Paramètres pour commencer à suivre votre visibilité IA."
      />
    )
  }

  const { brand, latestRun, ownStats, competitors } = data

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
    return (
      <StateMessage
        title="Aucune mesure effectuée"
        description="Les concurrents détectés dans les réponses observées apparaîtront ici après votre première mesure."
      />
    )
  }

  return (
    <div className="space-y-6">
      <CompetitorsChart brandName={brand.name} ownStats={ownStats} competitors={competitors} />

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink-primary">Concurrents détectés</h2>
        {competitors.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            Aucun concurrent détecté dans les réponses observées pour l'instant.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-ink-muted">
                  <th className="pb-2 font-medium">Concurrent</th>
                  <th className="pb-2 pl-4 text-right font-medium">Mentions</th>
                  <th className="pb-2 pl-4 text-right font-medium">Recommandations</th>
                  <th className="pb-2 pl-4 text-right font-medium">Position moy.</th>
                  <th className="pb-2 pl-4 text-right font-medium">Couverture</th>
                  <th className="pb-2 pl-4"></th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => (
                  <CompetitorRowLine
                    key={c.id}
                    competitor={c}
                    ownMentionsPct={ownStats?.mentionsPct ?? null}
                    expanded={expandedId === c.id}
                    onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    onHide={() => handleHide(c.id, c.name)}
                    hiding={hidingId === c.id}
                  />
                ))}
              </tbody>
            </table>
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
      <tr className="border-b border-border/50 last:border-0">
        <td className="py-2.5 pr-4">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-1.5 text-ink-primary hover:text-brand-text"
          >
            <ChevronDown
              className={`size-3.5 text-ink-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
            {competitor.name}
          </button>
        </td>
        <td className="py-2.5 pl-4 text-right text-ink-secondary">{competitor.mentionsPct}%</td>
        <td className="py-2.5 pl-4 text-right text-ink-secondary">
          {competitor.recommendationsPct}%
        </td>
        <td className="py-2.5 pl-4 text-right text-ink-secondary">
          {competitor.avgPosition !== null ? `#${competitor.avgPosition}` : '—'}
        </td>
        <td className="py-2.5 pl-4 text-right text-ink-secondary">{competitor.coveragePct}%</td>
        <td className="py-2.5 pl-4 text-right">
          <button
            type="button"
            onClick={onHide}
            disabled={hiding}
            title="Masquer ce concurrent"
            className="text-ink-muted hover:text-danger disabled:opacity-50"
          >
            <EyeOff className="size-4" />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border/50 last:border-0 bg-elevated/50">
          <td colSpan={6} className="px-4 py-3">
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
          </td>
        </tr>
      )}
    </>
  )
}

function StateMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold text-ink-primary">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
    </div>
  )
}
