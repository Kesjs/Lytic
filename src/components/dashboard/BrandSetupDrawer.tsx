import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Plus, Trash2, Sparkles } from 'lucide-react'
import { createBrandWithQuestions, generateQuestionsWithGemini } from '~/lib/queries/settings'
import { cn, isValidWebsiteUrl, QUESTION_MAX_LENGTH } from '~/lib/utils'
import { ShiningButton } from '~/components/ui/shining-button'

// Point d'entrée unique pour sortir de l'état "compte sans marque" — ouvert
// depuis l'Accueil (État A) et depuis Paramètres → Site. Saisie manuelle
// des questions : pas de génération/scraping auto dans cette version
// (cf. décision prise avec l'utilisateur sur le reste-a-faire.md).
export function BrandSetupDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [questions, setQuestions] = useState<string[]>(['', '', ''])

  const mutation = useMutation({
    mutationFn: () =>
      createBrandWithQuestions({
        data: { name, websiteUrl, questions: questions.filter((q) => q.trim()) },
      }),
    onSuccess: () => {
      toast.success('Marque configurée — vous pouvez maintenant lancer une mesure.')
      queryClient.invalidateQueries({ queryKey: ['dashboard-home'] })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setName('')
      setWebsiteUrl('')
      setQuestions(['', '', ''])
      onClose()
    },
    onError: (err: Error) => toast.error(err.message || 'Impossible de configurer la marque.'),
  })

  const generateQuestionsMutation = useMutation({
    mutationFn: () => generateQuestionsWithGemini({ data: { name, websiteUrl } }),
    onSuccess: (data) => {
      setQuestions(data.length > 0 ? data : [''])
      toast.success('Questions générées par l\'IA !')
    },
    onError: (err: Error) => toast.error(err.message || 'Impossible de générer les questions.'),
  })

  if (!open) return null

  function updateQuestion(i: number, value: string) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? value : q)))
  }

  function removeQuestion(i: number) {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i))
  }

  function addQuestionField() {
    if (questions.length >= 30) return
    setQuestions((qs) => [...qs, ''])
  }

  const filledQuestions = questions.filter((q) => q.trim()).length
  const urlTouched = websiteUrl.trim().length > 0
  const urlValid = useMemo(() => isValidWebsiteUrl(websiteUrl), [websiteUrl])
  const hasOverlongQuestion = questions.some((q) => q.length > QUESTION_MAX_LENGTH)
  const canSubmit =
    name.trim() &&
    urlValid &&
    filledQuestions > 0 &&
    !hasOverlongQuestion &&
    !mutation.isPending

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-canvas shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-display text-sm font-semibold text-ink-primary">
              Configurer ma marque
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Reflet mesure la visibilité d'une seule marque par compte.
            </p>
          </div>
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
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-ink-secondary">Nom de la marque</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ma Marque"
                className="mt-1 w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand/50"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-ink-secondary">Site web</span>
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://votre-site.fr"
                className={cn(
                  'mt-1 w-full rounded-md border bg-elevated px-3 py-2 text-sm text-ink-primary outline-none',
                  urlTouched && !urlValid
                    ? 'border-danger/60 focus:border-danger'
                    : 'border-border focus:border-brand/50',
                )}
              />
              {urlTouched && !urlValid && (
                <p className="mt-1 text-[11px] text-danger">
                  URL invalide — utilisez un format du type https://votre-site.fr
                </p>
              )}
            </label>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-secondary">
                  Questions à suivre
                </span>
                <span className="text-[11px] text-ink-muted">{filledQuestions}/30</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-muted">
                Ce que vos prospects pourraient demander à ChatGPT — au moins une pour commencer.
              </p>
              
              <ShiningButton
                type="button"
                onClick={() => generateQuestionsMutation.mutate()}
                disabled={!name.trim() || !urlValid || generateQuestionsMutation.isPending}
                className="mt-3 w-full gap-1.5"
              >
                <Sparkles className="size-3.5" />
                {generateQuestionsMutation.isPending ? 'Génération en cours...' : 'Générer avec l\'IA'}
              </ShiningButton>

              <div className="mt-4 space-y-2">
                {questions.map((q, i) => {
                  const overlong = q.length > QUESTION_MAX_LENGTH
                  const nearLimit = !overlong && q.length > QUESTION_MAX_LENGTH * 0.9
                  return (
                    <div key={i}>
                      <div className="flex items-center gap-2">
                        <input
                          value={q}
                          onChange={(e) => updateQuestion(i, e.target.value)}
                          placeholder={`Question ${i + 1}…`}
                          className={cn(
                            'flex-1 rounded-md border bg-elevated px-3 py-2 text-sm text-ink-primary outline-none',
                            overlong
                              ? 'border-danger/60 focus:border-danger'
                              : 'border-border focus:border-brand/50',
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => removeQuestion(i)}
                          className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-danger/10 hover:text-danger"
                          title="Retirer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      {(overlong || nearLimit) && (
                        <p
                          className={cn(
                            'mt-1 text-right text-[11px]',
                            overlong ? 'text-danger' : 'text-warning',
                          )}
                        >
                          {q.length}/{QUESTION_MAX_LENGTH}
                          {overlong ? ' — trop long' : ''}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={addQuestionField}
                disabled={questions.length >= 30}
                className="mt-2 flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink-secondary hover:text-ink-primary disabled:opacity-50"
              >
                <Plus className="size-3.5" />
                Ajouter une question
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-border p-5">
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            className="w-full rounded-md bg-brand px-3 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {mutation.isPending ? 'Configuration…' : 'Configurer ma marque'}
          </button>
        </div>
      </aside>
    </>
  )
}
