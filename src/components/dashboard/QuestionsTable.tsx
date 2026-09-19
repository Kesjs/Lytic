import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import type { QuestionPerf } from '~/lib/queries/dashboard'
import { ResponsiveTable } from '~/components/dashboard/ResponsiveTable'
import { StatusBadge } from '~/components/dashboard/StatusBadge'

export interface QuestionsTableProps {
  data: QuestionPerf[]
  pageSize?: number
}

// Widget "Performance des questions" de l'Accueil — fine surcouche de
// ResponsiveTable (pagination + repli mobile partagés avec Performance et
// Concurrents), ne définit que ses colonnes et son rendu de ligne.
export function QuestionsTable({ data, pageSize = 5 }: QuestionsTableProps) {
  return (
    <ResponsiveTable
      data={data}
      getRowKey={(q) => q.id}
      pageSize={pageSize}
      emptyLabel="Aucune question analysée"
      columns={[
        { key: 'q', header: 'Question' },
        { key: 'mention', header: 'Mention' },
        { key: 'reco', header: 'Reco.' },
        { key: 'pos', header: 'Pos.' },
        { key: 'action', header: 'Action', align: 'right' },
      ]}
      renderDesktopRow={(q) => (
        <tr className="group transition-colors hover:bg-elevated/50">
          <td className="px-3 py-3.5">
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
          <td className="px-3 py-3.5 text-right">
            <Link
              to="/dashboard/historique"
              className="inline-flex size-7 items-center justify-center rounded-md text-ink-muted opacity-0 transition-all hover:bg-elevated hover:text-brand group-hover:opacity-100"
              title="Voir l'historique"
            >
              <ChevronRight className="size-4" />
            </Link>
          </td>
        </tr>
      )}
      renderMobileCard={(q) => (
        <div className="flex items-start justify-between gap-3 px-5 py-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium leading-snug text-ink-primary" title={q.text}>
              {q.text}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <StatusBadge active={q.mentioned} label={`Mention ${q.mentioned ? 'oui' : 'non'}`} />
              <StatusBadge active={q.recommended} label={`Reco ${q.recommended ? 'oui' : 'non'}`} />
              <span className="text-xs tabular-nums text-ink-muted">
                {q.position ? `#${q.position}` : '—'}
              </span>
            </div>
          </div>
          <Link
            to="/dashboard/historique"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-elevated hover:text-brand"
            title="Voir l'historique"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      )}
    />
  )
}
