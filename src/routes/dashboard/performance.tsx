import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchPerformanceOverview, type PerformanceQuestionRow } from '~/lib/queries/performance'
import { PerformanceChart } from '~/components/dashboard/PerformanceChart'
import { ResponsiveTable } from '~/components/dashboard/ResponsiveTable'
import { QuestionDrawer } from '~/components/dashboard/QuestionDrawer'
import { DashboardStateView, deriveRunFreshness } from '~/components/dashboard/DashboardState'
import { isFreePlan } from '~/lib/plan'

export const Route = createFileRoute('/dashboard/performance')({
  component: PerformancePage,
})

function PerformancePage() {
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['performance-overview'],
    queryFn: () => fetchPerformanceOverview(),
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

  const { latestRun, displayRun, questions } = data
  const hasAnyRun = !!displayRun

  if (!displayRun) {
    return <DashboardStateView state="no_data" />
  }



  if (latestRun.status === 'measuring') {
    return <DashboardStateView state="measuring" description={`${latestRun.questions_completed}/${latestRun.questions_total} questions mesurées…`} />
  }

  if (latestRun.status === 'pending') {
    return <DashboardStateView state="measuring" title="Mesure en attente…" />
  }

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-border bg-surface p-5">
        <p className="text-xs font-medium text-ink-muted">Visibilité IA</p>
        {displayRun.score !== null ? (
          <>
            <div className="mt-1 font-display text-3xl font-bold tabular-nums text-brand-text">
              {Math.round(displayRun.score)} <span className="text-base text-ink-muted">/ 100</span>
            </div>
            {displayRun.score_delta !== null && (
              <p
                className={`mt-1 text-sm ${displayRun.score_delta >= 0 ? 'text-success' : 'text-danger'}`}
              >
                {displayRun.score_delta >= 0 ? '↑' : '↓'} {Math.abs(displayRun.score_delta)} depuis
                la dernière mesure
              </p>
            )}
            {latestRun?.status === 'failed' && (
              <p className="mt-2 text-xs font-semibold text-danger">
                La dernière tentative de mesure a échoué.
              </p>
            )}
            {isFreePlan(data.brand.plan) && (
              <p className="mt-1 text-[11px] text-ink-muted">
                Basé sur 1 seul échantillon — moins fiable que la mesure Pro multi-échantillons.
              </p>
            )}
          </>
        ) : (
          <DashboardStateView state={displayRun.status === 'partial' ? 'partial' : 'stale'} compact className="mt-2" />
        )}
        {displayRun.status === 'success' && deriveRunFreshness(displayRun.completed_at) === 'stale' && (
          <DashboardStateView state="stale" compact className="mt-2 !py-0" />
        )}
      </header>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-primary">Évolution du score</h2>
        <PerformanceChart hasAnyRun={hasAnyRun} free={isFreePlan(data.brand.plan)} />
      </div>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-primary">Questions suivies</h2>
        <QuestionsTable
          questions={questions}
          hasAnyRun={hasAnyRun}
          onOpen={(id) => setOpenQuestionId(id)}
        />
      </section>

      <QuestionDrawer questionId={openQuestionId} onClose={() => setOpenQuestionId(null)} />
    </div>
  )
}

function QuestionsTable({
  questions,
  hasAnyRun,
  onOpen,
}: {
  questions: PerformanceQuestionRow[]
  hasAnyRun: boolean
  onOpen: (id: string) => void
}) {
  if (questions.length === 0) {
    return (
      <p className="mt-3 text-sm text-ink-muted">
        Aucune question configurée — ajoutez vos questions dans Paramètres.
      </p>
    )
  }

  return (
    <ResponsiveTable
      data={questions}
      getRowKey={(q) => q.id}
      pageSize={8}
      columns={[
        { key: 'q', header: 'Question' },
        { key: 'mention', header: 'Mention', align: 'right' },
        { key: 'reco', header: 'Recommandation', align: 'right' },
        { key: 'pos', header: 'Position', align: 'right' },
      ]}
      renderDesktopRow={(q) => (
        <tr
          onClick={() => onOpen(q.id)}
          className="cursor-pointer transition-colors hover:bg-elevated/50"
        >
          <td className="px-3 py-3.5">
            <div className="max-w-[260px] truncate text-ink-primary lg:max-w-[360px]" title={q.text}>
              {q.text}
            </div>
          </td>
          {!hasAnyRun || !q.hasObservation ? (
            <td colSpan={3} className="px-3 py-3.5 text-right text-xs text-ink-muted">
              {hasAnyRun ? 'Pas de donnée pour la dernière mesure' : 'Pas encore mesurée'}
            </td>
          ) : (
            <>
              <td className="px-3 py-3.5 text-right">
                <BoolDot value={q.mentioned} />
              </td>
              <td className="px-3 py-3.5 text-right">
                <BoolDot value={q.recommended} />
              </td>
              <td className="px-3 py-3.5 text-right text-ink-secondary">
                {q.position !== null ? `#${q.position}` : '—'}
              </td>
            </>
          )}
        </tr>
      )}
      renderMobileCard={(q) => (
        <button
          type="button"
          onClick={() => onOpen(q.id)}
          className="flex w-full flex-col items-start gap-1.5 px-5 py-3 text-left"
        >
          <p className="line-clamp-2 text-sm font-medium leading-snug text-ink-primary">{q.text}</p>
          {!hasAnyRun || !q.hasObservation ? (
            <span className="text-xs text-ink-muted">
              {hasAnyRun ? 'Pas de donnée pour la dernière mesure' : 'Pas encore mesurée'}
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-3 text-xs text-ink-secondary">
              <span className="inline-flex items-center gap-1.5">
                <BoolDot value={q.mentioned} /> Mention
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BoolDot value={q.recommended} /> Reco
              </span>
              <span className="tabular-nums text-ink-muted">
                {q.position !== null ? `#${q.position}` : '—'}
              </span>
            </div>
          )}
        </button>
      )}
    />
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


