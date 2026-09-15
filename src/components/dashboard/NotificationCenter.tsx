import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, AlertTriangle, Info, XCircle, CheckCircle2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from '~/lib/queries/notifications'
import { cn } from '~/lib/utils'

// Centre de notifications / Alertes (§35, §36D.8) — absent du header
// jusqu'ici. Règle appliquée : tout ce qui change va dans l'Historique,
// ce qui mérite une action apparaît ici. Remplace le badge "En ligne"
// (point vert codé en dur, sans donnée réelle derrière).
const TYPE_ICON: Record<NotificationItem['type'], typeof Info> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
}

const TYPE_CLASS: Record<NotificationItem['type'], string> = {
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  error: 'text-danger',
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return `il y a ${days} j`
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(),
    refetchInterval: 60_000,
  })

  const readMutation = useMutation({
    mutationFn: (eventId: string) => markNotificationRead({ data: { eventId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const readAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const items = data?.items ?? []
  const unreadCount = data?.unreadCount ?? 0

  return (
    <div className="relative" ref={ref}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Notifications"
            className="relative flex size-8 items-center justify-center rounded-md border border-border bg-surface text-ink-secondary transition-colors hover:bg-elevated hover:text-ink-primary"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-elevated shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
            <p className="text-xs font-semibold text-ink-primary">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => readAllMutation.mutate()}
                disabled={readAllMutation.isPending}
                className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink-secondary disabled:opacity-50"
              >
                <CheckCheck className="size-3" />
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="px-3.5 py-6 text-center text-xs text-ink-muted">Chargement…</p>
            ) : items.length === 0 ? (
              <p className="px-3.5 py-6 text-center text-xs text-ink-muted">
                Aucune notification pour le moment.
              </p>
            ) : (
              <ul>
                {items.map((n) => {
                  const Icon = TYPE_ICON[n.type]
                  return (
                    <li
                      key={n.id}
                      className={cn(
                        'flex gap-2.5 border-b border-border/60 px-3.5 py-2.5 last:border-0',
                        !n.read && 'bg-elevated/60',
                      )}
                    >
                      <Icon className={cn('mt-0.5 size-3.5 shrink-0', TYPE_CLASS[n.type])} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-ink-primary">{n.title}</p>
                        {n.message && (
                          <p className="mt-0.5 text-[11px] text-ink-muted">{n.message}</p>
                        )}
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[10px] text-ink-muted">{timeAgo(n.createdAt)}</span>
                          {!n.read && (
                            <button
                              type="button"
                              onClick={() => readMutation.mutate(n.id)}
                              className="text-[10px] text-brand-text hover:underline"
                            >
                              Marquer comme lu
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
