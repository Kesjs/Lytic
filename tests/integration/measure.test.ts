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

vi.mock('~/lib/openai', () => ({
  runOpenAIQuery: vi.fn(),
}))

vi.mock('~/lib/analysis', () => ({
  analyzeAnswer: vi.fn(),
}))

vi.mock('~/lib/opportunities_engine', () => ({
  generateOpportunitiesForRun: vi.fn().mockResolvedValue([]),
}))

import { getSupabaseServerClient, getSupabaseAdminClient } from '~/lib/supabase/server'
import { runOpenAIQuery } from '~/lib/openai'
import { analyzeAnswer } from '~/lib/analysis'
import { triggerMeasurementRun, processNextQuestion } from '~/lib/queries/measure'

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

describe('tests/integration/measure.test.ts', () => {
  const mockUser = { id: 'user-1', email: 'user@example.com' }
  const mockBrand = {
    id: 'brand-1',
    name: 'Ma Marque',
    website_url: 'https://mamarque.com',
    owner_id: 'user-1',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('triggerMeasurementRun', () => {
    it('refuse si brandId est manquant ou invalide', async () => {
      await expect(triggerMeasurementRun({ data: {} as any })).rejects.toThrow('brandId manquant')
      await expect(triggerMeasurementRun({ data: null as any })).rejects.toThrow('brandId manquant')
    })

    it('refuse si l\'utilisateur n\'est pas connecté', async () => {
      ;(getSupabaseServerClient as any).mockReturnValue(
        createMockSupabase({
          auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        }),
      )

      await expect(triggerMeasurementRun({ data: { brandId: 'brand-1' } })).rejects.toThrow(
        'Non authentifié',
      )
    })

    it('refuse si la marque n\'appartient pas à l\'utilisateur', async () => {
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'brands') {
            // maybeSingle retourne null car owner_id ne match pas
            return createChainableBuilder({ data: null, error: null })
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      await expect(triggerMeasurementRun({ data: { brandId: 'brand-other' } })).rejects.toThrow(
        'Marque introuvable ou accès refusé',
      )
    })

    it('refuse si le délai n\'est pas écoulé depuis la dernière mesure', async () => {
      const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // il y a 2 heures
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'brands') {
            return createChainableBuilder({ data: { ...mockBrand, plan: 'active' }, error: null })
          }
          if (table === 'measurement_runs') {
            // checkMeasurementDelay
            return createChainableBuilder({ data: { completed_at: recentDate }, error: null })
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      await expect(triggerMeasurementRun({ data: { brandId: 'brand-1' } })).rejects.toThrow(
        /Prochaine mesure manuelle disponible dans \d+ jours?\./,
      )
    })

    it('refuse si aucune question active n\'est configurée', async () => {
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'brands') {
            return createChainableBuilder({ data: mockBrand, error: null })
          }
          if (table === 'measurement_runs') {
            // aucun run précédent
            return createChainableBuilder({ data: null, error: null })
          }
          if (table === 'questions') {
            return createChainableBuilder({ count: 0, error: null })
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      await expect(triggerMeasurementRun({ data: { brandId: 'brand-1' } })).rejects.toThrow(
        'Aucune question active configurée',
      )
    })

    it('crée un run avec le statut pending et retourne le runId', async () => {
      let insertedRunData: any = null
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'brands') {
            return createChainableBuilder({ data: mockBrand, error: null })
          }
          if (table === 'measurement_runs') {
            const b = createChainableBuilder({ data: null, error: null })
            b.insert = vi.fn((data) => {
              insertedRunData = data
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'run-new-123', ...data },
                    error: null,
                  }),
                }),
              }
            })
            return b
          }
          if (table === 'questions') {
            return createChainableBuilder({ count: 3, error: null })
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      const res = await triggerMeasurementRun({ data: { brandId: 'brand-1' } })
      expect(res).toEqual({ runId: 'run-new-123' })
      expect(insertedRunData.brand_id).toBe('brand-1')
      expect(insertedRunData.status).toBe('pending')
      expect(insertedRunData.questions_total).toBe(3)
      expect(insertedRunData.questions_completed).toBe(0)
    })
  })

  describe('processNextQuestion', () => {
    it('refuse si runId est manquant', async () => {
      await expect(processNextQuestion({ data: {} as any })).rejects.toThrow('runId manquant')
    })

    it('refuse si l\'utilisateur n\'est pas connecté', async () => {
      ;(getSupabaseAdminClient as any).mockReturnValue(createMockSupabase({}))
      ;(getSupabaseServerClient as any).mockReturnValue(
        createMockSupabase({
          auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        }),
      )

      await expect(processNextQuestion({ data: { runId: 'run-1' } })).rejects.toThrow(
        'Non authentifié',
      )
    })

    it('refuse si le run n\'existe pas', async () => {
      ;(getSupabaseServerClient as any).mockReturnValue(
        createMockSupabase({
          auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        }),
      )
      ;(getSupabaseAdminClient as any).mockReturnValue(
        createMockSupabase({
          from: (table: string) => {
            if (table === 'measurement_runs') {
              return createChainableBuilder({ data: null, error: { message: 'Not found' } })
            }
            return createChainableBuilder()
          },
        }),
      )

      await expect(processNextQuestion({ data: { runId: 'run-not-found' } })).rejects.toThrow(
        'Run introuvable',
      )
    })

    it('refuse si la marque du run appartient à un autre utilisateur (cross-user protection)', async () => {
      const run = { id: 'run-1', brand_id: 'brand-other', status: 'measuring' }
      const otherBrand = { id: 'brand-other', owner_id: 'user-other' }

      ;(getSupabaseServerClient as any).mockReturnValue(
        createMockSupabase({
          auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        }),
      )
      ;(getSupabaseAdminClient as any).mockReturnValue(
        createMockSupabase({
          from: (table: string) => {
            if (table === 'measurement_runs') {
              return createChainableBuilder({ data: run, error: null })
            }
            if (table === 'brands') {
              return createChainableBuilder({ data: otherBrand, error: null })
            }
            return createChainableBuilder()
          },
        }),
      )

      await expect(processNextQuestion({ data: { runId: 'run-1' } })).rejects.toThrow(
        'Accès refusé',
      )
    })

    it('idempotence : si le run est déjà terminé (success), retourne done: true sans rien refaire', async () => {
      const completedRun = {
        id: 'run-1',
        brand_id: 'brand-1',
        status: 'success',
        questions_completed: 5,
        questions_total: 5,
        score: 85,
      }

      ;(getSupabaseServerClient as any).mockReturnValue(
        createMockSupabase({
          auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        }),
      )
      ;(getSupabaseAdminClient as any).mockReturnValue(
        createMockSupabase({
          from: (table: string) => {
            if (table === 'measurement_runs') {
              return createChainableBuilder({ data: completedRun, error: null })
            }
            if (table === 'brands') {
              return createChainableBuilder({ data: mockBrand, error: null })
            }
            return createChainableBuilder()
          },
        }),
      )

      const res = await processNextQuestion({ data: { runId: 'run-1' } })
      expect(res.done).toBe(true)
      expect(res.run.status).toBe('success')
      expect(res.run.score).toBe(85)
      expect(runOpenAIQuery).not.toHaveBeenCalled()
    })

    it('traite une question avec succès (OpenAI + insert observation + incrémente)', async () => {
      const run = {
        id: 'run-1',
        brand_id: 'brand-1',
        status: 'pending',
        questions_total: 2,
        questions_completed: 0,
      }
      const questions = [
        { id: 'q1', text: 'Meilleur service IA ?', position: 0 },
        { id: 'q2', text: 'Alternative à X ?', position: 1 },
      ]

      ;(runOpenAIQuery as any).mockResolvedValue({
        text: 'Ma Marque est une très bonne solution ainsi que ConcurA.',
        citations: ['https://mamarque.com/features'],
        usage: { inputTokens: 20, outputTokens: 20 },
        model: 'gpt-4o-mini',
      })
      ;(analyzeAnswer as any).mockResolvedValue({
        parsed: {
          brand_mentioned: true,
          brand_recommended: true,
          brand_position: 1,
          competitors: [{ name: 'ConcurA', mentioned: true, recommended: false, position: 2 }],
        },
        usage: { inputTokens: 20, outputTokens: 20 },
        model: 'gpt-4o-mini',
      })

      let insertedObservation: any = null
      let runUpdate: any = null

      ;(getSupabaseServerClient as any).mockReturnValue(
        createMockSupabase({
          auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        }),
      )
      ;(getSupabaseAdminClient as any).mockReturnValue(
        createMockSupabase({
          from: (table: string) => {
            if (table === 'measurement_runs') {
              const b = createChainableBuilder({ data: run, error: null })
              b.update = vi.fn((u) => {
                runUpdate = u
                return createChainableBuilder()
              })
              return b
            }
            if (table === 'brands') {
              return createChainableBuilder({ data: mockBrand, error: null })
            }
            if (table === 'observations') {
              const b = createChainableBuilder({ data: [], error: null }) // doneObservations = []
              b.insert = vi.fn((obs) => {
                insertedObservation = obs
                return {
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: 'obs-1', ...obs },
                      error: null,
                    }),
                  }),
                }
              })
              return b
            }
            if (table === 'questions') {
              return createChainableBuilder({ data: questions, error: null })
            }
            if (table === 'competitors') {
              return createChainableBuilder({ data: null, error: null })
            }
            if (table === 'observation_competitors') {
              return createChainableBuilder()
            }
            return createChainableBuilder()
          },
        }),
      )

      const res = await processNextQuestion({ data: { runId: 'run-1' } })
      expect(res.done).toBe(false)
      expect(res.run.questions_completed).toBe(1)
      expect(runOpenAIQuery).toHaveBeenCalledWith('Meilleur service IA ?', undefined)
      expect(insertedObservation.brand_mentioned).toBe(true)
      expect(insertedObservation.brand_recommended).toBe(true)
      expect(insertedObservation.brand_position).toBe(1)
    })

    it('tolérance aux pannes : en cas d\'erreur LLM (OpenAI), insère une observation fallback et ne bloque pas', async () => {
      const run = {
        id: 'run-1',
        brand_id: 'brand-1',
        status: 'measuring',
        questions_total: 1,
        questions_completed: 0,
      }
      const questions = [{ id: 'q1', text: 'Question qui crash ?', position: 0 }]

      ;(runOpenAIQuery as any).mockRejectedValue(new Error('OpenAI Rate Limit Exceeded'))

      let fallbackObservation: any = null
      let warningEvent: any = null

      ;(getSupabaseServerClient as any).mockReturnValue(
        createMockSupabase({
          auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        }),
      )
      ;(getSupabaseAdminClient as any).mockReturnValue(
        createMockSupabase({
          from: (table: string) => {
            if (table === 'measurement_runs') {
              return createChainableBuilder({ data: run, error: null })
            }
            if (table === 'brands') {
              return createChainableBuilder({ data: mockBrand, error: null })
            }
            if (table === 'observations') {
              const b = createChainableBuilder({ data: [], error: null })
              b.insert = vi.fn((obs) => {
                fallbackObservation = obs
                return Promise.resolve({ error: null })
              })
              return b
            }
            if (table === 'questions') {
              return createChainableBuilder({ data: questions, error: null })
            }
            if (table === 'events') {
              const b = createChainableBuilder()
              b.insert = vi.fn((evt) => {
                warningEvent = evt
                return Promise.resolve({ error: null })
              })
              return b
            }
            return createChainableBuilder()
          },
        }),
      )

      const res = await processNextQuestion({ data: { runId: 'run-1' } })
      expect(res.done).toBe(false)
      expect(res.run.questions_completed).toBe(1)
      expect(warningEvent?.type).toBe('warning')
      expect(fallbackObservation?.brand_mentioned).toBe(false)
      expect(fallbackObservation?.raw_answer).toBeNull()
    })

    it('finalise le run lorsqu\'il n\'y a plus de questions à traiter et calcule le score et le score_delta', async () => {
      const run = {
        id: 'run-1',
        brand_id: 'brand-1',
        status: 'measuring',
        questions_total: 1,
        questions_completed: 1,
      }
      const questions = [{ id: 'q1', text: 'Question 1', position: 0 }]
      const doneObservations = [{ question_id: 'q1' }]
      const allObs = [
        { brand_mentioned: true, brand_recommended: true, brand_position: 1 }, // score 100
      ]
      const prevRun = { score: 70 } // score delta = 100 - 70 = +30

      let finalRunUpdate: any = null
      let finalEvent: any = null

      ;(getSupabaseServerClient as any).mockReturnValue(
        createMockSupabase({
          auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        }),
      )
      ;(getSupabaseAdminClient as any).mockReturnValue(
        createMockSupabase({
          from: (table: string) => {
            if (table === 'measurement_runs') {
              const b = createChainableBuilder({ data: run, error: null })
              b.update = vi.fn((u) => {
                finalRunUpdate = u
                return createChainableBuilder()
              })
              b.maybeSingle = vi.fn().mockResolvedValue({ data: prevRun, error: null })
              return b
            }
            if (table === 'brands') {
              return createChainableBuilder({ data: mockBrand, error: null })
            }
            if (table === 'observations') {
              const b = createChainableBuilder({ data: doneObservations, error: null })
              b.select = vi.fn((fields: string) => {
                if (fields.includes('question_id')) {
                  return createChainableBuilder({ data: doneObservations, error: null })
                }
                if (fields.includes('brand_mentioned')) {
                  return createChainableBuilder({ data: allObs, error: null })
                }
                return createChainableBuilder({ data: [], error: null })
              })
              return b
            }
            if (table === 'questions') {
              return createChainableBuilder({ data: questions, error: null })
            }
            if (table === 'events') {
              const b = createChainableBuilder()
              b.insert = vi.fn((evt) => {
                finalEvent = evt
                return Promise.resolve({ error: null })
              })
              return b
            }
            return createChainableBuilder()
          },
        }),
      )

      const res = await processNextQuestion({ data: { runId: 'run-1' } })
      expect(res.done).toBe(true)
      expect(res.run.status).toBe('success')
      expect(res.run.score).toBe(100)
      expect(finalRunUpdate?.score).toBe(100)
      expect(finalRunUpdate?.score_delta).toBe(30)
      expect(finalEvent?.type).toBe('success')
    })
  })
})
