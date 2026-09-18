import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'

export function KpiCard({
  label,
  value,
  hint,
  tooltip,
}: {
  label: string
  value: string | null | React.ReactNode
  hint?: string | React.ReactNode
  tooltip?: string
}) {
  return (
    <div className="flex flex-col justify-center p-3 lg:p-4">
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
      <div className="mt-1.5 truncate font-display text-2xl font-semibold tabular-nums text-ink-primary">
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
  )
}
