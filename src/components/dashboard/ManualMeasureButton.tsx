import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Zap, Clock, Loader2 } from 'lucide-react'
import { triggerMeasurementRun, processNextQuestion } from '~/lib/queries/measure'

// Mesure manuelle (§26 du doc de conception).
// Délai de 7 jours entre deux mesures manuelles — contrôle de coût.
// Architecture boucle côté client : chaque appel à processNextQuestion
// traite une question (1 aller-retour LLM) pour rester dans les limites
// de durée d'une fonction serverless Vercel.
const DELAY_DAYS = 7

function daysRemaining(lastCompletedAt: string | null): number {
  if (!lastCompletedAt) return 0
  const elapsedMs = Date.now() - new Date(lastCompletedAt).getTime()
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.ceil(DELAY_DAYS - elapsedDays))
}

export function ManualMeasureButton({
  lastCompletedAt,
  hasBrand,
  brandId,
}: {
  lastCompletedAt: string | null
  hasBrand: boolean
  brandId: string
}) {
  const [pending, setPending] = useState(false)
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null)
  const queryClient = useQueryClient()
  const remaining = daysRemaining(lastCompletedAt)
  const isAvailable = hasBrand && remaining === 0

  async function handleClick() {
    if (!isAvailable || pending) return
    setPending(true)
    setProgress(null)

    try {
      // Étape 1 : créer le run
      const { runId } = await triggerMeasurementRun({ data: { brandId } })
      toast.info('Mesure en cours…', { id: 'measure-progress', duration: Infinity })

      // Étape 2 : boucle séquentielle — une question par appel
      let done = false
      while (!done) {
        const result = await processNextQuestion({ data: { runId } })
        done = result.done

        setProgress({
          completed: result.run.questions_completed,
          total: result.run.questions_total,
        })

        // Invalide les queries pour refléter la progression en temps réel
        await queryClient.invalidateQueries({ queryKey: ['dashboard-home'] })
        await queryClient.invalidateQueries({ queryKey: ['performance-overview'] })

        if (done) {
          toast.dismiss('measure-progress')

          if (result.run.status === 'success') {
            toast.success(
              `Mesure terminée — score : ${result.run.score ?? '—'}/100`,
              { duration: 6000 },
            )
          } else if (result.run.status === 'partial') {
            toast.warning(
              `Mesure partielle (${result.run.questions_completed}/${result.run.questions_total} questions réussies)`,
              { duration: 6000 },
            )
          } else {
            toast.error('La mesure a échoué — réessayez plus tard.', { duration: 6000 })
          }
        }
      }
    } catch (err) {
      toast.dismiss('measure-progress')
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      toast.error(`Erreur : ${message}`)
    } finally {
      setPending(false)
      setProgress(null)
    }
  }

  if (!hasBrand) return null

  if (!isAvailable) {
    return (
      <button
        type="button"
        disabled
        title={`Prochaine mesure manuelle disponible dans ${remaining} jour${remaining > 1 ? 's' : ''}`}
        className="flex items-center gap-1.5 rounded-md border border-border bg-elevated px-3 py-1.5 text-xs font-medium text-ink-muted opacity-70"
      >
        <Clock className="size-3.5" />
        Prochaine mesure dans {remaining} jour{remaining > 1 ? 's' : ''}
      </button>
    )
  }

  if (pending) {
    return (
      <button
        type="button"
        disabled
        className="flex items-center gap-1.5 rounded-md border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-text opacity-80"
      >
        <Loader2 className="size-3.5 animate-spin" />
        {progress
          ? `${progress.completed}/${progress.total} questions…`
          : 'Démarrage…'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-1.5 rounded-md border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-text transition-colors hover:bg-brand/20"
    >
      <Zap className="size-3.5" />
      Mesurer maintenant
    </button>
  )
}
