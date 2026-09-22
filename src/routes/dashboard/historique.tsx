import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Activity, FileEdit, Bell, Loader2 } from 'lucide-react'
import { fetchHistory, type TimelineEntry, type HistoryFilters } from '~/lib/queries/history'
import { DashboardStateView } from '~/components/dashboard/DashboardState'
import { DatePickerField } from '~/components/ui/date-picker'

export const Route = createFileRoute('/dashboard/historique')({
  component: HistoriquePage,
})

type KindFilterValue = 'all' | 'run' | 'change'
type ImportanceFilterValue = 'all' | 'low' | 'watch' | 'high' | 'critical'

const KIND_FILTERS: { value: KindFilterValue; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'run', label: 'Mesures' },
  { value: 'change', label: 'Modifications' },
]

const IMPORTANCE_FILTER_OPTIONS: { value: ImportanceFilterValue; label: string }[] = [
  { value: 'all', label: 'Toutes les importances' },
  { value: 'critical', label: 'Critique' },
  { value: 'high', label: 'Haute' },
  { value: 'watch', label: 'À surveiller' },
  { value: 'low', label: 'Faible' },
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
  sections: 'Contenu principal',
  mainContent: 'Contenu principal',
  pricing: 'Prix',
  cta: 'Appel à l\'action',
  links: 'Liens',
  structure: 'Structure',
}

const PAGE_SIZE = 20

const SELECT_CLASS =
  'rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-secondary outline-none focus:border-brand/40 disabled:cursor-not-allowed disabled:opacity-50'

