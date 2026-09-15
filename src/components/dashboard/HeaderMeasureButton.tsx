import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Zap, Clock, Loader2 } from 'lucide-react'
import { fetchDashboardHome } from '~/lib/queries/dashboard'
import { runFullMeasurement } from '~/lib/measurement-client'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'

const DELAY_DAYS = 7

function daysRemaining(lastCompletedAt: string | null): number {
  if (!lastCompletedAt) return 0
  const elapsedMs = Date.now() - new Date(lastCompletedAt).getTime()
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.ceil(DELAY_DAYS - elapsedDays))
}

export function HeaderMeasureButton() {
  const [pending, setPending] = useState(false)
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['dashboard-home'],
    queryFn: () => fetchDashboardHome(),
  })

  if (!data || !data.brand) return null

  const remaining = data.latestRun?.status === 'success' 
    ? daysRemaining(data.latestRun.completed_at) 
    : 0
  const isAvailable = remaining === 0

  const isMeasuring = pending || data.latestRun?.status === 'measuring' || data.latestRun?.status === 'pending'

  async function handleClick() {
    if (pending) return
    
    navigate({ to: '/dashboard' as any })

    setPending(true)
    setProgress(null)

    try {
      await runFullMeasurement(data.brand.id, queryClient, (p) => setProgress(p))
    } catch (err) {
      toast.dismiss('measure-progress')
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      toast.error(`Erreur : ${message}`)
    } finally {
      setPending(false)
      setProgress(null)
    }
  }

  if (isMeasuring && pending) {
    return (
      <button
        type="button"
        disabled
        className="flex size-8 sm:h-8 sm:w-auto items-center justify-center gap-1.5 rounded-md border border-brand/40 bg-brand/10 sm:px-3 text-[11px] font-semibold text-brand-text opacity-80"
      >
        <Loader2 className="size-3.5 animate-spin" />
        <span className="hidden sm:inline">
          {progress ? `${progress.completed}/${progress.total}` : 'Mesure…'}
        </span>
      </button>
    )
  }

  if (!isAvailable) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled
            className="flex size-8 sm:h-8 sm:w-auto items-center justify-center gap-1.5 rounded-md border border-border bg-elevated sm:px-3 text-[11px] font-medium text-ink-muted opacity-70"
          >
            <Clock className="size-3.5" />
            <span className="hidden sm:inline">{remaining}j restants</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>Prochaine mesure disponible dans {remaining} jour{remaining > 1 ? 's' : ''}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex size-8 sm:h-8 sm:w-auto items-center justify-center gap-1.5 rounded-md border border-brand/40 bg-brand/10 sm:px-3 text-[11px] font-semibold text-brand-text transition-colors hover:bg-brand/20"
    >
      <Zap className="size-3.5" />
      <span className="hidden sm:inline">Mesurer</span>
    </button>
  )
}
