import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { X, Trash2, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createBrandWithQuestions } from '~/lib/queries/settings'
import { cn, isValidWebsiteUrl, normalizeWebsiteUrl, QUESTION_MAX_LENGTH } from '~/lib/utils'
import { FREE_MAX_QUESTIONS } from '~/lib/plan'
import { runFullMeasurement } from '~/lib/measurement-client'

// Point d'entrée unique pour sortir de l'état "compte sans marque" — ouvert
// depuis l'Accueil (État A) et depuis Paramètres → Site. Toute nouvelle marque
// démarre en plan Free (settings.ts, createBrandWithQuestions) : ce tiroir
// n'a donc jamais à distinguer les plans, il applique directement la limite
// Free (1 question, pas de génération IA — reflet-plan-free-spec.md §5).
export function BrandSetupDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [questions, setQuestions] = useState<string[]>([''])
  const [isMeasuring, setIsMeasuring] = useState(false)
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      createBrandWithQuestions({
        data: { name, websiteUrl: normalizeWebsiteUrl(websiteUrl), questions: questions.filter((q) => q.trim()) },
      }),
    onSuccess: async (data) => {
      if (data && data.brandId) {
        setIsMeasuring(true)
        toast.info('Marque configurée. Lancement de la première mesure...')
        try {
          // runFullMeasurement affiche déjà le toast correspondant au vrai
          // statut du run (success / partial / failed) — on ne rajoute pas
          // ici de toast de succès inconditionnel, sinon l'utilisateur voit
          // "Première mesure terminée !" même quand la mesure a échoué.
          await runFullMeasurement(data.brandId, queryClient, (p) => setProgress(p))
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Erreur inconnue'
          toast.error(`Erreur lors de la mesure : ${message}`)
        } finally {
          setIsMeasuring(false)
          setProgress(null)
          queryClient.invalidateQueries({ queryKey: ['dashboard-home'] })
          queryClient.invalidateQueries({ queryKey: ['settings'] })
          setName('')
          setWebsiteUrl('')
          setQuestions(['', '', ''])
          onClose()
        }
      }
    },
    onError: (err: Error) => toast.error(err.message || 'Impossible de configurer la marque.'),
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
                <span className="text-[11px] text-ink-muted">{filledQuestions}/{FREE_MAX_QUESTIONS}</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-muted">
                Ce que vos prospects pourraient demander à ChatGPT.
              </p>

              <div className="mt-4 flex flex-col gap-5">
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => removeQuestion(i)}
                                className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-danger/10 hover:text-danger"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Retirer</TooltipContent>
                          </Tooltip>
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
            </div>
          </div>
        </div>

        <div className="border-t border-border p-5">
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || isMeasuring}
            className="w-full rounded-md bg-brand px-3 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {isMeasuring 
              ? `Mesure en cours (${progress ? `${progress.completed}/${progress.total}` : '...' })` 
              : mutation.isPending 
                ? 'Configuration…' 
                : 'Configurer et lancer la mesure'}
          </button>
        </div>
      </aside>
    </>
  )
}
