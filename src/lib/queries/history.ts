// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'

export type TimelineKind = 'run' | 'change' | 'event'

export interface RunEntry {
  kind: 'run'
  id: string
  date: string
  status: 'pending' | 'measuring' | 'partial' | 'success' | 'failed'
  score: number | null
  scoreDelta: number | null
  questionsTotal: number
  questionsCompleted: number
}

export interface ChangeEntry {
  kind: 'change'
  id: string
  date: string
  pageUrl: string
  changeType: string
  importance: 'low' | 'watch' | 'high' | 'critical'
  confidence: number
  detectionMethod: string
  beforeSnippet: string | null
  afterSnippet: string | null
  linkedRunDate: string | null
  changedFields: string[] | null
  oldContent: any | null
  newContent: any | null
  runsWithinWindow: number | null
  runsRequired: number | null
  reliable: boolean | null
}

export interface EventEntry {
  kind: 'event'
  id: string
  date: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string | null
}

export type TimelineEntry = RunEntry | ChangeEntry | EventEntry

export interface HistoryPage {
  id: string
  url: string
}

export interface HistoryFilters {
  importance: 'low' | 'watch' | 'high' | 'critical' | null
  pageId: string | null
  dateFrom: string | null // ISO date (yyyy-mm-dd), borne incluse
  dateTo: string | null // ISO date (yyyy-mm-dd), borne incluse
}

const PAGE_SIZE = 20

