import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, ChevronLeft, Search } from 'lucide-react'
import { cn } from '~/lib/utils'

export interface ResponsiveTableColumn {
  key: string
  header: string
  align?: 'left' | 'right'
  className?: string
}

export interface ResponsiveTableProps<T> {
  data: T[]
  getRowKey: (row: T) => string
  pageSize?: number
  /** En-têtes de colonnes pour la vue tableau (desktop). */
  columns: ResponsiveTableColumn[]
  /** Une ou plusieurs <tr> par ligne — permet une ligne dépliable (ex. Concurrents). */
  renderDesktopRow: (row: T) => React.ReactNode
  /** Rendu carte pour le repli mobile — libre, peut inclure son propre état (ex. accordéon). */
  renderMobileCard: (row: T) => React.ReactNode
  emptyState?: React.ReactNode
  emptyLabel?: string
}

// Tableau générique paginé, avec repli automatique en liste de cartes sous
// ~480px de large (mesuré sur son propre conteneur, pas sur la fenêtre —
// reste correct même dans une colonne étroite d'une grille plus large).
// Remplace le pattern "overflow-x-auto tout seul" qui forçait un scroll
// horizontal sur les tableaux à beaucoup de colonnes (Performance,
// Concurrents) au lieu de rester lisible sur mobile.
export function ResponsiveTable<T>({
  data,
  getRowKey,
  pageSize = 5,
  columns,
  renderDesktopRow,
  renderMobileCard,
  emptyState,
  emptyLabel = 'Aucun résultat',
}: ResponsiveTableProps<T>) {
  const [page, setPage] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setIsNarrow(entries[0].contentRect.width < 480)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pageCount = Math.max(1, Math.ceil(data.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const pageData = useMemo(
    () => data.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [data, safePage, pageSize],
  )

  if (data.length === 0) {
    return (
      emptyState ?? (
        <div className="flex h-32 w-full flex-col items-center justify-center text-sm text-ink-muted">
          <Search className="mb-2 size-5 opacity-50" />
          {emptyLabel}
        </div>
      )
    )
  }

  const rangeStart = safePage * pageSize + 1
  const rangeEnd = Math.min(data.length, safePage * pageSize + pageSize)
  const pageWindow = Array.from({ length: pageCount }, (_, i) => i).filter(
    (i) => i === 0 || i === pageCount - 1 || Math.abs(i - safePage) <= 1,
  )

  return (
    <div ref={containerRef} className="flex flex-col mt-1">
      {isNarrow ? (
        <div className="divide-y divide-border/50">
          {pageData.map((row) => (
            <React.Fragment key={getRowKey(row)}>{renderMobileCard(row)}</React.Fragment>
          ))}
        </div>
      ) : (
        <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-ink-muted">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      'px-3 pb-3 font-medium font-display text-xs tracking-wide',
                      c.align === 'right' && 'text-right',
                      c.className,
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {pageData.map((row) => (
                <React.Fragment key={getRowKey(row)}>{renderDesktopRow(row)}</React.Fragment>
              ))}
            </tbody>
          </table>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-border px-3 py-3 mt-1">
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
      )}
    </div>
  )
}
