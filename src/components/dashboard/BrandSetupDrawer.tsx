import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Plus, Trash2, Sparkles, Globe, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createBrandWithQuestions, generateQuestionsWithGemini } from '~/lib/queries/settings'
import { cn, isValidWebsiteUrl, normalizeWebsiteUrl, QUESTION_MAX_LENGTH } from '~/lib/utils'
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
        data: { name, websiteUrl: normalizeWebsiteUrl(websiteUrl), questions: questions.filter((q) => q.trim()) },
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
    mutationFn: () => generateQuestionsWithGemini({ data: { name, websiteUrl: normalizeWebsiteUrl(websiteUrl) } }),
    onSuccess: (data) => {
      setQuestions(data.length > 0 ? data : [''])
      toast.success('Questions générées par l\'IA !')
    },
    onError: (err: Error) => {
      const msg = err.message || ''
      if (msg.includes('503') || msg.includes('Service Unavailable') || msg.includes('high demand') || msg.includes('overloaded')) {
        toast.error("L'IA est temporairement très sollicitée. Veuillez réessayer dans quelques instants.")
      } else {
        toast.error('Impossible de générer les questions.')
      }
    },
  })

  // urlValid doit être calculé avant tout early-return : sinon le nombre de
  // hooks appelés change entre le rendu fermé (open=false) et le rendu
  // ouvert (open=true), ce qui viole les Rules of Hooks et déclenche
  // React error #310 dès l'ouverture du tiroir.
  const urlValid = useMemo(() => isValidWebsiteUrl(normalizeWebsiteUrl(websiteUrl)), [websiteUrl])

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
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-canvas shadow-2xl animate-in slide-in-from-right duration-300 ease-out">
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
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Globe className="size-4 text-ink-muted" />
                </div>
                <input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  onBlur={() => setWebsiteUrl((v) => normalizeWebsiteUrl(v))}
                  placeholder="tondomaine.com"
                  className={cn(
                    'w-full rounded-md border bg-elevated py-2 pl-9 pr-3 text-sm text-ink-primary outline-none',
                    urlTouched && !urlValid
                      ? 'border-danger/60 focus:border-danger'
                      : 'border-border focus:border-brand/50',
                  )}
                />
              </div>
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
                {generateQuestionsMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {generateQuestionsMutation.isPending ? 'Génération en cours...' : 'Générer avec l\'IA'}
              </ShiningButton>

              <div className="mt-4 space-y-2">
                <AnimatePresence initial={false}>
                  {questions.map((q, i) => {
                    const overlong = q.length > QUESTION_MAX_LENGTH
                    const nearLimit = !overlong && q.length > QUESTION_MAX_LENGTH * 0.9
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-2">
                          <textarea
                            value={q}
                            rows={2}
                            onChange={(e) => updateQuestion(i, e.target.value)}
                            placeholder={`Question ${i + 1}…`}
                            className={cn(
                              'flex-1 resize-none rounded-md border bg-elevated px-3 py-2 text-sm text-ink-primary outline-none overflow-y-auto',
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
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
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
