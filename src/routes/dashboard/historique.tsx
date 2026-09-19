import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Activity, FileEdit, Bell } from 'lucide-react'
import { fetchHistory, type TimelineEntry } from '~/lib/queries/history'
import { DashboardStateView } from '~/components/dashboard/DashboardState'

export const Route = createFileRoute('/dashboard/historique')({
  component: HistoriquePage,
})

type FilterValue = 'all' | 'run' | 'change'

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'run', label: 'Mesures' },
  { value: 'change', label: 'Modifications' },
]

const RUN_STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  measuring: 'Mesure en cours',
  partial: 'Mesure partielle',
  success: 'Mesure terminée',
  failed: 'Échec de la mesure',
}

const IMPORTANCE_LABEL: Record<string, string> = {
  low: 'Importance faible',
  watch: 'À surveiller',
  high: 'Importance haute',
  critical: 'Importance critique',
}

const IMPORTANCE_CLASS: Record<string, string> = {
  critical: 'bg-danger/10 text-danger border-danger/30',
  high: 'bg-danger/10 text-danger border-danger/30',
  watch: 'bg-warning/10 text-warning border-warning/30',
  low: 'bg-ink-muted/10 text-ink-muted border-border',
}

const EVENT_TYPE_CLASS: Record<string, string> = {
  success: 'bg-success/10 text-success border-success/30',
  info: 'bg-info/10 text-info border-info/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  error: 'bg-danger/10 text-danger border-danger/30',
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  success: 'Bonne nouvelle',
  info: 'Information',
  warning: 'À surveiller',
  error: 'Erreur',
}

const FIELD_LABELS: Record<string, string> = {
  title: 'Titre',
  meta: 'Méta-données',
  headings: 'En-têtes',
  body: 'Contenu principal',
  pricing: 'Prix',
  cta: 'Appel à l\'action',
  links: 'Liens',
  structure: 'Structure',
}

function HistoriquePage() {
  const [filter, setFilter] = useState<FilterValue>('all')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['history'],
    queryFn: () => fetchHistory(),
  })

  if (isLoading) {
    return <DashboardStateView state="loading" />
  }

  if (isError) {
    return (
      <DashboardStateView
        state="unavailable"
        title="Impossible de charger cette page"
        description="Vérifiez votre connexion et réessayez."
      />
    )
  }

  if (!data?.brand) {
    return <DashboardStateView state="no_data" title="Aucune marque configurée" description="Ajoutez votre marque dans Paramètres pour commencer à suivre votre visibilité IA." />
  }

  const entries = data.entries

  if (entries.length === 0) {
    return <DashboardStateView state="no_data" title="Aucun historique pour l'instant" description="Les mesures et les modifications de site détectées apparaîtront ici au fil du temps." />
  }

  const filtered = entries.filter((e: any) => {
    if (filter === 'all') return true
    if (filter === 'run') return e.kind === 'run'
    return e.kind === 'change'
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value
                ? 'border-brand/40 bg-brand/10 text-brand-text'
                : 'border-border bg-surface text-ink-muted hover:text-ink-secondary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <DashboardStateView
          state="no_data"
          title="Aucune entrée dans ce filtre"
          description="Changez de filtre pour voir les autres entrées de l'historique."
        />
      ) : (
        <ol className="space-y-3">
          {filtered.map((entry: any) => (
            <TimelineItem key={`${entry.kind}-${entry.id}`} entry={entry} />
          ))}
        </ol>
      )}
    </div>
  )
}

function TimelineItem({ entry }: { entry: TimelineEntry }) {
  // Un changement de faible importance reste toujours visible : seule
  // l'emphase visuelle (opacité) est réduite, jamais l'entrée elle-même.
  const muted = entry.kind === 'change' && entry.importance === 'low'

  return (
    <li
      className={`rounded-lg border border-border bg-surface p-4 ${muted ? 'opacity-70' : ''}`}
    >
      {entry.kind === 'run' && <RunEntryContent entry={entry} />}
      {entry.kind === 'change' && <ChangeEntryContent entry={entry} />}
      {entry.kind === 'event' && <EventEntryContent entry={entry} />}
    </li>
  )
}

