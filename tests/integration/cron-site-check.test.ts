import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'

// Mock léger de createFileRoute : on n'a besoin que d'accéder au handler
// POST déclaré dans `server.handlers`, pas d'un vrai contexte de routeur.
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: any) => ({ options }),
}))

vi.mock('~/lib/supabase/server', () => ({
  getSupabaseAdminClient: vi.fn(),
}))

// Bug corrigé (21/09/2026) : le fichier mockait 4 fonctions qui n'ont
// jamais existé (triggerSiteCrawlForBrandId, runCrawlToCompletion,
// triggerMeasurementRunForBrandId, runMeasurementToCompletion) — la vraie
// route src/routes/api/cron/site-check.ts boucle en interne sur
// triggerSiteCrawl/processNextPage et triggerMeasurementRun/processNextQuestion,
// sans passer par des helpers "ForBrandId" séparés. checkMeasurementDelay est
// définie localement dans la route (non exportée) : la mocker depuis
// ~/lib/queries/measure n'avait aucun effet réel, elle est retirée ici.
vi.mock('~/lib/crawler/orchestrate', () => ({
  triggerSiteCrawl: vi.fn(),
  processNextPage: vi.fn(),
}))

vi.mock('~/lib/queries/measure', () => ({
  triggerMeasurementRun: vi.fn(),
  processNextQuestion: vi.fn(),
}))

vi.mock('~/lib/reliability', () => ({
  getFreeRemeasureUnlock: vi.fn(),
}))

import { getSupabaseAdminClient } from '~/lib/supabase/server'
import { triggerSiteCrawl, processNextPage } from '~/lib/crawler/orchestrate'
import { triggerMeasurementRun, processNextQuestion } from '~/lib/queries/measure'
import { getFreeRemeasureUnlock } from '~/lib/reliability'
import { Route } from '~/routes/api/cron/site-check'

const postHandler = (Route as any).options.server.handlers.POST as (ctx: {
  request: Request
}) => Promise<Response>

function createChainableBuilder(result: any = { data: null, error: null }) {
  const b: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve: any) => Promise.resolve(result).then(resolve),
  }
  return b
}

function makeRequest(secret?: string) {
  return new Request('https://example.com/api/cron/site-check', {
    method: 'POST',
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  })
}

describe('tests/integration/cron-site-check.test.ts', () => {
  const originalSecret = process.env.CRON_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'test-secret'
  })

  afterAll(() => {
    process.env.CRON_SECRET = originalSecret
  })

  it('refuse sans CRON_SECRET configuré côté serveur', async () => {
    delete process.env.CRON_SECRET
    const res = await postHandler({ request: makeRequest('anything') })
    expect(res.status).toBe(500)
  })

  it('refuse une requête sans le bon secret (401)', async () => {
    const res = await postHandler({ request: makeRequest('wrong-secret') })
    expect(res.status).toBe(401)
  })

  it('refuse une requête sans en-tête Authorization (401)', async () => {
    const res = await postHandler({ request: makeRequest() })
    expect(res.status).toBe(401)
  })

  it('exclut les marques past_due/canceled et ignore les marques sans website_url', async () => {
    const brands = [
      { id: 'b-free', name: 'Free Brand', website_url: 'https://free.com', plan: 'free' },
      { id: 'b-pastdue', name: 'Past Due', website_url: 'https://pastdue.com', plan: 'past_due' },
      { id: 'b-canceled', name: 'Canceled', website_url: 'https://canceled.com', plan: 'canceled' },
      { id: 'b-nourl', name: 'No URL', website_url: null, plan: 'active' },
    ]

    ;(getSupabaseAdminClient as any).mockReturnValue({
      from: (table: string) => {
        if (table === 'brands') return createChainableBuilder({ data: brands, error: null })
        return createChainableBuilder()
      },
    })
    ;(triggerSiteCrawl as any).mockResolvedValue({ runId: 'crawl-1' })
    ;(processNextPage as any).mockResolvedValue({ done: true })

    const res = await postHandler({ request: makeRequest('test-secret') })
    const body = await res.json()

    expect(res.status).toBe(200)
    // Marques éligibles après filtrage past_due/canceled : b-free (crawlée)
    // et b-nourl (gardée dans les résultats mais ignorée, faute de
    // website_url) — b-pastdue et b-canceled sont exclues avant la boucle.
    expect(body.processed).toBe(2)
    const freeResult = body.results.find((r: any) => r.brandId === 'b-free')
    const noUrlResult = body.results.find((r: any) => r.brandId === 'b-nourl')
    expect(freeResult.crawl).toBe('ok')
    // Free : jamais de remesure automatique (§4.2)
    expect(freeResult.remeasure).toBe('skipped')
    expect(noUrlResult.crawl).toBe('skipped')
    expect(noUrlResult.remeasure).toBe('skipped')
    expect(triggerMeasurementRun).not.toHaveBeenCalled()
  })

  it('déclenche la remesure automatique pour une marque Pro éligible', async () => {
    const brands = [
      { id: 'b-pro', name: 'Pro Brand', website_url: 'https://pro.com', plan: 'active' },
    ]

    ;(getSupabaseAdminClient as any).mockReturnValue({
      from: (table: string) => {
        if (table === 'brands') return createChainableBuilder({ data: brands, error: null })
        // measurement_runs : aucun run précédent → checkMeasurementDelay
        // interne à la route renvoie allowed = true (jamais mesuré encore).
        if (table === 'measurement_runs') return createChainableBuilder({ data: null, error: null })
        return createChainableBuilder()
      },
    })
    ;(triggerSiteCrawl as any).mockResolvedValue({ runId: 'crawl-1' })
    ;(processNextPage as any).mockResolvedValue({ done: true })
    ;(getFreeRemeasureUnlock as any).mockResolvedValue({ available: true, changeId: null })
    ;(triggerMeasurementRun as any).mockResolvedValue({ runId: 'run-1' })
    ;(processNextQuestion as any).mockResolvedValue({ done: true, run: { status: 'success', score: 100 } })

    const res = await postHandler({ request: makeRequest('test-secret') })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.results[0].remeasure).toBe('triggered')
    expect(triggerMeasurementRun).toHaveBeenCalledWith({ data: { brandId: 'b-pro', cronSecret: 'test-secret' } })
    expect(processNextQuestion).toHaveBeenCalledWith({ data: { runId: 'run-1', cronSecret: 'test-secret' } })
  })

  it('ne déclenche pas de remesure Pro sans changement de site non lié (getFreeRemeasureUnlock indisponible)', async () => {
    const brands = [
      { id: 'b-pro', name: 'Pro Brand', website_url: 'https://pro.com', plan: 'trial' },
    ]

    ;(getSupabaseAdminClient as any).mockReturnValue({
      from: (table: string) => {
        if (table === 'brands') return createChainableBuilder({ data: brands, error: null })
        return createChainableBuilder()
      },
    })
    ;(triggerSiteCrawl as any).mockResolvedValue({ runId: 'crawl-1' })
    ;(processNextPage as any).mockResolvedValue({ done: true })
    ;(getFreeRemeasureUnlock as any).mockResolvedValue({ available: false, changeId: null })

    const res = await postHandler({ request: makeRequest('test-secret') })
    const body = await res.json()

    expect(body.results[0].remeasure).toBe('skipped')
    expect(triggerMeasurementRun).not.toHaveBeenCalled()
  })
})
