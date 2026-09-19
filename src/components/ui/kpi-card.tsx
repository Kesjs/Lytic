import type { LucideIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'

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
  const iconBlock = Icon ? (
    <div className={`flex size-7 shrink-0 items-center justify-center rounded-md ${ICON_TONES[tone]} ${tooltip ? 'cursor-help' : ''}`}>
      <Icon className="size-3.5" />
    </div>
  ) : null

  return (
    <div className="flex items-start gap-2.5 p-3 lg:p-4">
      {tooltip && iconBlock ? (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {iconBlock}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px] text-center">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      ) : (
        iconBlock
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-start gap-1.5">
          <p className="text-xs text-ink-secondary leading-snug truncate" title={label}>
            {label}
          </p>
        </div>
        <div className="mt-1 truncate font-display text-xl font-semibold tabular-nums text-ink-primary">
          {value ?? '—'}
        </div>
        {hint && (
          <div className="mt-1 text-[11px] text-ink-muted leading-snug truncate">
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
