import React, { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronRight, ChevronLeft, Search, CheckCircle2, XCircle } from 'lucide-react'
import type { QuestionPerf } from '~/lib/queries/dashboard'
import { cn } from '~/lib/utils'

export interface QuestionsTableProps {
  data: QuestionPerf[]
  pageSize?: number
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

export function QuestionsTable({ data, pageSize = 5 }: QuestionsTableProps) {
  const [page, setPage] = useState(0)

  const pageCount = Math.max(1, Math.ceil(data.length / pageSize))
  // Si la donnée change (nouveau run, filtre) et que la page courante
  // dépasse le nombre de pages disponible, on revient sur la première
  // plutôt que d'afficher une page vide.
  const safePage = Math.min(page, pageCount - 1)
  const pageData = useMemo(
    () => data.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [data, safePage, pageSize],
  )

  if (data.length === 0) {
    return (
      <div className="flex h-32 w-full flex-col items-center justify-center text-sm text-ink-muted">
        <Search className="mb-2 size-5 opacity-50" />
        Aucune question analysée
      </div>
    )
  }

  const rangeStart = safePage * pageSize + 1
  const rangeEnd = Math.min(data.length, safePage * pageSize + pageSize)

  // Fenêtre de pages compacte (max 3 numéros visibles) pour rester lisible
  // même avec beaucoup de pages, plutôt que d'afficher tous les numéros.
  const pageWindow = Array.from({ length: pageCount }, (_, i) => i).filter(
    (i) => i === 0 || i === pageCount - 1 || Math.abs(i - safePage) <= 1,
  )

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
            {pageData.map((q) => (
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

      {/* Pagination réelle : navigue dans `data`, boutons actifs/désactivés
          selon la position, fenêtre de pages compacte avec "…" si besoin. */}
      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <p className="text-xs text-ink-muted">
          Résultats{' '}
          <span className="font-medium text-ink-primary">
            {rangeStart}-{rangeEnd}
          </span>{' '}
          sur <span className="font-medium text-ink-primary">{data.length}</span>
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="flex size-6 items-center justify-center rounded-md border border-border bg-surface text-ink-muted hover:bg-elevated disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          {pageWindow.map((i, idx) => (
            <React.Fragment key={i}>
              {idx > 0 && pageWindow[idx - 1] !== i - 1 && (
                <span className="px-0.5 text-xs text-ink-muted">…</span>
              )}
              <button
                type="button"
                onClick={() => setPage(i)}
                className={cn(
                  'flex size-6 items-center justify-center rounded-md text-xs font-semibold transition-colors',
                  i === safePage
                    ? 'bg-brand text-black'
                    : 'border border-transparent text-ink-muted hover:bg-elevated',
                )}
              >
                {i + 1}
              </button>
            </React.Fragment>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            className="flex size-6 items-center justify-center rounded-md border border-border bg-surface text-ink-muted hover:bg-elevated disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
