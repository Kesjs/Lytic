import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Gauge, Clock, Loader2, X } from 'lucide-react'
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
  const abortControllerRef = useRef<AbortController | null>(null)
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
    if (pending) {
      // Annuler la mesure en cours
      abortControllerRef.current?.abort()
      return
    }
    
    navigate({ to: '/dashboard' as any })

    setPending(true)
    setProgress(null)
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      await runFullMeasurement(data.brand.id, queryClient, (p) => setProgress(p), abortController.signal)
    } catch (err) {
      toast.dismiss('measure-progress')
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      toast.error(`Erreur : ${message}`)
    } finally {
      setPending(false)
      setProgress(null)
      abortControllerRef.current = null
    }
  }

  if (isMeasuring && pending) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            className="group flex size-8 sm:h-8 sm:w-auto items-center justify-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 sm:px-3 text-[11px] font-semibold text-warning transition-colors hover:bg-danger/10 hover:text-danger hover:border-danger/40"
          >
            <Loader2 className="size-3.5 animate-spin group-hover:hidden" />
            <X className="size-3.5 hidden group-hover:block" />
            <span className="hidden sm:inline group-hover:hidden">
              {progress ? `${progress.completed}/${progress.total}` : 'Mesure…'}
            </span>
            <span className="hidden sm:group-hover:inline">
              Annuler
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent>Annuler la mesure en cours</TooltipContent>
      </Tooltip>
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
      className="flex size-8 sm:h-8 sm:w-auto items-center justify-center gap-1.5 rounded-md bg-brand sm:px-3 text-[11px] font-semibold text-black transition-colors hover:bg-brand-hover"
    >
      <Gauge className="size-3.5" />
      <span className="hidden sm:inline">Mesurer</span>
    </button>
  )
}
