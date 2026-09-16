import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Check, ChevronDown, ChevronRight, Filter, Search, X as XIcon, Lightbulb, ArrowRight } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import {
  fetchOpportunities,
  fetchOpportunityEvidence,
  updateOpportunityStatus,
  type OpportunityRow,
  type OpportunityStatus,
  type OpportunityPriority,
  type EvidenceStepType,
  type FreeInsight,
} from '~/lib/queries/opportunities'
import { DashboardStateView } from '~/components/dashboard/DashboardState'

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

  const { data, isLoading, isError } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => fetchOpportunities(),
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

  const opportunities = data.opportunities

  if (opportunities.length === 0) {
    // Plan Free : un insight simple construit depuis observations plutôt que
    // l'état vide générique, si la marque n'est pas recommandée sur son
    // unique question suivie. Sinon (bien recommandée) : état vide inchangé.
    if (data.freeInsight) {
      return <FreeInsightCard insight={data.freeInsight} />
    }
    return <DashboardStateView state="no_opportunity" />
  }

  const filtered =
    statusFilter === 'all' ? opportunities : opportunities.filter((o: any) => o.status === statusFilter)

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
        <DashboardStateView state="no_opportunity" title="Aucune opportunité dans ce statut" description="Changez de filtre pour voir les autres opportunités." />
      ) : (
        <div className="space-y-3">
          {filtered.map((o: any) => (
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

function FreeInsightCard({ insight }: { insight: FreeInsight }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-elevated border border-border text-ink-muted">
          <Lightbulb className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-primary">Une question sans recommandation</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
            Sur « {insight.questionText} », votre marque n'a pas été recommandée dans la réponse
            observée.
          </p>
        </div>
      </div>
      <a
        href="/dashboard/parametres"
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-black hover:bg-brand-hover"
      >
        Débloquez le plan d'action détaillé avec Reflet Pro
        <ArrowRight className="size-3.5" />
      </a>
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
    <section className="rounded-lg border border-border bg-surface transition-colors hover:border-border/80 overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-5">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-start gap-3 text-left outline-none"
        >
          <div className="mt-1 flex size-5 items-center justify-center rounded-sm bg-elevated border border-border">
            <ChevronDown
              className={`size-3.5 shrink-0 text-ink-muted transition-transform duration-300 ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-primary">{opportunity.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-sm border px-1.5 py-0.5 text-[11px] font-medium ${PRIORITY_CLASS[opportunity.priority]}`}
              >
                {PRIORITY_LABEL[opportunity.priority]}
              </span>
              <span className="rounded-sm border border-border bg-elevated px-1.5 py-0.5 text-[11px] text-ink-muted">
                Confiance {Math.round(opportunity.confidence * 100)}%
              </span>
              <span className="rounded-sm border border-border bg-elevated px-1.5 py-0.5 text-[11px] text-ink-muted">
                {opportunity.observationsCount} observation
                {opportunity.observationsCount > 1 ? 's' : ''}
              </span>
              <span className="rounded-sm border border-border bg-elevated px-1.5 py-0.5 text-[11px] text-ink-muted">
                {STATUS_LABEL[opportunity.status]}
              </span>
            </div>
          </div>
        </button>

        {opportunity.status === 'open' && (
          <div className="flex shrink-0 items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onResolve}
                  disabled={updating}
                  className="flex size-8 items-center justify-center rounded-md border border-border bg-surface text-ink-muted transition-colors hover:border-success/40 hover:bg-success/5 hover:text-success disabled:opacity-50"
                >
                  <Check className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Marquer comme résolue</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onDismiss}
                  disabled={updating}
                  className="flex size-8 items-center justify-center rounded-md border border-border bg-surface text-ink-muted transition-colors hover:border-danger/40 hover:bg-danger/5 hover:text-danger disabled:opacity-50"
                >
                  <XIcon className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Ignorer cette opportunité</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-border/50 bg-elevated/30"
          >
            <div className="p-5 space-y-6">
              {opportunity.questions.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
                    Questions concernées
                  </p>
                  <ul className="mt-2 space-y-1.5 border-l-2 border-border pl-3">
                    {opportunity.questions.map((q, i) => (
                      <li key={i} className="text-xs font-medium text-ink-secondary">
                        « {q} »
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
                  Pourquoi (Diagnostic)
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                  {opportunity.reason}
                </p>
              </div>

              {/* Visual Diff: Before / After */}
              <div>
                <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider mb-2">
                  Action recommandée
                </p>
                <div className="grid gap-px rounded-md border border-border overflow-hidden bg-border sm:grid-cols-2">
                  <div className="bg-surface p-4 flex flex-col h-full">
                    <span className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-danger/80">
                      <span className="size-1.5 rounded-full bg-danger/80" /> Contenu actuel
                    </span>
                    <p className="text-xs leading-relaxed text-ink-secondary flex-1">
                      {opportunity.currentSiteContent ?? 'Aucun contenu pertinent identifié sur le site.'}
                    </p>
                  </div>
                  <div className="bg-surface p-4 flex flex-col h-full relative">
                    <div className="absolute top-1/2 -left-3.5 hidden sm:flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface z-10 shadow-sm text-ink-muted">
                      <ArrowRight className="size-3.5" />
                    </div>
                    <span className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-success/80">
                      <span className="size-1.5 rounded-full bg-success/80" /> Cible (Direction)
                    </span>
                    <p className="text-xs leading-relaxed text-ink-secondary flex-1">
                      {opportunity.proposedDirection}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="mb-3 text-[11px] font-medium text-ink-muted uppercase tracking-wider">
                  Preuves détaillées
                </p>
                {evidenceLoading ? (
                  <p className="text-xs text-ink-muted animate-pulse">Chargement de la chaîne d'observations…</p>
                ) : !evidenceData || evidenceData.evidence.length === 0 ? (
                  <p className="text-xs text-ink-muted">Aucune preuve détaillée disponible.</p>
                ) : (
                  <ol className="space-y-4">
                    {evidenceData.evidence.map((step, i) => (
                      <li key={step.id} className="relative flex gap-4">
                        {i < evidenceData.evidence.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-[-16px] w-px bg-border/60" />
                        )}
                        <div className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-[10px] font-medium text-ink-secondary shadow-sm">
                          {i + 1}
                        </div>
                        <div className="pb-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                            {EVIDENCE_STEP_LABEL[step.stepType]}
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-ink-primary">{step.label}</p>
                          {step.content && (
                            <p className="mt-1 text-xs text-ink-secondary bg-elevated/50 p-2.5 rounded border border-border/40">
                              {step.content}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}