function HistoriquePage() {
  const [kindFilter, setKindFilter] = useState<KindFilterValue>('all')
  const [importanceFilter, setImportanceFilter] = useState<ImportanceFilterValue>('all')
  const [pageFilter, setPageFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [windowSize, setWindowSize] = useState(PAGE_SIZE)

  // Un filtre par importance ou par page ne concerne que les modifications
  // de site : forcer l'onglet "Modifications" pour éviter une combinaison
  // vide (ex. "Mesures" + "Critique").
  const restrictedToChanges = importanceFilter !== 'all' || pageFilter !== 'all'
  const effectiveKindFilter: KindFilterValue = restrictedToChanges ? 'change' : kindFilter

  const filters: Partial<HistoryFilters> = {
    importance: importanceFilter === 'all' ? null : importanceFilter,
    pageId: pageFilter === 'all' ? null : pageFilter,
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
  }

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['history', windowSize, filters],
    queryFn: () => fetchHistory({ data: { windowSize, filters } }),
    placeholderData: keepPreviousData,
  })

  function updateFilters(next: Partial<{ importance: ImportanceFilterValue; pageId: string; from: string; to: string }>) {
    if (next.importance !== undefined) setImportanceFilter(next.importance)
    if (next.pageId !== undefined) setPageFilter(next.pageId)
    if (next.from !== undefined) setDateFrom(next.from)
    if (next.to !== undefined) setDateTo(next.to)
    setWindowSize(PAGE_SIZE)
  }

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
    return (
      <DashboardStateView
        state="no_data"
        title="Aucune marque configurée"
        description="Ajoutez votre marque dans Paramètres pour commencer à suivre votre visibilité IA."
      />
    )
  }

  const entries = data.entries
  const pages = data.pages ?? []
  const hasActiveFilters = restrictedToChanges || Boolean(dateFrom) || Boolean(dateTo)

  const filtered = entries.filter((e: any) => {
    if (effectiveKindFilter === 'all') return true
    if (effectiveKindFilter === 'run') return e.kind === 'run'
    return e.kind === 'change'
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-1.5">
        {KIND_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            disabled={restrictedToChanges && f.value !== 'change'}
            onClick={() => setKindFilter(f.value)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              effectiveKindFilter === f.value
                ? 'border-brand/40 bg-brand/10 text-brand-text'
                : 'border-border bg-surface text-ink-muted hover:text-ink-secondary'
            }`}
          >
            {f.label}
          </button>
        ))}

        <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />

        <select
          className={SELECT_CLASS}
          value={importanceFilter}
          onChange={(e) => updateFilters({ importance: e.target.value as ImportanceFilterValue })}
        >
          {IMPORTANCE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {pages.length > 1 && (
          <select
            className={SELECT_CLASS}
            value={pageFilter}
            onChange={(e) => updateFilters({ pageId: e.target.value })}
          >
            <option value="all">Toutes les pages</option>
            {pages.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.url}
              </option>
            ))}
          </select>
        )}

        <DatePickerField
          value={dateFrom}
          onChange={(v) => updateFilters({ from: v })}
          max={dateTo || undefined}
          ariaLabel="Date de début"
        />
        <span className="text-xs text-ink-muted">à</span>
        <DatePickerField
          value={dateTo}
          onChange={(v) => updateFilters({ to: v })}
          min={dateFrom || undefined}
          ariaLabel="Date de fin"
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setImportanceFilter('all')
              setPageFilter('all')
              setDateFrom('')
              setDateTo('')
              setKindFilter('all')
              setWindowSize(PAGE_SIZE)
            }}
            className="rounded-md px-2 py-1.5 text-xs font-medium text-ink-muted underline-offset-2 hover:text-ink-secondary hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <DashboardStateView
          state="no_data"
          title="Aucune entrée dans ce filtre"
          description="Changez de filtre pour voir les autres entrées de l'historique."
        />
      ) : (
        <>
          <ol className="space-y-3">
            {filtered.map((entry: any) => (
              <TimelineItem key={`${entry.kind}-${entry.id}`} entry={entry} />
            ))}
          </ol>

          {data.hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                disabled={isFetching}
                onClick={() => setWindowSize((w) => w + PAGE_SIZE)}
                className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-xs font-medium text-ink-secondary transition-colors hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFetching && <Loader2 className="size-3.5 animate-spin" />}
                Charger plus
              </button>
            </div>
          )}
        </>
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
                <FieldDiff field={field} oldValue={oldVal} newValue={newVal} />
              </div>
            )
          })}
        </div>
      ) : (
        // Fallback vers l'ancien format (snippets) — maintenant avec diff mot-à-mot aussi
        (entry.beforeSnippet || entry.afterSnippet) && (
          <div className="mt-4 border-t border-border pt-3">
            <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wide">
              Changement détecté
            </span>
            <TextFieldDiff 
              oldValue={entry.beforeSnippet || ''} 
              newValue={entry.afterSnippet || ''} 
            />
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

// Un champ modifié n'est diffable mot-à-mot que si l'avant ET l'après sont
// des chaînes (ou vides/nulles) — les tableaux (liens, thèmes) utilisent
// maintenant un diff élément par élément au lieu de deux colonnes brutes.
function isDiffableString(value: any): value is string | null | undefined {
  return value === null || value === undefined || typeof value === 'string'
}

// Une "section" (extract.ts) a la forme { heading, level, content } — on la
// distingue d'un simple tableau de chaînes (liens, thèmes, etc.) pour lui
// donner un rendu structuré (§A2.5) au lieu du diff élément-par-élément brut.
function isSectionsArray(value: any): value is Array<{ heading: string; level: number; content: string }> {
  return Array.isArray(value) && (value.length === 0 || typeof value[0]?.heading === 'string')
}

function FieldDiff({ field, oldValue, newValue }: { field: string; oldValue: any; newValue: any }) {
  if (field === 'sections' && (isSectionsArray(oldValue) || isSectionsArray(newValue))) {
    return <SectionsFieldDiff oldValue={oldValue ?? []} newValue={newValue ?? []} />
  }

  if (isDiffableString(oldValue) && isDiffableString(newValue)) {
    return <TextFieldDiff oldValue={oldValue ?? ''} newValue={newValue ?? ''} />
  }

  // Pour les tableaux, faire un diff élément par élément
  if (Array.isArray(oldValue) || Array.isArray(newValue)) {
    return <ArrayFieldDiff oldValue={oldValue} newValue={newValue} />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div className="rounded-md bg-danger/5 border border-danger/10 p-2 text-xs text-ink-secondary">
        <span className="text-danger font-medium mb-1 block">Avant</span>
        <DiffValueRenderer value={oldValue} />
      </div>
      <div className="rounded-md bg-success/5 border border-success/10 p-2 text-xs text-ink-secondary">
        <span className="text-success font-medium mb-1 block">Après</span>
        <DiffValueRenderer value={newValue} />
      </div>
    </div>
  )
}

function ArrayFieldDiff({ oldValue, newValue }: { oldValue: any; newValue: any }) {
  const oldArray = Array.isArray(oldValue) ? oldValue : []
  const newArray = Array.isArray(newValue) ? newValue : []
  
  const oldSet = new Set(oldArray.map(String))
  const newSet = new Set(newArray.map(String))
  
  const removed = oldArray.filter((item: any) => !newSet.has(String(item)))
  const added = newArray.filter((item: any) => !oldSet.has(String(item)))
  
  if (removed.length === 0 && added.length === 0) {
    return <p className="text-xs text-ink-muted italic">Aucun changement</p>
  }

  return (
    <div className="rounded-md border border-border bg-canvas font-mono text-[11px] overflow-x-auto">
      {removed.map((item: any, i: number) => (
        <div key={`rm-${i}`} className="flex items-start gap-2 px-3 py-1.5 bg-danger/5 border-b border-danger/10 last:border-b-0">
          <span className="text-danger font-bold shrink-0">−</span>
          <span className="text-danger break-words">{String(item)}</span>
        </div>
      ))}
      {added.map((item: any, i: number) => (
        <div key={`add-${i}`} className="flex items-start gap-2 px-3 py-1.5 bg-success/5 border-b border-success/10 last:border-b-0">
          <span className="text-success font-bold shrink-0">+</span>
          <span className="text-success break-words">{String(item)}</span>
        </div>
      ))}
    </div>
  )
}

// Diff structuré par section (heading + contenu) — remplace l'ancien diff
// sur `body` (texte aplati de toute la page) qui mélangeait nav/header/
// footer et contenu éditorial dans un seul bloc illisible (§A2.5).
function SectionsFieldDiff({
  oldValue,
  newValue,
}: {
  oldValue: Array<{ heading: string; level: number; content: string }>
  newValue: Array<{ heading: string; level: number; content: string }>
}) {
  const oldByHeading = new Map(oldValue.map((s) => [s.heading, s]))
  const newByHeading = new Map(newValue.map((s) => [s.heading, s]))

  const orderedHeadings = [
    ...newValue.map((s) => s.heading),
    ...oldValue.map((s) => s.heading).filter((h) => !newByHeading.has(h)),
  ]

  const rows = orderedHeadings
    .filter((h, i) => orderedHeadings.indexOf(h) === i) // dédupliquer si heading répété
    .map((heading) => {
      const before = oldByHeading.get(heading)
      const after = newByHeading.get(heading)
      if (before && after && before.content === after.content) return null // section inchangée
      return { heading, before, after }
    })
    .filter((row): row is { heading: string; before: typeof oldValue[number] | undefined; after: typeof newValue[number] | undefined } => row !== null)

  if (rows.length === 0) {
    return <p className="text-xs text-ink-muted italic">Aucun changement</p>
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.heading} className="rounded-md border border-border overflow-hidden">
          <div className="px-3 py-1.5 bg-canvas border-b border-border flex items-center gap-1.5">
            <span className="text-xs font-medium text-ink">{row.heading}</span>
            {!row.before && (
              <span className="rounded-sm border border-success/20 bg-success/5 px-1.5 py-0.5 text-[10px] font-medium text-success">
                Ajoutée
              </span>
            )}
            {!row.after && (
              <span className="rounded-sm border border-danger/20 bg-danger/5 px-1.5 py-0.5 text-[10px] font-medium text-danger">
                Supprimée
              </span>
            )}
          </div>
          <div className="p-2">
            <TextFieldDiff oldValue={row.before?.content ?? ''} newValue={row.after?.content ?? ''} />
          </div>
        </div>
      ))}
    </div>
  )
}

function TextFieldDiff({ oldValue, newValue }: { oldValue: string; newValue: string }) {
  if (oldValue === newValue) {
    return <p className="text-xs text-ink-muted italic">Aucun changement</p>
  }

  // Style deux colonnes côte-à-côte pour faciliter la comparaison
  const oldTruncated = oldValue.length > 300 ? oldValue.slice(0, 300) + '...' : oldValue
  const newTruncated = newValue.length > 300 ? newValue.slice(0, 300) + '...' : newValue

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* Colonne AVANT */}
      <div className="rounded-md border border-danger/20 bg-danger/5">
        <div className="border-b border-danger/20 px-3 py-1.5 bg-danger/10">
          <span className="text-[10px] font-bold text-danger uppercase tracking-wide">Avant</span>
        </div>
        <div className="px-3 py-2">
          <p className="text-xs leading-relaxed text-ink-secondary break-words whitespace-pre-wrap">
            {oldTruncated || <span className="italic text-ink-muted opacity-60">(Vide)</span>}
          </p>
        </div>
      </div>

      {/* Colonne APRÈS */}
      <div className="rounded-md border border-success/20 bg-success/5">
        <div className="border-b border-success/20 px-3 py-1.5 bg-success/10">
          <span className="text-[10px] font-bold text-success uppercase tracking-wide">Après</span>
        </div>
        <div className="px-3 py-2">
          <p className="text-xs leading-relaxed text-ink-secondary break-words whitespace-pre-wrap">
            {newTruncated || <span className="italic text-ink-muted opacity-60">(Vide)</span>}
          </p>
        </div>
      </div>
    </div>
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
