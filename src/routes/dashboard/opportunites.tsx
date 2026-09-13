import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronDown, Check, X as XIcon } from 'lucide-react'
import {
  fetchOpportunities,
  fetchOpportunityEvidence,
  updateOpportunityStatus,
  type OpportunityRow,
  type OpportunityStatus,
  type OpportunityPriority,
  type EvidenceStepType,
} from '~/lib/queries/opportunities'

export const Route = createFileRoute('/dashboard/opportunites')({
  component: OpportunitesPage,
})

const STATUS_FILTERS: { value: OpportunityStatus | 'all'; label: string }[] = [
  { value: 'open', label: 'Ouvertes' },
  { value: 'resolved', label: 'Résolues' },
  { value: 'dismissed', label: 'Ignorées' },
  { value: 'no_longer_observed', label: 'Plus observées' },
  { value: 'all', label: 'Toutes' },
]

const STATUS_LABEL: Record<OpportunityStatus, string> = {
  open: 'Ouverte',
  resolved: 'Résolue',
  dismissed: 'Ignorée',
  no_longer_observed: 'Plus observée',
}

const PRIORITY_LABEL: Record<OpportunityPriority, string> = {
  high: 'Priorité haute',
  medium: 'Priorité moyenne',
  low: 'Priorité basse',
}

const PRIORITY_CLASS: Record<OpportunityPriority, string> = {
  high: 'bg-danger/10 text-danger border-danger/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  low: 'bg-ink-muted/10 text-ink-muted border-border',
}

const EVIDENCE_STEP_LABEL: Record<EvidenceStepType, string> = {
  question: 'Question',
  response: 'Réponse observée',
  observation: 'Observation',
  competitor: 'Concurrent',
  site: 'Site',
  gap: 'Écart',
  recommendation: 'Recommandation',
}

function OpportunitesPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | 'all'>('open')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => fetchOpportunities(),
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

  const opportunities = data.opportunities

  if (opportunities.length === 0) {
    return (
      <StateMessage
        title="Aucune opportunité pour l'instant"
        description="Les opportunités sont générées à partir des observations de vos mesures. Elles apparaîtront ici après votre première mesure."
      />
    )
  }

  const filtered =
    statusFilter === 'all' ? opportunities : opportunities.filter((o) => o.status === statusFilter)

  async function handleStatusChange(id: string, status: OpportunityStatus, title: string) {
    setUpdatingId(id)
    try {
      await updateOpportunityStatus({ data: { opportunityId: id, status } })
      toast.success(
        status === 'resolved'
          ? `« ${title} » marquée comme résolue.`
          : `« ${title} » ignorée — elle reste visible dans l'historique des statuts.`,
      )
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    } catch (err) {
      toast.error("Impossible de mettre à jour cette opportunité pour le moment.")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? 'border-brand/40 bg-brand/10 text-brand-text'
                : 'border-border bg-surface text-ink-muted hover:text-ink-secondary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <StateMessage
          title="Aucune opportunité dans ce statut"
          description="Changez de filtre pour voir les autres opportunités."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <OpportunityCard
              key={o.id}
              opportunity={o}
              expanded={expandedId === o.id}
              onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)}
              onResolve={() => handleStatusChange(o.id, 'resolved', o.title)}
              onDismiss={() => handleStatusChange(o.id, 'dismissed', o.title)}
              updating={updatingId === o.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function OpportunityCard({
  opportunity,
  expanded,
  onToggle,
  onResolve,
  onDismiss,
  updating,
}: {
  opportunity: OpportunityRow
  expanded: boolean
  onToggle: () => void
  onResolve: () => void
  onDismiss: () => void
  updating: boolean
}) {
  const { data: evidenceData, isLoading: evidenceLoading } = useQuery({
    queryKey: ['opportunity-evidence', opportunity.id],
    queryFn: () => fetchOpportunityEvidence({ data: opportunity.id }),
    enabled: expanded,
  })

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-start gap-2 text-left"
        >
          <ChevronDown
            className={`mt-0.5 size-4 shrink-0 text-ink-muted transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
          <div>
            <p className="text-sm font-semibold text-ink-primary">{opportunity.title}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-sm border px-1.5 py-0.5 text-[11px] font-medium ${PRIORITY_CLASS[opportunity.priority]}`}
              >
                {PRIORITY_LABEL[opportunity.priority]}
              </span>
              <span className="rounded-sm border border-border px-1.5 py-0.5 text-[11px] text-ink-muted">
                Confiance {opportunity.confidence}%
              </span>
              <span className="rounded-sm border border-border px-1.5 py-0.5 text-[11px] text-ink-muted">
                {opportunity.observationsCount} observation
                {opportunity.observationsCount > 1 ? 's' : ''}
              </span>
              <span className="rounded-sm border border-border px-1.5 py-0.5 text-[11px] text-ink-muted">
                {STATUS_LABEL[opportunity.status]}
              </span>
            </div>
          </div>
        </button>

        {opportunity.status === 'open' && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onResolve}
              disabled={updating}
              title="Marquer comme résolue"
              className="flex size-7 items-center justify-center rounded-md border border-border text-ink-muted hover:border-success/40 hover:text-success disabled:opacity-50"
            >
              <Check className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={onDismiss}
              disabled={updating}
              title="Ignorer cette opportunité"
              className="flex size-7 items-center justify-center rounded-md border border-border text-ink-muted hover:border-danger/40 hover:text-danger disabled:opacity-50"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {opportunity.questions.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-medium text-ink-muted">
            Questions concernées
          </p>
          <ul className="mt-1 space-y-1">
            {opportunity.questions.map((q, i) => (
              <li key={i} className="text-xs text-ink-secondary">
                « {q} »
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3">
        <p className="text-[11px] font-medium text-ink-muted">Pourquoi</p>
        <p className="mt-1 text-xs text-ink-secondary">{opportunity.reason}</p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-medium text-ink-muted">
            Contenu actuel du site
          </p>
          <p className="mt-1 text-xs text-ink-secondary">
            {opportunity.currentSiteContent ?? 'Aucun contenu identifié sur ce sujet.'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-ink-muted">
            Direction proposée
          </p>
          <p className="mt-1 text-xs text-ink-secondary">{opportunity.proposedDirection}</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-[11px] font-medium text-ink-muted">
            Chaîne de preuves
          </p>
          {evidenceLoading ? (
            <p className="text-xs text-ink-muted">Chargement…</p>
          ) : !evidenceData || evidenceData.evidence.length === 0 ? (
            <p className="text-xs text-ink-muted">Aucune preuve détaillée disponible.</p>
          ) : (
            <ol className="space-y-2">
              {evidenceData.evidence.map((step, i) => (
                <li key={step.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-elevated text-[10px] text-ink-muted">
                      {i + 1}
                    </span>
                    {i < evidenceData.evidence.length - 1 && (
                      <span className="w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="text-[11px] text-ink-muted">
                      {EVIDENCE_STEP_LABEL[step.stepType]}
                    </p>
                    <p className="text-xs font-medium text-ink-primary">{step.label}</p>
                    {step.content && (
                      <p className="mt-0.5 text-xs text-ink-secondary">{step.content}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
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
