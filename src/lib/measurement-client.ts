import { toast } from 'sonner'
import type { QueryClient } from '@tanstack/react-query'
import { triggerMeasurementRun, processNextQuestion, cancelMeasurementRun } from '~/lib/queries/measure'

// Logique de mesure partagée entre le bouton manuel (Dashboard) et le
// déclenchement automatique en fin d'onboarding — même boucle
// question-par-question, même toasts, un seul endroit à maintenir.

export interface MeasurementProgress {
  completed: number
  total: number
}

export async function runFullMeasurement(
  brandId: string,
  queryClient: QueryClient,
  onProgress?: (progress: MeasurementProgress) => void,
  signal?: AbortSignal
) {
  const { runId } = await triggerMeasurementRun({ data: { brandId } })
  toast.info('Mesure en cours…', { id: 'measure-progress', duration: Infinity })

  let done = false
  let lastResult: Awaited<ReturnType<typeof processNextQuestion>> | undefined

  while (!done) {
    if (signal?.aborted) {
      await cancelMeasurementRun({ data: { runId } })
      toast.dismiss('measure-progress')
      toast.error('Mesure annulée.')
      await queryClient.invalidateQueries({ queryKey: ['dashboard-home'] })
      return
    }

    const result = await processNextQuestion({ data: { runId } })
    lastResult = result
    done = result.done

    onProgress?.({
      completed: result.run.questions_completed,
      total: result.run.questions_total,
    })

    // Invalide les queries pour refléter la progression en temps réel
    await queryClient.invalidateQueries({ queryKey: ['dashboard-home'] })
    await queryClient.invalidateQueries({ queryKey: ['performance-overview'] })
  }

  toast.dismiss('measure-progress')

  if (lastResult) {
    if (lastResult.run.status === 'success') {
      toast.success(`Mesure terminée — score : ${lastResult.run.score ?? '—'}/100`, {
        duration: 6000,
      })
    } else if (lastResult.run.status === 'partial') {
      toast.warning(
        `Mesure partielle (${lastResult.run.questions_completed}/${lastResult.run.questions_total} questions réussies)`,
        { duration: 6000 },
      )
    } else {
      toast.error('La mesure a échoué — réessayez plus tard.', { duration: 6000 })
    }
  }

  return lastResult
}
