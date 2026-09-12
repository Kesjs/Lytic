import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchDashboardHome } from '~/lib/queries/dashboard'

export const Route = createFileRoute('/dashboard/')({
  component: AccueilPage,
})

function AccueilPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-home'],
    queryFn: () => fetchDashboardHome(),
  })

  if (isLoading) {
    return <StateMessage title="Chargement…" description="Récupération de vos données Reflet." />
  }

  if (!data?.brand) {
    // État "No data" — aucune marque configurée pour ce compte.
    return (
      <StateMessage
        title="Aucune marque configurée"
        description="Ajoutez votre marque dans Paramètres pour commencer à suivre votre visibilité IA."
      />
    )
  }

  const { brand, latestRun, previousRun, opportunities, events, pages } = data

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-sm text-ink-secondary">Bonjour, {brand.name}</p>
          <p className="mt-3 text-xs uppercase tracking-wide text-ink-muted">Visibilité IA</p>

          {!latestRun ? (
            <p className="mt-1 text-sm text-ink-secondary">
              Aucune mesure effectuée pour le moment.
            </p>
          ) : latestRun.status === 'success' && latestRun.score !== null ? (
            <>
              <div className="mt-1 text-4xl font-bold text-brand-text">
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
            </>
          ) : (
            <RunStatusBadge status={latestRun.status} run={latestRun} />
          )}
        </div>

        <div className="flex items-center justify-center rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
          {previousRun ? 'Graphique d\u2019évolution (à venir)' : 'Pas encore assez de mesures pour un graphique'}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Mentions"
          value={latestRun?.status === 'success' ? '—' : null}
          hint="Sur les questions suivies"
        />
        <KpiCard label="Recommandations" value={null} hint="Sur les questions suivies" />
        <KpiCard label="Position moyenne" value={null} hint="Quand mentionné" />
        <KpiCard label="Présence concurrentielle" value={null} hint="Vs. concurrents détectés" />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink-primary">Opportunités</h2>
          {opportunities.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              Aucune opportunité détectée pour l'instant.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {opportunities.map((opp) => (
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
              {events.map((event) => (
                <li key={event.id} className="text-sm text-ink-secondary">
                  <span className="text-ink-primary">{event.title}</span>{' '}
                  <span className="text-xs text-ink-muted">
                    · {new Date(event.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink-primary">Surveillance du site</h2>
        {pages.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            Aucune page suivie — configurez votre site dans Paramètres.
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-secondary">
            {pages.length} page{pages.length > 1 ? 's' : ''} suivie
            {pages.length > 1 ? 's' : ''} ·{' '}
            {pages.filter((p) => p.status === 'ok').length} vérifiée
            {pages.filter((p) => p.status === 'ok').length > 1 ? 's' : ''} récemment
          </p>
        )}
      </section>
    </div>
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

function KpiCard({ label, value, hint }: { label: string; value: string | null; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-ink-secondary">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink-primary">{value ?? '—'}</p>
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

function RunStatusBadge({
  status,
  run,
}: {
  status: 'pending' | 'measuring' | 'partial' | 'failed'
  run: { questions_total: number; questions_completed: number }
}) {
  const labels: Record<typeof status, string> = {
    pending: 'Mesure en attente',
    measuring: `Mesure en cours (${run.questions_completed}/${run.questions_total})`,
    partial: `Mesure partielle (${run.questions_completed}/${run.questions_total} questions)`,
    failed: 'La dernière mesure a échoué',
  }
  return <p className="mt-1 text-sm text-ink-secondary">{labels[status]}</p>
}