// Timeline unique : mesures (measurement_runs) + modifications de site
// (site_changes) + événements importants non redondants (events dont la
// source n'est ni une mesure ni une modification, pour éviter les doublons
// avec les deux entrées ci-dessus). Rien n'est masqué, y compris les
// changements de faible importance — l'UI se charge de réduire l'emphase
// visuelle, jamais de retirer l'entrée.
//
// Pagination : `windowSize` est la taille de fenêtre demandée à chaque
// source (élargie de PAGE_SIZE à chaque "Charger plus", pas un offset —
// on refetch depuis le début à chaque fois pour garder un tri global
// cohérent entre les 3 sources fusionnées). `hasMore` est vrai si l'une
// des sources a renvoyé exactement sa limite (donc peut contenir plus).
//
// Filtrage : `importance` et `pageId` ne concernent que les modifications
// de site — quand l'un des deux est actif, les mesures et événements sont
// exclus de la requête (ils n'ont pas ces attributs). `dateFrom`/`dateTo`
// s'appliquent à toutes les sources interrogées.
export const fetchHistory = createServerFn({ method: 'GET' })
  .validator(
    (input: { windowSize?: number; filters?: Partial<HistoryFilters> } | undefined) => ({
      windowSize: input?.windowSize ?? PAGE_SIZE,
      filters: {
        importance: input?.filters?.importance ?? null,
        pageId: input?.filters?.pageId ?? null,
        dateFrom: input?.filters?.dateFrom ?? null,
        dateTo: input?.filters?.dateTo ?? null,
      } as HistoryFilters,
    }),
  )
  .handler(async ({ data: { windowSize, filters } }): Promise<any> => {
    const supabase = getSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return { brand: null } as const

    const { data: brand } = await supabase
      .from('brands')
      .select('*')
      .eq('owner_id', auth.user.id)
      .maybeSingle()

    if (!brand) return { brand: null } as const

    const restrictedToChanges = Boolean(filters.importance || filters.pageId)

    // Bornes de dates : dateTo inclusif → on pousse à la fin de journée.
    const dateFromIso = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).toISOString() : null
    const dateToIso = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999`).toISOString() : null

    let runsQuery = supabase
      .from('measurement_runs')
      .select('*')
      .eq('brand_id', brand.id)
      .order('started_at', { ascending: false })
      .limit(windowSize)
    if (dateFromIso) runsQuery = runsQuery.gte('started_at', dateFromIso)
    if (dateToIso) runsQuery = runsQuery.lte('started_at', dateToIso)

    let changesQuery = supabase
      .from('site_changes')
      .select('*')
      .eq('brand_id', brand.id)
      .order('detected_at', { ascending: false })
      .limit(windowSize)
    if (filters.importance) changesQuery = changesQuery.eq('importance', filters.importance)
    if (filters.pageId) changesQuery = changesQuery.eq('page_id', filters.pageId)
    if (dateFromIso) changesQuery = changesQuery.gte('detected_at', dateFromIso)
    if (dateToIso) changesQuery = changesQuery.lte('detected_at', dateToIso)

    let eventsQuery = supabase
      .from('events')
      .select('*')
      .eq('brand_id', brand.id)
      .eq('show_history', true)
      .in('source_type', ['opportunity', 'system', 'billing'])
      .order('created_at', { ascending: false })
      .limit(windowSize)
    if (dateFromIso) eventsQuery = eventsQuery.gte('created_at', dateFromIso)
    if (dateToIso) eventsQuery = eventsQuery.lte('created_at', dateToIso)

    const [{ data: runs }, { data: changes }, { data: events }, { data: pages }] = await Promise.all([
      restrictedToChanges ? Promise.resolve({ data: [] as any[] }) : runsQuery,
      changesQuery,
      restrictedToChanges ? Promise.resolve({ data: [] as any[] }) : eventsQuery,
      supabase.from('site_pages').select('id, url').eq('brand_id', brand.id),
    ])

    const pageUrlById = new Map((pages ?? []).map((p) => [p.id, p.url]))
    const runDateById = new Map((runs ?? []).map((r) => [r.id, r.completed_at ?? r.started_at]))

    const runEntries: RunEntry[] = (runs ?? []).map((r) => ({
      kind: 'run',
      id: r.id,
      date: r.completed_at ?? r.started_at,
      status: r.status,
      score: r.score,
      scoreDelta: r.score_delta,
      questionsTotal: r.questions_total,
      questionsCompleted: r.questions_completed,
    }))

    const { RELIABILITY_WINDOW_MS, RUNS_REQUIRED } = await import('~/lib/reliability')

    const changeEntries: ChangeEntry[] = (changes ?? []).map((c) => {
      let runsWithinWindow: number | null = null
      let reliable: boolean | null = null

      if (c.importance !== 'low') {
        const detectedAtDate = new Date(c.detected_at)
        const windowEndsAtDate = new Date(detectedAtDate.getTime() + RELIABILITY_WINDOW_MS)

        const runsInWindow = (runs ?? []).filter((r) => {
          if (r.status !== 'success') return false
          const runDate = new Date(r.completed_at ?? r.started_at)
          return runDate >= detectedAtDate && runDate <= windowEndsAtDate
        })
        runsWithinWindow = runsInWindow.length
        reliable = runsWithinWindow >= RUNS_REQUIRED
      }

      return {
        kind: 'change',
        id: c.id,
        date: c.detected_at,
        pageUrl: pageUrlById.get(c.page_id) ?? 'Page inconnue',
        changeType: c.change_type,
        importance: c.importance,
        confidence: c.confidence,
        detectionMethod: c.detection_method,
        beforeSnippet: c.before_snippet,
        afterSnippet: c.after_snippet,
        linkedRunDate: c.linked_run_id ? (runDateById.get(c.linked_run_id) ?? null) : null,
        changedFields: c.changed_fields,
        oldContent: c.old_content,
        newContent: c.new_content,
        runsWithinWindow,
        runsRequired: RUNS_REQUIRED,
        reliable,
      }
    })

    const eventEntries: EventEntry[] = (events ?? []).map((e) => ({
      kind: 'event',
      id: e.id,
      date: e.created_at,
      type: e.type,
      title: e.title,
      message: e.message,
    }))

    const entries: TimelineEntry[] = [...runEntries, ...changeEntries, ...eventEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

    // Une source a peut-être plus d'entrées au-delà de la fenêtre actuelle
    // si elle a renvoyé exactement sa limite.
    const hasMore =
      (runs ?? []).length === windowSize ||
      (changes ?? []).length === windowSize ||
      (events ?? []).length === windowSize

    const historyPages: HistoryPage[] = (pages ?? []).map((p) => ({ id: p.id, url: p.url }))

    return { brand, entries, hasMore, windowSize, pages: historyPages } as const
  })
