import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, ArrowRight, Trophy, Zap, AlertCircle, TrendingUp, Info, MessageSquare, ThumbsUp, Radar, Lightbulb, Sparkles } from 'lucide-react'
import { KpiCard } from '~/components/ui/kpi-card'
import { useQuery } from '@tanstack/react-query'
import { fetchDashboardHome, type CompetitorMini } from '~/lib/queries/dashboard'
import { fetchBotAccess } from '~/lib/queries/bot-access'
import { ScoreChart } from '~/components/dashboard/ScoreChart'
import { ShareOfVoiceChart } from '~/components/dashboard/charts/ShareOfVoiceChart'
import { EngineRadarChart } from '~/components/dashboard/charts/EngineRadarChart'
import { SentimentGauge } from '~/components/dashboard/charts/SentimentGauge'
import { ThemesCloud } from '~/components/dashboard/charts/ThemesCloud'
import { BrandSetupDrawer } from '~/components/dashboard/BrandSetupDrawer'
import { DashboardStateView, deriveRunFreshness } from '~/components/dashboard/DashboardState'
import { Skeleton } from '~/components/ui/skeleton'
import { BotAccessCard } from '~/components/dashboard/BotAccessCard'
import { QuestionsTable } from '~/components/dashboard/QuestionsTable'
import { isFreePlan } from '~/lib/plan'
import { cn } from '~/lib/utils'
import { motion } from 'framer-motion'

export const Route = createFileRoute('/dashboard/')({
  component: AccueilPage,
})

