import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchDashboardHome, type QuestionPerf, type CompetitorMini } from '~/lib/queries/dashboard'
import { fetchBotAccess } from '~/lib/queries/bot-access'
import { ScoreChart } from '~/components/dashboard/ScoreChart'
import { BrandSetupDrawer } from '~/components/dashboard/BrandSetupDrawer'
import { DashboardStateView, deriveRunFreshness } from '~/components/dashboard/DashboardState'
import { Skeleton } from '~/components/ui/skeleton'
import { BotAccessCard } from '~/components/dashboard/BotAccessCard'

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

  const { brand, latestRun, opportunities, events, pages, kpis, questionsPerf, topCompetitors } =
    data

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="flex min-h-[220px] flex-col justify-center rounded-lg border border-border bg-surface p-5">
          {latestRun?.status === 'measuring' || latestRun?.status === 'pending' ? (
            <RunStatusState status={latestRun.status} run={latestRun} />
          ) : (
            <>
              <p className="text-sm text-ink-secondary">Bonjour, {brand.name}</p>
              <p className="mt-3 text-xs font-medium text-ink-muted">Visibilité IA</p>

              {!latestRun ? (
                <DashboardStateView state="no_data" compact className="mt-4" />
              ) : (
                <>
                  {latestRun.score !== null ? (
                    <>
                      <div className="mt-1 font-display text-4xl font-bold tabular-nums text-brand-text">
                        {Math.round(latestRun.score)} <span className="text-lg text-ink-muted">/ 100</span>
                      </div>
                      {latestRun.score_delta !== null && (
                        <p
                          className={`mt-1 text-sm ${
                            latestRun.score_delta >= 0 ? 'text-success' : 'text-danger'
                          }`}
                        >
                          {latestRun.score_delta >= 0 ? '↑' : '↓'} {Math.abs(latestRun.score_delta)} depuis
                          la dernière mesure
                        </p>
                      )}
                      <p className="mt-2 text-xs text-ink-muted">
                        Dernière mesure :{' '}
                        {latestRun.completed_at
                          ? new Date(latestRun.completed_at).toLocaleDateString('fr-FR')
                          : '—'}
                      </p>
                      {deriveRunFreshness(latestRun.completed_at) === 'stale' && (
                        <DashboardStateView state="stale" compact className="mt-2 !py-0" />
                      )}
                      {latestRun.status === 'partial' && (
                        <DashboardStateView state="partial" compact className="mt-2 !py-0" />
                      )}
                    </>
                  ) : (
                    <RunStatusState status={latestRun.status} run={latestRun} />
                  )}
                </>
              )}
            </>
          )}
        </div>

        <ScoreChart hasAnyRun={!!latestRun} />
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Mentions"
          value={kpis.mentionsPct !== null ? `${kpis.mentionsPct}%` : null}
          hint="Sur les questions suivies"
        />
        <KpiCard
          label="Recommandations"
          value={kpis.recommendationsPct !== null ? `${kpis.recommendationsPct}%` : null}
          hint="Sur les questions suivies"
        />
        <KpiCard
          label="Position moyenne"
          value={kpis.avgPosition !== null ? `#${kpis.avgPosition}` : null}
          hint="Quand mentionné"
        />
        <KpiCard
          label="Présence concurrentielle"
          value={
            kpis.competitivePresencePct !== null ? `${kpis.competitivePresencePct}%` : null
          }
          hint="Vs. concurrents détectés"
        />
      </section>

      <section>
        <BotAccessCard data={botAccess ?? null} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink-primary">Opportunités</h2>
          {opportunities.length === 0 ? (
            <DashboardStateView state={latestRun ? 'no_opportunity' : 'no_data'} compact />
          ) : (
            <ul className="mt-3 space-y-2">
              {opportunities.map((opp: any) => (
                <li
                  key={opp.id}
                  className="rounded-md border border-border bg-elevated px-3 py-2 text-sm text-ink-primary"
                >
                  <div className="flex items-center justify-between">
                    <span>{opp.title}</span>
                    <PriorityBadge priority={opp.priority} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink-primary">Activité récente</h2>
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

      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-primary">Performance des questions</h2>
          <Link
            to="/dashboard/performance"
            className="text-xs text-ink-muted hover:text-ink-secondary"
          >
            Toutes les questions →
          </Link>
        </div>
        <QuestionsPerfTable questions={questionsPerf} hasAnyRun={!!latestRun} />
      </section>

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
    </div>
  )
}

function QuestionsPerfTable({
  questions,
  hasAnyRun,
}: {
  questions: QuestionPerf[]
  hasAnyRun: boolean
}) {
  if (!hasAnyRun) {
    return (
      <p className="mt-3 text-sm text-ink-muted">
        Aucune mesure effectuée pour le moment — les questions suivies apparaîtront ici.
      </p>
    )
  }
  if (questions.length === 0) {
    return (
      <p className="mt-3 text-sm text-ink-muted">
        Aucune donnée par question pour la dernière mesure.
      </p>
    )
  }
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium text-ink-muted">
            <th className="pb-2 font-medium">Question</th>
            <th className="pb-2 pl-4 text-right font-medium">Mention</th>
            <th className="pb-2 pl-4 text-right font-medium">Reco.</th>
            <th className="pb-2 pl-4 text-right font-medium">Position</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id} className="border-b border-border/50 last:border-0">
              <td className="py-2 pr-4 text-ink-primary">{q.text}</td>
              <td className="py-2 pl-4 text-right">
                <BoolDot value={q.mentioned} />
              </td>
              <td className="py-2 pl-4 text-right">
                <BoolDot value={q.recommended} />
              </td>
              <td className="py-2 pl-4 text-right text-ink-secondary">
                {q.position !== null ? `#${q.position}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

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
      <p className="mt-3 text-sm text-ink-muted">
        Aucun concurrent détecté dans les réponses observées pour l'instant.
      </p>
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

function BoolDot({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-block size-2 rounded-full ${value ? 'bg-success' : 'bg-ink-muted/40'}`}
      aria-label={value ? 'Oui' : 'Non'}
    />
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

function KpiCard({ label, value, hint }: { label: string; value: string | null; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-ink-secondary">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink-primary">{value ?? '—'}</p>
      <p className="mt-1 text-xs text-ink-muted">{hint}</p>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: 'low' | 'medium' | 'high' }) {
  const styles = {
    low: 'bg-ink-muted/15 text-ink-secondary',
    medium: 'bg-warning/15 text-warning',
    high: 'bg-danger/15 text-danger',
  } as const
  const labels = { low: 'Faible', medium: 'Moyenne', high: 'Haute' } as const

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[priority]}`}>
      {labels[priority]}
    </span>
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