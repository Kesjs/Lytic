import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { fetchQuestionDetail } from '~/lib/queries/performance'

export function QuestionDrawer({
  questionId,
  onClose,
}: {
  questionId: string | null
  onClose: () => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['question-detail', questionId],
    queryFn: () => fetchQuestionDetail({ data: questionId as string }),
    enabled: !!questionId,
  })

  if (!questionId) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-canvas shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-sm font-semibold text-ink-primary">Détail de la question</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-elevated hover:text-ink-primary"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading || !data ? (
            <p className="text-sm text-ink-muted">Chargement…</p>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium text-ink-muted">Question</p>
                <p className="mt-1 text-sm text-ink-primary">{data.question.text}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-ink-muted">
                  Concurrents détectés
                </p>
                {data.competitors.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-muted">
                    Aucun concurrent détecté dans la dernière réponse observée.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {data.competitors.map((c, i) => (
                      <li
                        key={i}
                        className="rounded-md border border-border bg-elevated p-3 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-ink-primary">{c.name}</span>
                          {c.position !== null && (
                            <span className="text-xs text-ink-muted">Position #{c.position}</span>
                          )}
                        </div>
                        {c.contextExcerpt && (
                          <p className="mt-1 text-xs text-ink-secondary">{c.contextExcerpt}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-ink-muted">
                  Historique de la question
                </p>
                {data.history.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-muted">
                    Aucune mesure enregistrée pour cette question.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {data.history.map((h, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between rounded-md border border-border bg-elevated px-3 py-2 text-sm"
                      >
                        <span className="text-ink-secondary">
                          {h.completedAt
                            ? new Date(h.completedAt).toLocaleDateString('fr-FR')
                            : 'Date inconnue'}{' '}
                          via {h.engine}
                        </span>
                        <span className="flex items-center gap-2 text-xs">
                          <Dot value={h.mentioned} label="Mention" />
                          <Dot value={h.recommended} label="Reco." />
                          <span className="text-ink-muted">
                            {h.position !== null ? `#${h.position}` : '—'}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-ink-muted">
                  Preuves pertinentes
                </p>
                {!data.history[0]?.rawAnswer ? (
                  <p className="mt-2 text-sm text-ink-muted">
                    Aucune réponse observée disponible pour l'instant.
                  </p>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap rounded-md border border-border bg-elevated p-3 text-sm text-ink-secondary">
                    {data.history[0].rawAnswer}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

function Dot({ value, label }: { value: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1" title={label}>
      <span className={`size-1.5 rounded-full ${value ? 'bg-success' : 'bg-ink-muted/40'}`} />
      <span className="text-ink-muted">{label}</span>
    </span>
  )
}
