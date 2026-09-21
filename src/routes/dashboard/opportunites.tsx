import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Check, ChevronDown, ChevronRight, Filter, Search, X as XIcon, Lightbulb, ArrowRight, Lock } from 'lucide-react'
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
import { ActionableContentPanel } from '~/components/dashboard/ActionableContentPanel'
import { isFreePlan } from '~/lib/plan'

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

// Wording volontairement prudent : "score en hausse depuis", jamais "a résolu"
// ou "a corrigé" — on mesure une corrélation dans le temps sur les questions
// liées, pas une preuve que cette opportunité précise est la cause du delta
// (voir isQuestionConfounded dans outcome.ts pour les limites de la méthode).
const OUTCOME_LABEL: Record<'pending' | 'improved' | 'no_change', string> = {
  pending: 'En attente de remesure',
  improved: 'Score en hausse depuis',
  no_change: 'Pas de hausse mesurée',
}

const OUTCOME_CLASS: Record<'pending' | 'improved' | 'no_change', string> = {
  pending: 'bg-ink-muted/10 text-ink-muted border-border',
  improved: 'bg-success/10 text-success border-success/30',
  no_change: 'bg-ink-muted/10 text-ink-muted border-border',
}

const OUTCOME_TOOLTIP: Record<'pending' | 'improved' | 'no_change', string> = {
  pending: "Pas encore de mesure après la résolution — le verdict s'affichera à la prochaine mesure.",
  improved: "Le score a progressé sur les questions concernées entre la mesure d'avant et celle d'après — une corrélation observée, pas une preuve de causalité directe.",
  no_change: "Aucune progression mesurée sur les questions concernées depuis la résolution.",
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

/**
 * Extrait le contenu du site depuis les pages crawlées pour l'analyse IA
 */
function extractSiteContentFromPages(pages: any[]): any {
  const homepage = pages.find((p) => p.status === 'ok')
  if (!homepage) return null

  const extracted = homepage.extracted_content
  if (!extracted) return null

  return {
    title: extracted.title,
    metaDescription: extracted.metaDescription,
    h1: extracted.h1,
    bodyText: extracted.body,
    jsonLd: extracted.jsonLd,
    hasCanonical: extracted.hasCanonical,
    canonicalUrl: extracted.canonicalUrl,
  }
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
    if (isFreePlan(data.brand.plan)) {
      // Deux cas distincts (#4) :
      //   freeWellRecommended = true  → a mesuré, bien recommandée : message de félicitations honnête
      //   freeWellRecommended = false → jamais mesuré ou pas encore de signal : message de blocage
      return <FreeOpportunitiesLockedCard wellRecommended={data.freeWellRecommended ?? false} />
    }
    return <DashboardStateView state="no_opportunity" isFree={false} />
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
  const hasDetailedInsight = Boolean(insight.title && insight.reason)

  if (!hasDetailedInsight) {
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

  return (
    <div className="space-y-4">
      {/* Bannière d'information */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-brand/20 bg-brand/5 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-medium text-ink-primary">
          <span className="flex size-2 rounded-full bg-brand animate-pulse" />
          <span>Aperçu de diagnostic AIO offert</span>
          <span className="text-ink-muted">•</span>
          <span className="text-ink-muted">Basé sur votre analyse gratuite</span>
        </div>
        <a
          href="/dashboard/parametres"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-text hover:underline"
        >
          Passer Pro pour tout débloquer
          <ChevronRight className="size-3.5" />
        </a>
      </div>

      {/* Carte Teaser d'Opportunité */}
      <section className="rounded-lg border border-border bg-surface overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-sm border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[11px] font-medium text-warning">
                  Opportunité détectée
                </span>
                <span className="rounded-sm border border-border bg-elevated px-1.5 py-0.5 text-[11px] text-ink-muted">
                  Aperçu Free (1/1)
                </span>
              </div>
              <h2 className="mt-2.5 text-base font-semibold text-ink-primary">
                {insight.title}
              </h2>
            </div>
          </div>

          {insight.questionText && (
            <div className="mt-3.5 pt-3 border-t border-border/40">
              <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
                Question concernée
              </p>
              <p className="mt-1 text-xs font-medium text-ink-secondary">
                « {insight.questionText} »
              </p>
            </div>
          )}
        </div>

        <div className="p-5 space-y-6 bg-elevated/20">
          {/* Diagnostic en clair */}
          <div>
            <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
              Pourquoi (Diagnostic)
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary bg-surface p-3.5 rounded-md border border-border">
              {insight.reason}
            </p>
          </div>

          {/* Action concrète - Teaser verrouillé / flouté */}
          <div>
            <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider mb-2">
              Action recommandée pour votre site
            </p>
            <div className="relative rounded-md border border-border/80 bg-surface overflow-hidden p-5">
              {/* Contenu flouté en arrière-plan */}
              <div className="filter blur-[5px] select-none pointer-events-none opacity-30 space-y-2">
                <p className="text-xs font-medium text-ink-primary">
                  {insight.proposedDirection || "Optimisation de la page d'accueil et ajout des éléments d'autorité nécessaires pour être cité en première position."}
                </p>
                <p className="text-xs text-ink-secondary">
                  Créer une section dédiée aux avis comparatifs, restructurer les balises avec les mots-clés exacts, et ajouter les citations de réassurance mentionnées par l'IA.
                </p>
              </div>

              {/* Overlay verrou avec CTA Pro */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-[2px] p-4 text-center">
                <div className="flex size-9 items-center justify-center rounded-full bg-brand/10 border border-brand/20 text-brand-text mb-2">
                  <Lock className="size-4" />
                </div>
                <p className="text-sm font-semibold text-ink-primary">
                  Recommandation concrète verrouillée
                </p>
                <p className="mt-1 max-w-md text-xs text-ink-secondary">
                  Passez au plan Pro pour débloquer les consignes techniques exactes, le suivi continu et la détection automatique de toutes vos opportunités.
                </p>
                <a
                  href="/dashboard/parametres"
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-xs font-semibold text-black hover:bg-brand-hover shadow-sm transition-colors"
                >
                  Débloquer avec Reflet Pro
                  <ArrowRight className="size-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// Plan Free, aucune opportunité ET aucun freeInsight.
// Deux sous-cas distincts :
//   wellRecommended=true  → a mesuré, bien recommandée : félicitations + invite à tester une autre question (#4)
//   wellRecommended=false → jamais mesuré OU pas encore de signal : message de blocage standard
function FreeOpportunitiesLockedCard({ wellRecommended }: { wellRecommended: boolean }) {
  if (wellRecommended) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-success/10 border border-success/20 text-success">
            <Lightbulb className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-primary">Bon signal sur cette question</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
              L'IA vous recommande sur votre question suivie — c'est un bon départ.{' '}
              Testez une autre question pour avoir une vue plus complète de votre visibilité.
            </p>
          </div>
        </div>
        <a
          href="/dashboard/parametres"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-black hover:bg-brand-hover"
        >
          Passer Pro pour suivre d'autres questions
          <ArrowRight className="size-3.5" />
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-elevated border border-border text-ink-muted">
          <Lock className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-primary">Opportunités indisponibles en Free</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
            Les opportunités se détectent en croisant plusieurs mesures dans le temps —
            fonctionnalité réservée au plan Pro.
          </p>
        </div>
      </div>
      <a
        href="/dashboard/parametres"
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-black hover:bg-brand-hover"
      >
        Passer Pro pour détecter vos opportunités
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
              {opportunity.status === 'resolved' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={`rounded-sm border px-1.5 py-0.5 text-[11px] font-medium ${OUTCOME_CLASS[opportunity.outcomeStatus ?? 'pending']}`}
                    >
                      {OUTCOME_LABEL[opportunity.outcomeStatus ?? 'pending']}
                      {opportunity.outcomeStatus && opportunity.outcomeStatus !== 'pending' && opportunity.outcomeQuestionsTotal
                        ? ` (${opportunity.outcomeQuestionsImproved}/${opportunity.outcomeQuestionsTotal})`
                        : ''}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{OUTCOME_TOOLTIP[opportunity.outcomeStatus ?? 'pending']}</TooltipContent>
                </Tooltip>
              )}
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

              {/* Actionable Content Panel - Palier 0 */}
              <ActionableContentPanel
                opportunityId={opportunity.id}
                opportunity={{
                  title: opportunity.title,
                  reason: opportunity.reason,
                  proposed_direction: opportunity.proposedDirection,
                  website_url: data.brand?.website_url,
                  type: opportunity.type,
                }}
                siteContent={extractSiteContentFromPages(data.pages)}
                brandPlan={data.brand.plan}
              />

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


