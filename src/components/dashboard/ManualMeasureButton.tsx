import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Zap, Clock, Loader2 } from 'lucide-react'
import { runFullMeasurement } from '~/lib/measurement-client'

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
      await runFullMeasurement(brandId, queryClient, (p) => setProgress(p))
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
