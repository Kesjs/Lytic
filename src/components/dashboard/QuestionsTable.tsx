import React from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronRight, ChevronLeft, Search, CheckCircle2, XCircle } from 'lucide-react'
import type { QuestionPerf } from '~/lib/queries/dashboard'
import { cn } from '~/lib/utils'

export interface QuestionsTableProps {
  data: QuestionPerf[]
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
        active
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
          : 'bg-ink-muted/10 text-ink-secondary'
      )}
    >
      <div
        className={cn(
          'size-1.5 rounded-full',
          active ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-ink-muted'
        )}
      />
      {label}
    </div>
  )
}

export function QuestionsTable({ data }: QuestionsTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-32 w-full flex-col items-center justify-center text-sm text-ink-muted">
        <Search className="mb-2 size-5 opacity-50" />
        Aucune question analysée
      </div>
    )
  }

  return (
    <div className="flex flex-col -mx-5 -mb-5 mt-2">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-ink-muted">
              <th className="pb-3 pl-5 pr-3 font-medium font-display text-xs tracking-wide">Question</th>
              <th className="px-3 pb-3 font-medium font-display text-xs tracking-wide">Mention</th>
              <th className="px-3 pb-3 font-medium font-display text-xs tracking-wide">Reco.</th>
              <th className="px-3 pb-3 font-medium font-display text-xs tracking-wide">Pos.</th>
              <th className="pb-3 pl-3 pr-5 text-right font-medium font-display text-xs tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.map((q) => (
              <tr
                key={q.id}
                className="group transition-colors hover:bg-elevated/50"
              >
                <td className="py-3.5 pl-5 pr-3">
                  <div className="max-w-[200px] truncate font-medium text-ink-primary lg:max-w-[240px]" title={q.text}>
                    {q.text}
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  <StatusBadge active={q.mentioned} label={q.mentioned ? 'Oui' : 'Non'} />
                </td>
                <td className="px-3 py-3.5">
                  <StatusBadge active={q.recommended} label={q.recommended ? 'Oui' : 'Non'} />
                </td>
                <td className="px-3 py-3.5 tabular-nums text-ink-primary">
                  {q.position ? `#${q.position}` : <span className="text-ink-muted">-</span>}
                </td>
                <td className="py-3.5 pl-3 pr-5 text-right">
                  <Link
                    to="/dashboard/historique"
                    className="inline-flex size-7 items-center justify-center rounded-md text-ink-muted opacity-0 transition-all hover:bg-elevated hover:text-brand group-hover:opacity-100"
                    title="Voir l'historique"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer (Décoratif/Immersif pour la page d'accueil) */}
      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <p className="text-xs text-ink-muted">
          Résultats <span className="font-medium text-ink-primary">1-{data.length}</span> sur <span className="font-medium text-ink-primary">50</span>
        </p>
        <div className="flex items-center gap-1">
          <button className="flex size-6 items-center justify-center rounded-md border border-border bg-surface text-ink-muted hover:bg-elevated disabled:opacity-50">
            <ChevronLeft className="size-3.5" />
          </button>
          <button className="flex size-6 items-center justify-center rounded-md bg-brand text-xs font-semibold text-black">
            1
          </button>
          <button className="flex size-6 items-center justify-center rounded-md border border-transparent text-xs text-ink-muted hover:bg-elevated">
            2
          </button>
          <button className="flex size-6 items-center justify-center rounded-md border border-transparent text-xs text-ink-muted hover:bg-elevated">
            3
          </button>
          <button className="flex size-6 items-center justify-center rounded-md border border-border bg-surface text-ink-muted hover:bg-elevated">
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
