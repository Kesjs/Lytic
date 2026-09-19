import type { LucideIcon } from 'lucide-react'
import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'

// Teintes limitées aux tokens sémantiques déjà définis dans tailwind.config.js
// (success/info/warning/danger) — jamais de couleur hors charte, jamais de
// variante de la couleur d'accent `brand`. Même idiome que opportunites.tsx
// (bg-x/10 text-x).
const ICON_TONES = {
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
} as const

export type KpiCardTone = keyof typeof ICON_TONES

export function KpiCard({
  label,
  value,
  hint,
  tooltip,
  icon: Icon,
  tone = 'info',
}: {
  label: string
  value: string | null | React.ReactNode
  hint?: string | React.ReactNode
  tooltip?: string
  icon?: LucideIcon
  tone?: KpiCardTone
}) {
  return (
    <div className="flex items-start gap-2.5 p-3 lg:p-3.5">
      {Icon && (
        <div className={`flex size-7 shrink-0 items-center justify-center rounded-md ${ICON_TONES[tone]}`}>
          <Icon className="size-3.5" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-start gap-1.5">
          <p className="text-xs text-ink-secondary leading-snug" title={label}>
            {label}
          </p>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="mt-0.5 shrink-0 text-ink-muted transition-colors hover:text-ink-primary">
                  <HelpCircle className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="mt-1 truncate font-display text-xl font-semibold tabular-nums text-ink-primary">
          {value ?? '—'}
        </div>
        {hint && (
          <div className="mt-1 text-[11px] text-ink-muted leading-snug">
            {typeof hint === 'string' ? (
              <span title={hint}>{hint}</span>
            ) : (
              hint
            )}
          </div>
        )}
      </div>
    </div>
  )
}
