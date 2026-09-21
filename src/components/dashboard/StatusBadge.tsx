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
          ? 'bg-success/10 text-success dark:bg-success/10 dark:text-success'
          : 'bg-ink-muted/10 text-ink-secondary',
      )}
    >
      <div className={cn('size-1.5 rounded-full', active ? 'bg-success dark:bg-success' : 'bg-ink-muted')} />
      {label}
    </div>
  )
}
