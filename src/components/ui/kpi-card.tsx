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
  hint: string | React.ReactNode
  tooltip?: string
}) {
  return (
    <div className="flex flex-col justify-center p-4 xl:p-5">
      <div className="flex items-center gap-1.5">
        <p className="truncate text-xs text-ink-secondary" title={label}>
          {label}
        </p>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="shrink-0 text-ink-muted transition-colors hover:text-ink-primary">
                <HelpCircle className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="mt-2 truncate font-display text-2xl font-semibold tabular-nums text-ink-primary">
        {value ?? '—'}
      </div>
      <div className="mt-1 truncate text-[11px] text-ink-muted">
        {typeof hint === 'string' ? (
          <span title={hint}>{hint}</span>
        ) : (
          hint
        )}
      </div>
    </div>
  )
}