function AccueilPage() {
  const [setupOpen, setSetupOpen] = useState(false)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-home'],
    queryFn: () => fetchDashboardHome(),
  })

  const { data: botAccess, isLoading: isBotAccessLoading } = useQuery({
    queryKey: ['bot-access'],
    queryFn: () => fetchBotAccess(),
  })

  if (isLoading || isBotAccessLoading) {
    return <AccueilSkeleton />
  }

  if (isError) {
    return (
      <DashboardStateView
        state="unavailable"
        title="Impossible de charger votre tableau de bord"
        description="Vérifiez votre connexion et réessayez."
      />
    )
  }

  if (!data?.brand) {
    // État A — compte sans marque. Un seul CTA, pas d'onboarding multi-étapes.
    // Aperçu flouté du futur dashboard en arrière-plan : comble le vide
    // visuel et installe l'anticipation ("voilà ce que vous aurez") plutôt
    // que de laisser un simple bloc centré dans beaucoup de vide.
    return (
      <>
        <div className="relative mx-auto max-w-3xl py-10 text-center overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 grid grid-cols-2 gap-4 opacity-[0.15] blur-[2px] sm:grid-cols-4"
          >
            {['Mentions', 'Recommandations', 'Position moyenne', 'Présence'].map((label) => (
              <div key={label} className="rounded-lg border border-border bg-surface p-4">
                <p className="text-xs text-ink-secondary">{label}</p>
                <p className="mt-1 font-display text-2xl font-semibold text-ink-primary">—</p>
              </div>
            ))}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-canvas/40 via-canvas/85 to-canvas"
          />

          <div className="mx-auto max-w-lg">
            <p className="font-display text-lg font-semibold text-ink-primary">
              Votre visibilité IA commence ici.
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Ajoutez votre marque pour découvrir comment elle apparaît dans les réponses générées
              par ChatGPT.
            </p>
            <button
              type="button"
              onClick={() => setSetupOpen(true)}
              className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-brand-hover"
            >
              <Plus className="size-4" />
              Configurer ma marque
            </button>
            {/* Réassurance sur l'effort demandé, pour réduire la friction avant le clic */}
            <p className="mt-2 text-xs text-ink-muted">
              Configuration en 2 min · Gratuit pendant l'essai · Sans carte bancaire
            </p>

            <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-xs font-medium text-ink-primary">1. Analyse</p>
                <p className="mt-1 text-xs text-ink-muted">Nous analysons votre présence.</p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-xs font-medium text-ink-primary">2. Mesure</p>
                <p className="mt-1 text-xs text-ink-muted">
                  Nous suivons vos questions dans ChatGPT.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-xs font-medium text-ink-primary">3. Opportunités</p>
                <p className="mt-1 text-xs text-ink-muted">Nous vous montrons où progresser.</p>
              </div>
            </div>
          </div>
        </div>
        <BrandSetupDrawer open={setupOpen} onClose={() => setSetupOpen(false)} />
      </>
    )
  }

  const { brand, latestRun, displayRun, events, pages, kpis, questionsPerf, topCompetitors, shareOfVoice, enginePerformance, sentimentDistribution, topThemes, opportunities } =
    data

  return (
    <div className="space-y-4">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col lg:flex-row lg:items-stretch gap-5 lg:gap-6"
      >
        {/* Score Card - Plus aérée (p-6) avec une largeur fixe légèrement augmentée pour respirer */}
        <div className="flex w-full lg:w-[320px] shrink-0 flex-col justify-center rounded-xl border border-border bg-surface p-5 lg:p-6 shadow-sm">
          {latestRun?.status === 'measuring' || latestRun?.status === 'pending' ? (
            <RunStatusState status={latestRun.status} run={latestRun} />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-secondary">Score global</p>
                <div className="text-[11px] font-medium text-ink-muted bg-elevated px-2 py-0.5 rounded-full">
                  {brand.name}
                </div>
              </div>

              {!displayRun ? (
                <DashboardStateView state="no_data" compact className="mt-6" />
              ) : (
                <>
                  {displayRun.score !== null ? (
                    <div className="mt-4 flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-5xl font-bold tabular-nums tracking-tight text-brand">
                          {Math.round(displayRun.score)}
                        </span>
                        <span className="text-lg font-medium text-ink-muted">/ 100</span>
                      </div>
                      
                      {displayRun.score_delta !== null && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span
                            className={cn(
                              "flex items-center px-1.5 py-0.5 rounded text-xs font-semibold",
                              displayRun.score_delta >= 0 
                                ? 'bg-success/10 text-success' 
                                : 'bg-danger/10 text-danger'
                            )}
                          >
                            {displayRun.score_delta >= 0 ? '↑' : '↓'} {Math.abs(displayRun.score_delta)} pts
                          </span>
                          <span className="text-xs text-ink-muted">depuis la dernière mesure</span>
                        </div>
                      )}

                      <div className="mt-5 pt-5 border-t border-border/50 flex flex-col gap-1.5">
                        <p className="text-[11px] text-ink-muted flex justify-between">
                          <span>Dernière mise à jour</span>
                          <span className="font-medium text-ink-primary">
                            {displayRun.completed_at
                              ? new Date(displayRun.completed_at).toLocaleDateString('fr-FR')
                              : '—'}
                          </span>
                        </p>
                        {isFreePlan(brand.plan) && (
                          <p className="text-[11px] text-ink-muted flex justify-between">
                            <span>Précision</span>
                            <span className="text-warning font-medium">Basse (1 échantillon)</span>
                          </p>
                        )}
                        {latestRun?.status === 'failed' && (
                          <p className="text-[11px] font-semibold text-danger">
                            Échec de la dernière tentative.
                          </p>
                        )}
                      </div>
                      
                      {deriveRunFreshness(displayRun.completed_at) === 'stale' && (
                        <DashboardStateView state="stale" compact className="mt-3 !py-0" />
                      )}
                      {displayRun.status === 'partial' && (
                        <DashboardStateView state="partial" compact className="mt-3 !py-0" />
                      )}
                    </div>
                  ) : (
                    <RunStatusState status={displayRun.status} run={displayRun} />
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Right Column: 4 KPIs (Distilled from 5) + AI Insight */}
        <div className="flex-1 flex flex-col gap-5 lg:gap-6 min-w-0">
          <div className="w-full grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border rounded-xl border-0 ring-1 ring-border/50 bg-surface overflow-hidden shadow-md">
            <KpiCard
              label="Mentions"
              value={kpis.mentionsPct !== null ? `${kpis.mentionsPct}%` : null}
              trend={{ value: 2, suffix: 'vs sem. dernière' }}
              tooltip="Pourcentage de fois où votre marque est citée dans les réponses générées."
              icon={MessageSquare}
              tone="info"
            />
            <KpiCard
              label="Recommandations"
              value={kpis.recommendationsPct !== null ? `${kpis.recommendationsPct}%` : null}
              trend={{ value: 5, suffix: 'vs sem. dernière' }}
              tooltip="Pourcentage de fois où votre marque est explicitement recommandée."
              icon={ThumbsUp}
              tone="success"
            />
            <KpiCard
              label="Pos. moyenne"
              value={kpis.avgPosition !== null ? `#${kpis.avgPosition}` : null}
              trend={{ value: -0.2, suffix: 'vs sem. dernière' }}
              tooltip="Votre position d'apparition (1er, 2ème) dans les listes générées par l'IA."
              icon={TrendingUp}
              tone="warning"
            />
            <KpiCard
              label="Présence"
              value={
                kpis.competitivePresencePct !== null ? `${kpis.competitivePresencePct}%` : null
              }
              hint="sur les 30 derniers jours"
              tooltip="Votre part de mentions par rapport à vos principaux concurrents."
              icon={Radar}
              tone="danger"
            />
          </div>
          
          {displayRun && displayRun.score !== null && (
            <div className="mt-auto flex flex-col sm:flex-row sm:items-start gap-4 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent p-5 lg:p-6 shadow-sm">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15">
                <Sparkles className="size-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-ink-primary">Insight IA</h3>
                <p className="text-sm text-ink-secondary leading-snug mt-1">
                  Bonne progression cette semaine : votre taux de recommandation a augmenté de <span className="font-semibold text-ink-primary">+5%</span> par rapport à vos concurrents principaux.
                </p>
                <ul className="mt-3.5 space-y-2 text-xs text-ink-muted">
                  <li className="flex items-start gap-2">
                    <div className="mt-1.5 size-1 shrink-0 rounded-full bg-violet-500/50" />
                    <span><strong className="font-medium text-ink-primary">ChatGPT</strong> vous cite plus souvent sur les requêtes commerciales.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1.5 size-1 shrink-0 rounded-full bg-violet-500/50" />
                    <span><strong className="font-medium text-ink-primary">Perplexity</strong> commence à utiliser vos articles de blog récents comme sources.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </motion.header>

      {isFreePlan(brand.plan) && latestRun && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand/30 bg-brand/5 px-4 py-3"
        >
          <p className="text-sm text-ink-secondary">
            <span className="font-medium text-ink-primary">Plan Free — 1 mesure utilisée.</span>{' '}
            Passez au plan Pro pour remesurer et débloquer toutes les fonctionnalités.
          </p>
          <Link
            to="/dashboard/parametres"
            className="shrink-0 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-black hover:bg-brand-hover"
          >
            Passer Pro
          </Link>
        </motion.div>
      )}

      {/* Rangée compacte : Opportunités + les 4 graphiques côte à côte.
          Grille auto-fit : chaque carte garde au moins 190px avant de
          passer à la ligne suivante, en continu selon la largeur réelle
          disponible (sidebar ouverte/réduite, mobile, etc.) — pas de
          paliers fixes qui peuvent laisser des colonnes trop étroites. */}
      {displayRun && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4"
        >
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-primary">Opportunités</h2>
              <Link
                to="/dashboard/opportunites"
                className="text-xs text-ink-muted hover:text-ink-secondary"
              >
                Tout →
              </Link>
            </div>
            <OpportunitiesPreview opportunities={opportunities ?? []} hasAnyRun={!!latestRun} />
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-primary">Part de Voix</h2>
            <ShareOfVoiceChart data={shareOfVoice ?? []} />
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-primary">Moteurs IA</h2>
            <EngineRadarChart data={enginePerformance ?? []} />
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-primary">Tonalité</h2>
            <SentimentGauge data={sentimentDistribution ?? { positive: 0, neutral: 0, negative: 0 }} />
          </div>
        </motion.section>
      )}

      {displayRun && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="rounded-lg border border-border bg-surface p-4"
        >
          <h2 className="mb-3 text-sm font-semibold text-ink-primary">Thèmes</h2>
          <ThemesCloud data={topThemes ?? []} />
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <BotAccessCard data={botAccess ?? null} brandId={brand.id} />
      </motion.section>

      {displayRun && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-primary">Concurrents</h2>
              <Link
                to="/dashboard/concurrents"
                className="text-xs text-ink-muted hover:text-ink-secondary"
              >
                Tous les concurrents →
              </Link>
            </div>
            <CompetitorsMiniList competitors={topCompetitors} hasAnyRun={!!latestRun} />
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink-primary">Surveillance du site</h2>
            {pages.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">
                Aucune page suivie — configurez votre site dans Paramètres.
              </p>
            ) : (
              <p className="mt-3 text-sm text-ink-secondary">
                {pages.length} page{pages.length > 1 ? 's' : ''} suivie
                {pages.length > 1 ? 's' : ''}, dont{' '}
                {pages.filter((p: any) => p.status === 'ok').length} vérifiée
                {pages.filter((p: any) => p.status === 'ok').length > 1 ? 's' : ''} récemment
              </p>
            )}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface pt-5">
          <div className="flex items-center justify-between px-5">
            <h2 className="text-sm font-semibold text-ink-primary">Performance des questions</h2>
            <Link
              to="/dashboard/historique"
              className="text-xs text-ink-muted hover:text-ink-secondary"
            >
              Toutes les questions &rarr;
            </Link>
          </div>
          <QuestionsTable data={questionsPerf} />
        </div>

        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-primary">Activité récente</h2>
            <Link
              to="/dashboard/historique"
              className="text-xs text-ink-muted hover:text-ink-secondary"
            >
              Tout l'historique →
            </Link>
          </div>
          {events.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Aucun événement récent.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {events.map((event: any) => (
                <li key={event.id} className="text-sm text-ink-secondary">
                  <p className="text-ink-primary">{event.title}</p>
                  <p className="text-xs text-ink-muted">
                    {new Date(event.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

// Preview compacte des opportunités sur l'Accueil — pastille de sévérité +
// confiance, sans les actions (résoudre/ignorer) qui restent réservées à
// la page dédiée /dashboard/opportunites.
function OpportunitiesPreview({
  opportunities,
  hasAnyRun,
}: {
  opportunities: any[]
  hasAnyRun: boolean
}) {
  if (!hasAnyRun) {
    return (
      <p className="mt-3 text-sm text-ink-muted">
        Aucune mesure effectuée pour le moment — les opportunités apparaîtront ici.
      </p>
    )
  }
  if (opportunities.length === 0) {
    return (
      <div className="mt-3 rounded-md bg-elevated/50 p-3">
        <p className="text-sm text-ink-primary">👑 Rien à signaler</p>
        <p className="mt-1 text-xs text-ink-muted">
          Aucune opportunité ouverte détectée pour l'instant.
        </p>
      </div>
    )
  }
  return (
    <ul className="mt-3 divide-y divide-border">
      {opportunities.slice(0, 3).map((o) => (
        <li key={o.id} className="flex gap-2.5 py-2.5 first:pt-0 last:pb-0">
          {/* Pastille de sévérité plutôt qu'un badge texte : plus rapide à
              scanner d'un coup d'œil, et le titre garde toute la largeur
              disponible au lieu de la partager avec un pill. */}
          <span className={cn('mt-1 size-2 shrink-0 rounded-full', PRIORITY_DOT[o.priority as 'low' | 'medium' | 'high'])} />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink-primary" title={o.title}>
              {o.title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className={cn('text-[10px] font-semibold uppercase tracking-wide', PRIORITY_TEXT[o.priority as 'low' | 'medium' | 'high'])}>
                {PRIORITY_LABEL[o.priority as 'low' | 'medium' | 'high']}
              </span>
              <span className="text-[10.5px] text-ink-muted">
                · Confiance {Math.round((o.confidence ?? 0) * 100)}%
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

const PRIORITY_DOT = { low: 'bg-ink-muted', medium: 'bg-warning', high: 'bg-danger' } as const
const PRIORITY_TEXT = { low: 'text-ink-secondary', medium: 'text-warning', high: 'text-danger' } as const
const PRIORITY_LABEL = { low: 'Faible', medium: 'Moyenne', high: 'Haute' } as const

function CompetitorsMiniList({
  competitors,
  hasAnyRun,
}: {
  competitors: CompetitorMini[]
  hasAnyRun: boolean
}) {
  if (!hasAnyRun) {
    return (
      <p className="mt-3 text-sm text-ink-muted">
        Aucune mesure effectuée pour le moment.
      </p>
    )
  }
  if (competitors.length === 0) {
    return (
      <div className="mt-3 rounded-md bg-elevated/50 p-3">
        <p className="text-sm text-ink-primary">👑 Bonne nouvelle</p>
        <p className="mt-1 text-xs text-ink-muted">
          L'IA ne vous compare à aucun concurrent pour l'instant. Pour forcer l'IA à chercher vos rivaux, ajoutez des questions du type "Alternatives à..."
        </p>
      </div>
    )
  }
  return (
    <ul className="mt-3 space-y-2">
      {competitors.map((c) => (
        <li
          key={c.id}
          className="flex items-center justify-between rounded-md border border-border bg-elevated px-3 py-2 text-sm"
        >
          <span className="text-ink-primary">{c.name}</span>
          <span className="text-xs text-ink-muted">
            {c.mentions} mention{c.mentions > 1 ? 's' : ''}
          </span>
        </li>
      ))}
    </ul>
  )
}

// Skeleton calqué sur la structure réelle de l'Accueil (header + 4 KPI +
// 2 sections + tableau) pour éviter le layout shift au chargement des
// vraies données, plutôt qu'un message texte plaqué au centre de l'écran.
function AccueilSkeleton() {
  return (
    <div className="space-y-6">
      <header className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-lg border border-border bg-surface p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-9 w-20" />
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <Skeleton className="h-full min-h-[180px] w-full" />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-7 w-12" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-5">
            <Skeleton className="h-4 w-32" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <Skeleton className="h-4 w-48" />
        <div className="mt-4 space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </section>
    </div>
  )
}





function RunStatusState({
  status,
  run,
}: {
  status: 'pending' | 'measuring' | 'partial' | 'failed'
  run: { questions_total: number; questions_completed: number }
}) {
  // Branche l'état visuel riche de DashboardState.tsx (icône animée,
  // titre + description) au lieu d'un texte brut — même pattern que les
  // autres pages du dashboard. 'pending' n'a pas d'entrée dédiée dans
  // DashboardStateKind (transition trop brève pour ça) → mappé sur
  // 'analyzing', dont le message générique reste cohérent pour ce court
  // instant avant que le premier processNextQuestion ne démarre.
  if (status === 'pending') {
    return <DashboardStateView state="analyzing" card={false} className="min-h-0 !p-0" title="Mesure en préparation…" />
  }

  if (status === 'measuring') {
    return (
      <DashboardStateView
        state="measuring"
        card={false}
        className="min-h-0 !p-0"
        title="Mesure en cours"
        description={`${run.questions_completed}/${run.questions_total} questions`}
      />
    )
  }

  if (status === 'partial') {
    return (
      <DashboardStateView
        state="partial"
        compact
        description={`${run.questions_completed}/${run.questions_total} questions mesurées.`}
      />
    )
  }

  return <DashboardStateView state="failed" compact />
}