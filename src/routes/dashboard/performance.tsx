import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchPerformanceOverview, type PerformanceQuestionRow } from '~/lib/queries/performance'
import { PerformanceChart } from '~/components/dashboard/PerformanceChart'
import { QuestionDrawer } from '~/components/dashboard/QuestionDrawer'
import { DashboardStateView, deriveRunFreshness } from '~/components/dashboard/DashboardState'

export const Route = createFileRoute('/dashboard/performance')({
  component: PerformancePage,
})

function PerformancePage() {
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['performance-overview'],
    queryFn: () => fetchPerformanceOverview(),
  })

  if (isLoading) {
    return <DashboardStateView state="loading" />
  }

  if (!data?.brand) {
    return <DashboardStateView state="no_data" title="Aucune marque configurée" description="Ajoutez votre marque dans Paramètres pour commencer à suivre votre visibilité IA." />
  }

  const { latestRun, questions } = data
  const hasAnyRun = !!latestRun

  if (!latestRun) {
    return <DashboardStateView state="no_data" />
  }

  if (latestRun.status === 'failed') {
    return <DashboardStateView state="failed" />
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
        {latestRun.status === 'success' && latestRun.score !== null ? (
          <>
            <div className="mt-1 font-display text-3xl font-bold tabular-nums text-brand-text">
              {Math.round(latestRun.score)} <span className="text-base text-ink-muted">/ 100</span>
            </div>
            {latestRun.score_delta !== null && (
              <p
                className={`mt-1 text-sm ${latestRun.score_delta >= 0 ? 'text-success' : 'text-danger'}`}
              >
                {latestRun.score_delta >= 0 ? '↑' : '↓'} {Math.abs(latestRun.score_delta)} depuis
                la dernière mesure
              </p>
            )}
          </>
        ) : (
          <DashboardStateView state={latestRun.status === 'partial' ? 'partial' : 'stale'} compact className="mt-2" />
        )}
        {latestRun.status === 'success' && deriveRunFreshness(latestRun.completed_at) === 'stale' && (
          <DashboardStateView state="stale" compact className="mt-2 !py-0" />
        )}
      </header>

      <PerformanceChart hasAnyRun={hasAnyRun} />

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink-primary">Questions suivies</h2>
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
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium text-ink-muted">
            <th className="pb-2 font-medium">Question</th>
            <th className="pb-2 pl-4 text-right font-medium">Mention</th>
            <th className="pb-2 pl-4 text-right font-medium">Recommandation</th>
            <th className="pb-2 pl-4 text-right font-medium">Position</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr
              key={q.id}
              onClick={() => onOpen(q.id)}
              className="cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-elevated"
            >
              <td className="max-w-md truncate py-2.5 pr-4 text-ink-primary">{q.text}</td>
              {!hasAnyRun || !q.hasObservation ? (
                <td colSpan={3} className="py-2.5 pl-4 text-right text-xs text-ink-muted">
                  {hasAnyRun ? 'Pas de donnée pour la dernière mesure' : 'Pas encore mesurée'}
                </td>
              ) : (
                <>
                  <td className="py-2.5 pl-4 text-right">
                    <BoolDot value={q.mentioned} />
                  </td>
                  <td className="py-2.5 pl-4 text-right">
                    <BoolDot value={q.recommended} />
                  </td>
                  <td className="py-2.5 pl-4 text-right text-ink-secondary">
                    {q.position !== null ? `#${q.position}` : '—'}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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


