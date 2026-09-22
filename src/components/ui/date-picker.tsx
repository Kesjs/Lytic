import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '~/lib/utils'

// Remplace le `<input type="date">` natif (rendu différemment — et pas
// toujours élégamment — selon le navigateur/OS) par un calendrier custom
// aux couleurs de l'app. Contrôlé en chaîne ISO 'yyyy-MM-dd' pour rester un
// remplacement direct des deux inputs natifs utilisés dans le filtre de
// l'Historique (min/max croisés entre "de" et "à").

interface DatePickerFieldProps {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  ariaLabel: string
  placeholder?: string
}

const WEEKDAY_LABELS = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di']

export function DatePickerField({ value, onChange, min, max, ariaLabel, placeholder = 'jj/mm/aaaa' }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value) : null
  const [viewMonth, setViewMonth] = useState(selected ?? new Date())

  const minDate = min ? parseISO(min) : null
  const maxDate = max ? parseISO(max) : null

  const monthStart = startOfMonth(viewMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  function isDisabled(day: Date) {
    if (minDate && day < minDate) return true
    if (maxDate && day > maxDate) return true
    return false
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setViewMonth(selected ?? new Date())
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-secondary outline-none transition-colors hover:border-brand/40 focus:border-brand/40"
        >
          <CalendarIcon className="size-3.5 text-ink-muted" />
          {selected ? format(selected, 'dd/MM/yyyy') : <span className="text-ink-muted">{placeholder}</span>}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-64 rounded-lg border border-border-strong bg-surface p-3 shadow-2xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <div className="flex items-center justify-between pb-2">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="flex size-6 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-elevated hover:text-ink-primary"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-xs font-semibold capitalize text-ink-primary">
              {format(viewMonth, 'MMMM yyyy', { locale: fr })}
            </p>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="flex size-6 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-elevated hover:text-ink-primary"
              aria-label="Mois suivant"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 pb-1 text-center text-[10px] font-medium uppercase text-ink-secondary">
            {WEEKDAY_LABELS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const disabled = isDisabled(day)
              const outside = !isSameMonth(day, viewMonth)
              const active = selected ? isSameDay(day, selected) : false
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(format(day, 'yyyy-MM-dd'))
                    setOpen(false)
                  }}
                  className={cn(
                    'flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors',
                    outside && 'text-ink-muted/30',
                    !outside && !active && 'text-ink-primary hover:bg-elevated',
                    active && 'bg-brand font-semibold text-black hover:bg-brand',
                    isToday(day) && !active && 'border border-brand/50 font-semibold',
                    disabled && 'cursor-not-allowed opacity-30 hover:bg-transparent',
                  )}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>

          {selected && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="mt-2 w-full rounded-md border border-border py-1 text-[11px] text-ink-secondary transition-colors hover:bg-elevated hover:text-ink-primary"
            >
              Effacer
            </button>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