function EntryHeader({
  icon,
  title,
  date,
}: {
  icon: React.ReactNode
  title: string
  date: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-elevated text-ink-muted">
          {icon}
        </span>
        <p className="text-sm font-medium text-ink-primary">{title}</p>
      </div>
      <span className="shrink-0 text-xs text-ink-muted">
        {new Date(date).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  )
}

function RunEntryContent({ entry }: { entry: Extract<TimelineEntry, { kind: 'run' }> }) {
  return (
    <>
      <EntryHeader
        icon={<Activity className="size-3.5" />}
        title={RUN_STATUS_LABEL[entry.status] ?? entry.status}
        date={entry.date}
      />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-sm border border-border px-1.5 py-0.5 text-[11px] text-ink-muted">
          {entry.questionsCompleted}/{entry.questionsTotal} questions
        </span>
        {entry.score !== null && (
          <span className="rounded-sm border border-border px-1.5 py-0.5 text-[11px] text-ink-muted">
            Score {entry.score}
            {entry.scoreDelta !== null && entry.scoreDelta !== 0 && (
              <span className={entry.scoreDelta > 0 ? 'text-success' : 'text-danger'}>
                {' '}
                ({entry.scoreDelta > 0 ? '+' : ''}
                {entry.scoreDelta})
              </span>
            )}
          </span>
        )}
      </div>
    </>
  )
}

function ChangeEntryContent({ entry }: { entry: Extract<TimelineEntry, { kind: 'change' }> }) {
  // Déterminer s'il y a un diff sémantique (nouveau format)
  const hasSemanticDiff = entry.oldContent !== null && entry.newContent !== null && Array.isArray(entry.changedFields) && entry.changedFields.length > 0

  return (
    <>
      <EntryHeader
        icon={<FileEdit className="size-3.5" />}
        title={entry.changeType === 'content' ? 'Changement de contenu' : 'Changement de structure'}
        date={entry.date}
      />
      <p className="mt-1.5 text-xs text-ink-secondary">
        Page concernée : <a href={entry.pageUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-text">{entry.pageUrl}</a>
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 mb-3">
        <span
          className={`rounded-sm border px-1.5 py-0.5 text-[11px] font-medium ${IMPORTANCE_CLASS[entry.importance]}`}
        >
          {IMPORTANCE_LABEL[entry.importance]}
        </span>
        <span className="rounded-sm border border-border px-1.5 py-0.5 text-[11px] text-ink-muted">
          Détecté via {entry.detectionMethod === 'semantic_diff' ? 'analyse sémantique' : 'analyse de hash'}
        </span>
      </div>

      {hasSemanticDiff ? (
        <div className="space-y-3 mt-4 border-t border-border pt-3">
          {entry.changedFields!.map((field) => {
            const oldVal = entry.oldContent[field]
            const newVal = entry.newContent[field]
            return (
              <div key={field} className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wide">
                  {FIELD_LABELS[field] || field}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="rounded-md bg-danger/5 border border-danger/10 p-2 text-xs text-ink-secondary">
                    <span className="text-danger-muted font-medium mb-1 block">Avant</span>
                    <DiffValueRenderer value={oldVal} />
                  </div>
                  <div className="rounded-md bg-success/5 border border-success/10 p-2 text-xs text-ink-secondary">
                    <span className="text-success-muted font-medium mb-1 block">Après</span>
                    <DiffValueRenderer value={newVal} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // Fallback vers l'ancien format (snippets)
        (entry.beforeSnippet || entry.afterSnippet) && (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {entry.beforeSnippet && (
              <div>
                <p className="text-[11px] font-medium text-ink-muted">Avant</p>
                <p className="mt-0.5 text-xs text-ink-secondary">{entry.beforeSnippet}</p>
              </div>
            )}
            {entry.afterSnippet && (
              <div>
                <p className="text-[11px] font-medium text-ink-muted">Après</p>
                <p className="mt-0.5 text-xs text-ink-secondary">{entry.afterSnippet}</p>
              </div>
            )}
          </div>
        )
      )}

      {entry.linkedRunDate && (
        <p className="mt-3 text-[11px] text-ink-muted">
          Confirmé par une mesure le{' '}
          {new Date(entry.linkedRunDate).toLocaleDateString('fr-FR')}
        </p>
      )}
    </>
  )
}

function DiffValueRenderer({ value }: { value: any }) {
  if (value === null || value === undefined || value === '') {
    return <span className="italic text-ink-muted opacity-60">(Vide)</span>
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="italic text-ink-muted opacity-60">(Aucun)</span>
    }
    return (
      <ul className="list-disc list-inside space-y-0.5 ml-1">
        {value.map((item, i) => (
          <li key={i} className="line-clamp-2" title={String(item)}>{String(item)}</li>
        ))}
      </ul>
    )
  }

  return <span className="line-clamp-3 whitespace-pre-wrap" title={String(value)}>{String(value)}</span>
}

function EventEntryContent({ entry }: { entry: Extract<TimelineEntry, { kind: 'event' }> }) {
  return (
    <>
      <EntryHeader
        icon={<Bell className="size-3.5" />}
        title={entry.title}
        date={entry.date}
      />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-sm border px-1.5 py-0.5 text-[11px] font-medium ${EVENT_TYPE_CLASS[entry.type]}`}
        >
          {EVENT_TYPE_LABEL[entry.type] ?? entry.type}
        </span>
      </div>
      {entry.message && <p className="mt-1.5 text-xs text-ink-secondary">{entry.message}</p>}
    </>
  )
}


