import { cn } from '~/lib/utils'

// Pastille + libellé pour un booléen oui/non (mention, recommandation…).
// Partagé entre l'Accueil et Performance pour éviter deux implémentations
// visuellement différentes du même concept.
export function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
        active
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
          : 'bg-ink-muted/10 text-ink-secondary',
      )}
    >
      <div className={cn('size-1.5 rounded-full', active ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-ink-muted')} />
      {label}
    </div>
  )
}
