import type { LucideIcon } from 'lucide-react'
import {
  Loader2,
  Search,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Minus,
  Lightbulb,
  XCircle,
  WifiOff,
  Clock,
} from 'lucide-react'
import { cn } from '~/lib/utils'
import { Skeleton } from '~/components/ui/skeleton'

// Système d'états visuels formalisé (§36D.10 du doc de conception).
// Chaque page du dashboard doit distinguer explicitement ces 11 états —
// en particulier "No data" (jamais mesuré) de "No change" (mesuré, rien
// n'a bougé) et de "Stale" (mesuré, mais périmé). Composant construit à
// vide, sans données réelles : à réutiliser sur Performance, Concurrents,
// Opportunités et Historique au fur et à mesure du branchement du
// Measurement Engine.
export type DashboardStateKind =
  | 'loading'
  | 'analyzing'
  | 'measuring'
  | 'partial'
  | 'success'
  | 'no_data'
  | 'no_change'
  | 'no_opportunity'
  | 'failed'
  | 'unavailable'
  | 'stale'

interface StateConfig {
  icon: LucideIcon
  defaultTitle: string
  defaultDescription: string
  tone: 'neutral' | 'brand' | 'warning' | 'danger' | 'success'
  spin?: boolean
}

const STATE_CONFIG: Record<DashboardStateKind, StateConfig> = {
  loading: {
    icon: Loader2,
    defaultTitle: 'Chargement…',
    defaultDescription: 'Récupération de vos données Reflet.',
    tone: 'neutral',
    spin: true,
  },
  analyzing: {
    icon: Search,
    defaultTitle: 'Analyse en cours…',
    defaultDescription: 'Reflet examine votre site avant de lancer la mesure.',
    tone: 'brand',
    spin: true,
  },
  measuring: {
    icon: Activity,
    defaultTitle: 'Mesure en cours…',
    defaultDescription: 'Vos questions suivies sont interrogées.',
    tone: 'brand',
    spin: true,
  },
  partial: {
    icon: AlertTriangle,
    defaultTitle: 'Mesure partielle',
    defaultDescription: 'Certaines questions n\u2019ont pas pu être mesurées.',
    tone: 'warning',
  },
  success: {
    icon: CheckCircle2,
    defaultTitle: 'Mesure terminée',
    defaultDescription: 'Toutes les questions suivies ont été mesurées.',
    tone: 'success',
  },
  no_data: {
    icon: Inbox,
    defaultTitle: 'Reflet n\u2019a pas encore vérifié le site',
    defaultDescription: 'Aucune mesure n\u2019a encore été effectuée.',
    tone: 'neutral',
  },
  no_change: {
    icon: Minus,
    defaultTitle: 'Aucun changement détecté',
    defaultDescription: 'Le site a été vérifié et rien n\u2019a bougé depuis la dernière mesure.',
    tone: 'neutral',
  },
  no_opportunity: {
    icon: Lightbulb,
    defaultTitle: 'Aucune opportunité pour le moment',
    defaultDescription: 'Reflet n\u2019a rien identifié à améliorer sur cette mesure.',
    tone: 'neutral',
  },
  failed: {
    icon: XCircle,
    defaultTitle: 'La mesure a échoué',
    defaultDescription: 'Réessayez plus tard ou contactez le support si cela persiste.',
    tone: 'danger',
  },
  unavailable: {
    icon: WifiOff,
    defaultTitle: 'Site momentanément indisponible',
    defaultDescription: 'Reflet n\u2019a pas pu joindre le site lors de la dernière tentative.',
    tone: 'danger',
  },
  stale: {
    icon: Clock,
    defaultTitle: 'Donnée périmée',
    defaultDescription: 'La dernière mesure date de plusieurs semaines — une nouvelle mesure est recommandée.',
    tone: 'warning',
  },
}

const TONE_CLASSES: Record<StateConfig['tone'], string> = {
  neutral: 'text-ink-muted',
  brand: 'text-brand-text',
  warning: 'text-warning',
  danger: 'text-danger',
  success: 'text-success',
}

export interface DashboardStateViewProps {
  state: DashboardStateKind
  title?: string
  description?: string
  /** Compact = ligne inline (utilisé dans une card existante). Par défaut : bloc centré pleine hauteur. */
  compact?: boolean
  className?: string
}

export function DashboardStateView({
  state,
  title,
  description,
  compact = false,
  className,
}: DashboardStateViewProps) {
  const config = STATE_CONFIG[state]
  const Icon = config.icon

  if (compact) {
    return (
      <div className={cn('flex items-start gap-2.5 py-2', className)}>
        <Icon
          className={cn('mt-0.5 size-4 shrink-0', TONE_CLASSES[config.tone], config.spin && 'animate-spin')}
        />
        <div>
          <p className="text-sm font-medium text-ink-primary">{title ?? config.defaultTitle}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{description ?? config.defaultDescription}</p>
        </div>
      </div>
    )
  }

  if (state === 'loading' && !compact) {
    return (
      <div
        className={cn(
          'flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center',
          className,
        )}
      >
        <Icon className={cn('size-6', TONE_CLASSES[config.tone], config.spin && 'animate-spin')} />
        <div className="flex w-full max-w-sm flex-col items-center space-y-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center',
        className,
      )}
    >
      <Icon className={cn('size-6', TONE_CLASSES[config.tone], config.spin && 'animate-spin')} />
      <p className="font-display text-lg font-semibold text-ink-primary">{title ?? config.defaultTitle}</p>
      <p className="max-w-sm text-sm text-ink-muted">{description ?? config.defaultDescription}</p>
    </div>
  )
}

// Dérive l'état "temporel" d'un run terminé — distingue Success / Stale.
// staleAfterDays reflète la politique de mesure (hebdomadaire) : au-delà de
// 2 cycles sans nouvelle mesure, la donnée est considérée périmée.
export function deriveRunFreshness(
  completedAt: string | null,
  staleAfterDays = 14,
): 'success' | 'stale' {
  if (!completedAt) return 'success'
  const days = (Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24)
  return days > staleAfterDays ? 'stale' : 'success'
}
