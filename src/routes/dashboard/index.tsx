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
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { TechnicalAuditCard, computeAuditMetrics } from '~/components/dashboard/TechnicalAuditCard'
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

  const { brand, latestRun, displayRun, events, pages, kpis, kpiTrends, aiInsight, questionsPerf, topCompetitors, shareOfVoice, enginePerformance, sentimentDistribution, topThemes, opportunities } =
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

                      {/* Badge optimisation IA (Section 4.3) */}
                      {(() => {
                        // Bug corrigé (22/09) : computeAuditMetrics(botAccess, pages) — les
                        // deux arguments étaient inversés, ce qui faisait planter tout
                        // /dashboard dès que pages.length > 0 (accès à `.bots` sur le
                        // tableau pages au lieu de l'objet botAccess). `hasRobotsTxt` et
                        // `hasLlmsTxt` n'existent pas non plus sur l'objet retourné par
                        // computeAuditMetrics (voir src/lib/audit-metrics.ts) — remplacés
                        // par les champs réels (botsScore, botAccess.llmsTxtFound).
                        const metrics = pages.length > 0 ? computeAuditMetrics(botAccess ?? null, pages) : null
                        if (!metrics) return null
                        const auditScore = metrics.score

                        const level = auditScore >= 80 ? 'good' : auditScore >= 50 ? 'warning' : 'danger'
                        const issues: string[] = []

                        // Construire la liste des problèmes principaux
                        if (metrics.botsScore < 30) issues.push('Bots IA bloqués dans robots.txt')
                        if (!botAccess?.llmsTxtFound) issues.push('llms.txt manquant')
                        if (!metrics.hasJsonLd) issues.push('JSON-LD absent')
                        if (!metrics.hasUniqueH1) issues.push('H1 manquant/dupliqué')
                        if (metrics.imagesWithoutAlt > 0) issues.push(`${metrics.imagesWithoutAlt} images sans alt`)
                        
                        return (
                          <div className={cn(
                            "mt-4 p-3 rounded-lg border",
                            level === 'good' && "bg-success/5 border-success/20",
                            level === 'warning' && "bg-warning/5 border-warning/20",
                            level === 'danger' && "bg-danger/5 border-danger/20"
                          )}>
                            <div className="flex items-start gap-2">
                              {level === 'good' && <div className="text-success">✓</div>}
                              {level === 'warning' && <AlertCircle className="size-4 text-warning mt-0.5" />}
                              {level === 'danger' && <AlertCircle className="size-4 text-danger mt-0.5" />}
                              <div className="flex-1">
                                <p className={cn(
                                  "text-xs font-semibold",
                                  level === 'good' && "text-success",
                                  level === 'warning' && "text-warning",
                                  level === 'danger' && "text-danger"
                                )}>
                                  {level === 'good' && 'Site bien optimisé pour les IA'}
                                  {level === 'warning' && 'Optimisation partielle'}
                                  {level === 'danger' && 'Problèmes critiques détectés'}
                                </p>
                                {issues.length > 0 && (
                                  <ul className="mt-1.5 space-y-0.5">
                                    {issues.slice(0, 3).map((issue, i) => (
                                      <li key={i} className="text-[10px] text-ink-muted">• {issue}</li>
                                    ))}
                                  </ul>
                                )}
                                {level !== 'good' && (
                                  <Link 
                                    to="/dashboard/audit-technique" 
                                    className="text-[10px] text-brand hover:underline mt-1 inline-block"
                                  >
                                    Voir les recommandations →
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })()}

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
              trend={
                kpiTrends?.mentionsTrend != null
                  ? { value: kpiTrends.mentionsTrend, suffix: 'vs mesure précédente' }
                  : undefined
              }
              tooltip="Pourcentage de fois où votre marque est citée dans les réponses générées."
              icon={MessageSquare}
              tone="info"
            />
            <KpiCard
              label="Recommandations"
              value={kpis.recommendationsPct !== null ? `${kpis.recommendationsPct}%` : null}
              trend={
                kpiTrends?.recommendationsTrend != null
                  ? { value: kpiTrends.recommendationsTrend, suffix: 'vs mesure précédente' }
                  : undefined
              }
              tooltip="Pourcentage de fois où votre marque est explicitement recommandée."
              icon={ThumbsUp}
              tone="success"
            />
            <KpiCard
              label="Pos. moyenne"
              value={kpis.avgPosition !== null ? `#${kpis.avgPosition}` : null}
              trend={
                kpiTrends?.avgPositionTrend != null
                  ? { value: kpiTrends.avgPositionTrend, suffix: 'vs mesure précédente' }
                  : undefined
              }
              tooltip="Votre position d'apparition (1er, 2ème) dans les listes générées par l'IA."
              icon={TrendingUp}
              tone="warning"
            />
            <KpiCard
              label="Présence"
              value={
                kpis.competitivePresencePct !== null ? `${kpis.competitivePresencePct}%` : null
              }
              trend={
                kpiTrends?.competitivePresenceTrend != null
                  ? { value: kpiTrends.competitivePresenceTrend, suffix: 'vs mesure précédente' }
                  : undefined
              }
              hint="sur les 30 derniers jours"
              tooltip="Votre part de mentions par rapport à vos principaux concurrents."
              icon={Radar}
              tone="danger"
            />
          </div>
          
          {displayRun && displayRun.score !== null && aiInsight && (
            <div className="mt-auto flex flex-col sm:flex-row sm:items-start gap-4 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent p-5 lg:p-6 shadow-sm">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15">
                <Sparkles className="size-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-ink-primary">Insight IA</h3>
                <p className="text-sm text-ink-secondary leading-snug mt-1">{aiInsight.headline}</p>
                {aiInsight.bullets.length > 0 && (
                  <ul className="mt-3.5 space-y-2 text-xs text-ink-muted">
                    {aiInsight.bullets.map((bullet: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="mt-1.5 size-1 shrink-0 rounded-full bg-violet-500/50" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
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
            <span className="font-medium text-ink-primary">
              Plan Free — {data.freeMeasurementsThisWeek ?? 0}/3 mesures utilisées cette semaine.
            </span>{' '}
            {data.freeRemeasureBonus 
              ? "⚡ Un bonus de remesure est disponible suite à une modification de votre site." 
              : "Passez au plan Pro pour des mesures quotidiennes illimitées."}
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
            <OpportunitiesPreview
              opportunities={opportunities ?? []}
              hasAnyRun={!!latestRun}
              hasPreviousRun={!!data.previousRun}
              isFree={isFreePlan(data.brand.plan)}
              freeSignalStatus={data.freeSignalStatus ?? 'unmeasured'}
            />
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
        <TechnicalAuditCard botAccess={botAccess ?? null} pages={data.pages ?? []} brandId={brand.id} />
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

          <div className="rounded-lg border border-border bg-surface p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink-primary">Surveillance du site</h2>
              {pages.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">
                  Aucune page suivie — configurez votre site dans Paramètres.
                </p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {pages.slice(0, 5).map((p: any) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <span className="min-w-0 truncate text-xs text-ink-secondary cursor-default">
                            {(() => {
                              try {
                                const u = new URL(p.url)
                                return u.pathname === '/' ? u.hostname : `${u.hostname}${u.pathname}`
                              } catch {
                                return p.url
                              }
                            })()}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[280px] break-all text-left">
                          {p.url}
                        </TooltipContent>
                      </Tooltip>
                      <span className={cn('shrink-0 text-[11px] font-medium', PAGE_STATUS_TEXT[p.status as PageStatus] ?? 'text-ink-muted')}>
                        {PAGE_STATUS_LABEL[p.status as PageStatus] ?? p.status}
                      </span>
                    </li>
                  ))}
                  {pages.length > 5 && (
                    <li className="text-[11px] text-ink-muted">+ {pages.length - 5} autre{pages.length - 5 > 1 ? 's' : ''}</li>
                  )}
                </ul>
              )}
            </div>

            {pages.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-muted">Dernière vérification</span>
                  <span className="text-xs font-medium text-ink-primary">
                    {(() => {
                      const latest = Math.max(...pages.map((p: any) => new Date(p.last_checked_at || 0).getTime()));
                      if (!latest) return 'Jamais';
                      const diffH = Math.floor((Date.now() - latest) / (1000 * 60 * 60));
                      if (diffH === 0) return 'Il y a moins d\'une heure';
                      return `Il y a ${diffH}h`;
                    })()}
                  </span>
                </div>
                {/* Nouveau : Nombre de changements récents cette semaine */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-muted">Changements cette semaine</span>
                  <Link 
                    to="/dashboard/historique" 
                    className="text-xs font-medium text-brand-text hover:underline"
                  >
                    {(() => {
                      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                      // Compter les changements de site (kind='change') de la semaine
                      const recentChanges = (data.siteChanges || []).filter((c: any) => 
                        new Date(c.detected_at).getTime() > oneWeekAgo
                      ).length;
                      return recentChanges > 0 ? `${recentChanges} détecté${recentChanges > 1 ? 's' : ''} →` : 'Aucun →';
                    })()}
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-muted">Audit Technique IA</span>
                  <span className="text-xs font-medium text-ink-primary">
                    {(() => {
                      const m = computeAuditMetrics(botAccess ?? null, pages);
                      if (!m) return 'Non vérifié';
                      const scoreColor = m.score >= 80 ? 'text-success' : m.score >= 50 ? 'text-warning' : 'text-danger';
                      return <span className={scoreColor}>{m.score}/100</span>;
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface p-5">
          <div className="flex items-center justify-between pb-4">
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
            <ul className="mt-3 space-y-3">
              {events.map((event: any) => {
                const isBonus = event.title === 'Nouveau crawl débloqué' || event.title.includes('débloqué')
                return (
                  <li key={event.id} className="flex gap-2.5">
                    <div className="mt-0.5 flex shrink-0 items-center justify-center">
                      {isBonus ? (
                        <div className="flex size-6 items-center justify-center rounded-full bg-warning/20">
                          <Zap className="size-3.5 text-warning" />
                        </div>
                      ) : (
                        <div className="flex size-6 items-center justify-center rounded-full bg-border/50">
                          <div className="size-1.5 rounded-full bg-ink-muted" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", isBonus ? "text-warning" : "text-ink-primary")}>
                        {event.title}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {new Date(event.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </li>
                )
              })}
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
  hasPreviousRun,
  isFree = false,
  freeSignalStatus = 'unmeasured',
}: {
  opportunities: any[]
  hasAnyRun: boolean
  hasPreviousRun: boolean
  isFree?: boolean
  freeSignalStatus?: 'unmeasured' | 'well_recommended' | 'negative'
}) {
  if (!hasAnyRun) {
    return (
      <p className="mt-3 text-sm text-ink-muted">
        Aucune mesure effectuée pour le moment — les opportunités apparaîtront ici.
      </p>
    )
  }
  if (opportunities.length === 0) {
    // Plan Free : le teaser d'opportunité (page /dashboard/opportunites) se
    // décide sur un seul run, pas sur 2 runs stables, et se génère dès la
    // visite de cette page — pas besoin d'un run supplémentaire. On reflète
    // donc directement ce verdict ici plutôt que de parler d'une mesure à
    // venir qui n'est pas nécessaire (voir #23).
    if (isFree && freeSignalStatus === 'well_recommended') {
      return (
        <div className="mt-3 rounded-md bg-elevated/50 p-3">
          <p className="text-sm text-ink-primary">✅ Bon signal</p>
          <p className="mt-1 text-xs text-ink-muted">
            Vous êtes recommandé sur votre question suivie — rien à signaler pour l'instant.
          </p>
        </div>
      )
    }
    if (isFree && freeSignalStatus === 'negative') {
      return (
        <div className="mt-3 rounded-md bg-elevated/50 p-3">
          <p className="text-sm text-ink-primary">💡 Signal détecté</p>
          <p className="mt-1 text-xs text-ink-muted">
            Votre question suivie n'est pas encore bien recommandée —{' '}
            <Link to="/dashboard/opportunites" className="underline hover:text-ink-secondary">
              voir le détail
            </Link>
            .
          </p>
        </div>
      )
    }
    // Sinon (jamais mesuré, ou plan Pro sans encore 2 runs stables), une
    // opportunité n'est validée qu'après ≥2 runs stables sur la même
    // question (garde-fou "evidence first") — distinguer ce cas d'un vrai
    // "rien à signaler" pour ne pas laisser croire à un dashboard
    // vide/cassé.
    if (!hasPreviousRun) {
      return (
        <div className="mt-3 rounded-md bg-elevated/50 p-3">
          <p className="text-sm text-ink-primary">🔍 Détection en cours</p>
          <p className="mt-1 text-xs text-ink-muted">
            Encore 1 mesure à faire avant de pouvoir confirmer une opportunité de façon fiable.
          </p>
        </div>
      )
    }
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
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink-primary cursor-default">
                  {o.title}
                </p>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] text-left">
                {o.title}
              </TooltipContent>
            </Tooltip>
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

type PageStatus = 'ok' | 'stale' | 'unavailable' | 'removed'
const PAGE_STATUS_LABEL: Record<PageStatus, string> = {
  ok: 'OK',
  stale: 'Périmée',
  unavailable: 'Inaccessible',
  removed: 'Supprimée',
}
const PAGE_STATUS_TEXT: Record<PageStatus, string> = {
  ok: 'text-success',
  stale: 'text-warning',
  unavailable: 'text-danger',
  removed: 'text-ink-muted',
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

// Skeleton calqué sur la structure réelle de l'Accueil : même conteneur
// (space-y-4), même header (score card 320px + colonne KPI unifiée +
// insight IA), mêmes 2 sections en grille + le bloc "Surveillance du
// site"/"Opportunités" — pour éviter tout layout shift au chargement des
// vraies données, plutôt qu'un message texte plaqué au centre de l'écran.
function AccueilSkeleton() {
  return (
    <div className="space-y-4">
      <header className="flex flex-col lg:flex-row lg:items-stretch gap-5 lg:gap-6">
        {/* Score Card */}
        <div className="flex w-full lg:w-[320px] shrink-0 flex-col justify-center rounded-xl border border-border bg-surface p-5 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-11 w-24" />
          <Skeleton className="mt-3 h-5 w-28 rounded" />
          <Skeleton className="mt-5 h-[90px] w-full" />
        </div>

        {/* Colonne droite : 4 KPI (carte unique avec séparateurs) + insight IA */}
        <div className="flex-1 flex flex-col gap-5 lg:gap-6 min-w-0">
          <div className="w-full grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border rounded-xl border-0 ring-1 ring-border/50 bg-surface overflow-hidden shadow-md">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col justify-between p-4 lg:p-5">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="size-7 rounded-md" />
                </div>
                <div className="mt-3 flex flex-col gap-1.5">
                  <Skeleton className="h-7 w-14" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto flex items-start gap-4 rounded-xl border border-border/50 bg-surface p-5 lg:p-6">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          </div>
        </div>
      </header>

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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <Skeleton className="h-4 w-32" />
          <div className="mt-3 space-y-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <Skeleton className="h-4 w-36" />
          <div className="mt-3 space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
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
