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

const HISTORY_LIMIT = 60

// Timeline unique : mesures (measurement_runs) + modifications de site
// (site_changes) + événements importants non redondants (events dont la
// source n'est ni une mesure ni une modification, pour éviter les doublons
// avec les deux entrées ci-dessus). Rien n'est masqué, y compris les
// changements de faible importance — l'UI se charge de réduire l'emphase
// visuelle, jamais de retirer l'entrée.
export const fetchHistory = createServerFn({ method: 'GET' }).handler(async (): Promise<any> => {
  const supabase = getSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { brand: null } as const

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('owner_id', auth.user.id)
    .maybeSingle()

  if (!brand) return { brand: null } as const

  const [{ data: runs }, { data: changes }, { data: events }, { data: pages }] = await Promise.all(
    [
      supabase
        .from('measurement_runs')
        .select('*')
        .eq('brand_id', brand.id)
        .order('started_at', { ascending: false })
        .limit(HISTORY_LIMIT),
      supabase
        .from('site_changes')
        .select('*')
        .eq('brand_id', brand.id)
        .order('detected_at', { ascending: false })
        .limit(HISTORY_LIMIT),
      supabase
        .from('events')
        .select('*')
        .eq('brand_id', brand.id)
        .eq('show_history', true)
        .in('source_type', ['opportunity', 'system', 'billing'])
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT),
      supabase.from('site_pages').select('id, url').eq('brand_id', brand.id),
    ],
  )

  const pageUrlById = new Map((pages ?? []).map((p) => [p.id, p.url]))
  const runDateById = new Map(
    (runs ?? []).map((r) => [r.id, r.completed_at ?? r.started_at]),
  )

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
      
      const runsInWindow = (runs ?? []).filter(r => {
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

  return { brand, entries } as const
})
