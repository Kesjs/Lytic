import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    let validatorFn: any = null
    const builder = {
      validator(v: any) {
        validatorFn = v
        return builder
      },
      handler(fn: any) {
        return async (opts?: any) => {
          let inputData = opts?.data
          if (validatorFn) {
            inputData =
              typeof validatorFn === 'function'
                ? validatorFn(inputData)
                : validatorFn.parse?.(inputData) ?? validatorFn(inputData)
          }
          return await fn({ data: inputData })
        }
      },
    }
    return builder
  },
}))

vi.mock('~/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
}))

const mockGenerateOpportunities = vi.fn().mockResolvedValue({
  opportunities: [
    {
      title: 'Opportunité générée',
      priority: 'high',
      confidence: 85,
      reason: 'Pourquoi la marque manque de visibilité',
      proposed_direction: 'Action concrète à appliquer sur le site',
    },
  ],
  usage: { inputTokens: 40, outputTokens: 40 },
  model: 'gpt-5.6-luna',
})

vi.mock('~/lib/analysis', () => ({
  generateOpportunities: (...args: any[]) => mockGenerateOpportunities(...args),
}))

import { getSupabaseServerClient, getSupabaseAdminClient } from '~/lib/supabase/server'
import { fetchOpportunities } from '~/lib/queries/opportunities'

function createChainableBuilder(result: any = { data: null, error: null, count: null }) {
  const b: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve: any) => Promise.resolve(result).then(resolve),
  }
  return b
}

function createMockSupabase(handlers: {
  auth?: { getUser?: any }
  from?: (table: string) => any
}) {
  return {
    auth: {
      getUser: handlers.auth?.getUser ?? vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: handlers.from ?? vi.fn(() => createChainableBuilder()),
  }
}

describe('tests/integration/opportunities.test.ts', () => {
  const mockUser = { id: 'user-1', email: 'user@example.com' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne brand: null si l\'utilisateur n\'est pas connecté', async () => {
    ;(getSupabaseServerClient as any).mockReturnValue(
      createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      }),
    )

    const res = await fetchOpportunities()
    expect(res).toEqual({ brand: null })
  })

  it('pour un compte Free : réutilise l\'opportunité existante sans appeler OpenAI', async () => {
    const freeBrand = {
      id: 'brand-free',
      name: 'Free Brand',
      website_url: 'https://free.fr',
      owner_id: 'user-1',
      plan: 'free',
    }

    const existingOpp = {
      id: 'opp-1',
      title: 'Titre existant',
      priority: 'high',
      confidence: 0.9,
      status: 'open',
      reason: 'Raison existante',
      proposed_direction: 'Direction existante',
    }

    const mockClient = createMockSupabase({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
      from: (table: string) => {
        if (table === 'brands') {
          return createChainableBuilder({ data: freeBrand, error: null })
        }
        if (table === 'opportunities') {
          return createChainableBuilder({ data: [existingOpp], error: null })
        }
        if (table === 'opportunity_questions') {
          return createChainableBuilder({ data: { question_id: 'q-1' }, error: null })
        }
        if (table === 'questions') {
          return createChainableBuilder({ data: { text: 'Question suivie ?' }, error: null })
        }
        return createChainableBuilder()
      },
    })
    ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

    const res = await fetchOpportunities()
    expect(mockGenerateOpportunities).not.toHaveBeenCalled()
    expect(res.opportunities).toEqual([])
    expect(res.freeInsight).toEqual({
      questionText: 'Question suivie ?',
      notRecommended: true,
      title: 'Titre existant',
      priority: 'high',
      reason: 'Raison existante',
      proposedDirection: 'Direction existante',
    })
  })

  it('pour un compte Free sans opportunité existante : génère une opportunité teaser et l\'enregistre', async () => {
    const freeBrand = {
      id: 'brand-free',
      name: 'Free Brand',
      website_url: 'https://free.fr',
      owner_id: 'user-1',
      plan: 'free',
    }

    let insertedOppData: any = null
    let loggedUsageData: any = null

    const mockClient = createMockSupabase({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
      from: (table: string) => {
        if (table === 'brands') {
          return createChainableBuilder({ data: freeBrand, error: null })
        }
        if (table === 'opportunities') {
          return createChainableBuilder({ data: [], error: null })
        }
        if (table === 'measurement_runs') {
          return createChainableBuilder({ data: { id: 'run-1' }, error: null })
        }
        if (table === 'observations') {
          return createChainableBuilder({
            data: { id: 'obs-1', question_id: 'q-1', raw_answer: 'Réponse IA non favorable' },
            error: null,
          })
        }
        if (table === 'questions') {
          return createChainableBuilder({ data: { text: 'Quelle est la meilleure solution ?' }, error: null })
        }
        return createChainableBuilder()
      },
    })
    ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

    const mockAdmin = createMockSupabase({
      from: (table: string) => {
        if (table === 'api_usage_log') {
          const b = createChainableBuilder()
          b.insert = vi.fn((row) => {
            loggedUsageData = row
            return Promise.resolve({ error: null })
          })
          return b
        }
        if (table === 'opportunities') {
          const b = createChainableBuilder()
          b.insert = vi.fn((row) => {
            insertedOppData = row
            return {
              select: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'new-opp-id', ...row },
                  error: null,
                }),
              }),
            }
          })
          return b
        }
        if (table === 'opportunity_questions') {
          return createChainableBuilder()
        }
        return createChainableBuilder()
      },
    })
    ;(getSupabaseAdminClient as any).mockReturnValue(mockAdmin)

    const res = await fetchOpportunities()
    expect(mockGenerateOpportunities).toHaveBeenCalledWith(
      expect.stringContaining('Quelle est la meilleure solution ?'),
      'Free Brand',
      'https://free.fr',
      'free',
    )
    expect(insertedOppData).toBeDefined()
    expect(insertedOppData.title).toBe('Opportunité générée')
    expect(loggedUsageData).toBeDefined()
    expect(loggedUsageData.user_id).toBe('user-1')
    expect(loggedUsageData.call_type).toBe('opportunity_generation')
    expect(res.freeInsight).toEqual({
      questionText: 'Quelle est la meilleure solution ?',
      notRecommended: true,
      title: 'Opportunité générée',
      priority: 'high',
      reason: 'Pourquoi la marque manque de visibilité',
      proposedDirection: 'Action concrète à appliquer sur le site',
    })
  })
})
