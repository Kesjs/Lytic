import { useState } from 'react'
import { toast } from 'sonner'
import { Zap, Clock } from 'lucide-react'

// Mesure manuelle (§26 du doc de conception) : permet à l'utilisateur de
// vérifier un changement plus tôt, sans devenir un moyen de contourner les
// limites techniques — d'où le délai de 7 jours entre deux mesures
// manuelles. Le Measurement Engine n'est pas encore branché (§7) : le
// bouton et la logique de délai sont donc construits dès maintenant, mais
// le déclenchement reste un stub honnête — jamais de faux toast de succès
// pour une mesure qui n'a pas réellement été lancée (règle §36D.9).
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
}: {
  lastCompletedAt: string | null
  hasBrand: boolean
}) {
  const [pending, setPending] = useState(false)
  const remaining = daysRemaining(lastCompletedAt)
  const isAvailable = hasBrand && remaining === 0

  function handleClick() {
    if (!isAvailable || pending) return
    setPending(true)
    // Stub assumé : pas de vrai run tant que le Measurement Engine n'est
    // pas câblé. On informe plutôt que de simuler un succès.
    toast.info('Le moteur de mesure n\u2019est pas encore branché — cette action sera bientôt disponible.')
    setPending(false)
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
        Prochaine mesure manuelle dans {remaining} jour{remaining > 1 ? 's' : ''}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="flex items-center gap-1.5 rounded-md border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-text transition-colors hover:bg-brand/20 disabled:opacity-50"
    >
      <Zap className="size-3.5" />
      Mesurer maintenant
    </button>
  )
}
