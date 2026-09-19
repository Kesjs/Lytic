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
  trend,
  hint,
  tooltip,
  icon: Icon,
  tone = 'info',
}: {
  label: string
  value: string | null | React.ReactNode
  trend?: {
    value: number
    suffix?: string
  }
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
    <div className="flex flex-col justify-between p-4 lg:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-ink-secondary truncate" title={label}>
          {label}
        </p>
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
      </div>
      
      <div className="mt-3 flex flex-col gap-1.5">
        <div className="truncate font-display text-2xl font-semibold tabular-nums text-ink-primary">
          {value ?? '—'}
        </div>
        
        {(trend || hint) && (
          <div className="flex items-center gap-1.5 truncate">
            {trend && (
              <span
                className={`inline-flex items-center rounded text-[10px] font-semibold px-1 py-0.5 ${
                  trend.value >= 0 
                    ? 'bg-success/10 text-success' 
                    : 'bg-danger/10 text-danger'
                }`}
              >
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}
                {Number.isInteger(trend.value) && trend.value < 100 ? '%' : ''} 
              </span>
            )}
            {trend?.suffix && (
              <span className="text-[11px] text-ink-muted truncate">{trend.suffix}</span>
            )}
            {!trend && hint && (
              <span className="text-[11px] text-ink-muted truncate" title={typeof hint === 'string' ? hint : undefined}>
                {hint}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
