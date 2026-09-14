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

import { getSupabaseServerClient } from '~/lib/supabase/server'
import {
  fetchSettings,
  updateProfileName,
  updatePassword,
  updateBrandSite,
  createBrandWithQuestions,
  addQuestion,
  updateQuestionText,
  toggleQuestionActive,
  updateNotificationPreferences,
} from '~/lib/queries/settings'

function createMockSupabase(handlers: {
  auth?: { getUser?: any; updateUser?: any }
  from?: (table: string) => any
}) {
  return {
    auth: {
      getUser: handlers.auth?.getUser ?? vi.fn().mockResolvedValue({ data: { user: null } }),
      updateUser: handlers.auth?.updateUser ?? vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    from: handlers.from ?? vi.fn(() => createChainableBuilder()),
  }
}

function createChainableBuilder(result: any = { data: null, error: null, count: null }) {
  const b: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve: any) => Promise.resolve(result).then(resolve),
  }
  return b
}

describe('tests/integration/settings.test.ts', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchSettings', () => {
    it('retourne null si l\'utilisateur n\'est pas authentifié', async () => {
      ;(getSupabaseServerClient as any).mockReturnValue(
        createMockSupabase({
          auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        }),
      )

      const result = await fetchSettings()
      expect(result).toBeNull()
    })

    it('retourne un profil avec brand null si l\'utilisateur n\'a pas de marque', async () => {
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'profiles') {
            return createChainableBuilder({
              data: { id: mockUser.id, email: mockUser.email, full_name: 'John Doe' },
              error: null,
            })
          }
          if (table === 'brands') {
            return createChainableBuilder({ data: null, error: null })
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      const result = await fetchSettings()
      expect(result).not.toBeNull()
      expect(result?.profile.id).toBe(mockUser.id)
      expect(result?.profile.fullName).toBe('John Doe')
      expect(result?.brand).toBeNull()
      expect(result?.questions).toEqual([])
      expect(result?.notifications).toBeNull()
    })

    it('retourne la marque, les questions et les notifications complètes', async () => {
      const mockBrand = {
        id: 'brand-1',
        name: 'Mon Entreprise',
        website_url: 'https://mon-entreprise.fr',
        plan: 'trial',
        created_at: '2026-01-01T00:00:00Z',
      }
      const mockQuestions = [
        { id: 'q1', text: 'Quels sont les meilleurs logiciels ?', active: true, position: 0 },
      ]
      const mockNotif = {
        brand_id: 'brand-1',
        email_enabled: true,
        notify_measurement_run: true,
        notify_site_change: false,
        notify_opportunity: true,
        notify_billing: true,
      }

      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'profiles') {
            return createChainableBuilder({
              data: { id: mockUser.id, email: mockUser.email, full_name: 'Alice' },
              error: null,
            })
          }
          if (table === 'brands') {
            return createChainableBuilder({ data: mockBrand, error: null })
          }
          if (table === 'questions') {
            return createChainableBuilder({ data: mockQuestions, error: null })
          }
          if (table === 'notification_preferences') {
            return createChainableBuilder({ data: mockNotif, error: null })
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      const result = await fetchSettings()
      expect(result?.brand?.name).toBe('Mon Entreprise')
      expect(result?.questions).toHaveLength(1)
      expect(result?.notifications?.emailEnabled).toBe(true)
    })
  })

  describe('updateProfileName', () => {
    it('refuse si l\'utilisateur n\'est pas authentifié', async () => {
      ;(getSupabaseServerClient as any).mockReturnValue(
        createMockSupabase({
          auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        }),
      )

      await expect(updateProfileName({ data: 'Nouveau Nom' })).rejects.toThrow('Non authentifié')
    })

    it('utilise upsert pour garantir la persistance même sans ligne profile préexistante (régression fix)', async () => {
      let upsertPayload: any = null
      let upsertOptions: any = null

      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          const builder = createChainableBuilder({ data: null, error: null })
          if (table === 'profiles') {
            builder.upsert = vi.fn((payload, options) => {
              upsertPayload = payload
              upsertOptions = options
              return Promise.resolve({ error: null })
            })
          }
          return builder
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      const res = await updateProfileName({ data: '  Jean Dupont  ' })
      expect(res).toEqual({ success: true })
      expect(upsertPayload).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        full_name: 'Jean Dupont',
      })
      expect(upsertOptions).toEqual({ onConflict: 'id' })
    })

    it('lève une erreur si l\'upsert échoue', async () => {
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          const builder = createChainableBuilder()
          builder.upsert = vi.fn().mockResolvedValue({ error: { message: 'Database error' } })
          return builder
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      await expect(updateProfileName({ data: 'Jean' })).rejects.toThrow('Database error')
    })
  })

  describe('updatePassword', () => {
    it('refuse si le mot de passe fait moins de 8 caractères', async () => {
      await expect(updatePassword({ data: '1234567' })).rejects.toThrow(
        'Le mot de passe doit contenir au moins 8 caractères.',
      )
    })

    it('appelle supabase.auth.updateUser avec le nouveau mot de passe', async () => {
      const updateUserMock = vi.fn().mockResolvedValue({ error: null })
      const mockClient = createMockSupabase({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
          updateUser: updateUserMock,
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      const res = await updatePassword({ data: 'NouveauMotDePasse123!' })
      expect(res).toEqual({ success: true })
      expect(updateUserMock).toHaveBeenCalledWith({ password: 'NouveauMotDePasse123!' })
    })
  })

  describe('updateBrandSite', () => {
    it('refuse si la marque n\'appartient pas à l\'utilisateur', async () => {
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'brands') {
            // maybeSingle retourne null car owner_id !== user.id
            return createChainableBuilder({ data: null, error: null })
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      await expect(
        updateBrandSite({
          data: { brandId: 'brand-other', name: 'Nom', websiteUrl: 'https://site.fr' },
        }),
      ).rejects.toThrow('Marque introuvable')
    })

    it('refuse si le nom est vide', async () => {
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'brands') {
            return createChainableBuilder({ data: { id: 'brand-1' }, error: null })
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      await expect(
        updateBrandSite({
          data: { brandId: 'brand-1', name: '   ', websiteUrl: 'https://site.fr' },
        }),
      ).rejects.toThrow('Le nom de la marque est requis.')
    })

    it('refuse si l\'URL est invalide', async () => {
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'brands') {
            return createChainableBuilder({ data: { id: 'brand-1' }, error: null })
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      await expect(
        updateBrandSite({
          data: { brandId: 'brand-1', name: 'Nom', websiteUrl: 'invalide-url' },
        }),
      ).rejects.toThrow('URL invalide')
    })

    it('met à jour la marque avec succès si les données sont valides', async () => {
      let updatedData: any = null
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          const builder = createChainableBuilder({ data: { id: 'brand-1' }, error: null })
          builder.update = vi.fn((d) => {
            updatedData = d
            return builder
          })
          return builder
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      const res = await updateBrandSite({
        data: { brandId: 'brand-1', name: 'Nouveau Nom', websiteUrl: 'https://nouveau-site.com' },
      })
      expect(res).toEqual({ success: true })
      expect(updatedData).toEqual({ name: 'Nouveau Nom', website_url: 'https://nouveau-site.com' })
    })
  })

  describe('createBrandWithQuestions', () => {
    it('refuse si une marque est déjà configurée pour ce compte', async () => {
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'brands') {
            return createChainableBuilder({ data: { id: 'existing-brand' }, error: null })
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      await expect(
        createBrandWithQuestions({
          data: { name: 'Brand', websiteUrl: 'https://site.fr', questions: ['Question 1 ?'] },
        }),
      ).rejects.toThrow('Une marque est déjà configurée pour ce compte.')
    })

    it('refuse si aucune question n\'est fournie', async () => {
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'brands') {
            return createChainableBuilder({ data: null, error: null })
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      await expect(
        createBrandWithQuestions({
          data: { name: 'Brand', websiteUrl: 'https://site.fr', questions: [] },
        }),
      ).rejects.toThrow('Ajoutez au moins une question à suivre.')
    })

    it('refuse si plus de 30 questions sont fournies', async () => {
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'brands') {
            return createChainableBuilder({ data: null, error: null })
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      const questions = Array.from({ length: 31 }, (_, i) => `Question ${i + 1} ?`)
      await expect(
        createBrandWithQuestions({
          data: { name: 'Brand', websiteUrl: 'https://site.fr', questions },
        }),
      ).rejects.toThrow('Limite de 30 questions suivies atteinte pour ce plan.')
    })

    it('refuse si une question dépasse la longueur maximale (300 caractères)', async () => {
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'brands') {
            return createChainableBuilder({ data: null, error: null })
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      const longQuestion = 'a'.repeat(301)
      await expect(
        createBrandWithQuestions({
          data: { name: 'Brand', websiteUrl: 'https://site.fr', questions: [longQuestion] },
        }),
      ).rejects.toThrow('Une question dépasse la limite de 300 caractères.')
    })

    it('crée avec succès la marque, les questions et les préférences de notification', async () => {
      const insertedBrand = { id: 'new-brand-id' }
      let insertedQuestions: any = null
      let insertedNotifs: any = null

      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'brands') {
            const b = createChainableBuilder({ data: null, error: null })
            b.insert = vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: insertedBrand, error: null }),
              }),
            })
            return b
          }
          if (table === 'questions') {
            const b = createChainableBuilder()
            b.insert = vi.fn((q) => {
              insertedQuestions = q
              return Promise.resolve({ error: null })
            })
            return b
          }
          if (table === 'notification_preferences') {
            const b = createChainableBuilder()
            b.insert = vi.fn((n) => {
              insertedNotifs = n
              return Promise.resolve({ error: null })
            })
            return b
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      const res = await createBrandWithQuestions({
        data: {
          name: 'Nouvelle Marque',
          websiteUrl: 'https://nouvelle-marque.com',
          questions: ['Quelle est la meilleure solution ?', 'Quel outil choisir ?'],
        },
      })

      expect(res).toEqual({ success: true, brandId: 'new-brand-id' })
      expect(insertedQuestions).toHaveLength(2)
      expect(insertedQuestions[0]).toEqual({
        brand_id: 'new-brand-id',
        text: 'Quelle est la meilleure solution ?',
        position: 0,
      })
      expect(insertedNotifs).toEqual({ brand_id: 'new-brand-id' })
    })
  })

  describe('addQuestion', () => {
    it('refuse si le quota de 30 questions est déjà atteint', async () => {
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'brands') {
            return createChainableBuilder({ data: { id: 'brand-1' }, error: null })
          }
          if (table === 'questions') {
            return createChainableBuilder({ count: 30, error: null })
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      await expect(
        addQuestion({
          data: { brandId: 'brand-1', text: 'Nouvelle question ?' },
        }),
      ).rejects.toThrow('Limite de 30 questions suivies atteinte pour ce plan.')
    })

    it('insère la nouvelle question avec position = count actuel', async () => {
      let insertedRow: any = null
      const mockClient = createMockSupabase({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: (table: string) => {
          if (table === 'brands') {
            return createChainableBuilder({ data: { id: 'brand-1' }, error: null })
          }
          if (table === 'questions') {
            const b = createChainableBuilder({ count: 5, error: null })
            b.insert = vi.fn((row) => {
              insertedRow = row
              return Promise.resolve({ error: null })
            })
            return b
          }
          return createChainableBuilder()
        },
      })
      ;(getSupabaseServerClient as any).mockReturnValue(mockClient)

      const res = await addQuestion({
        data: { brandId: 'brand-1', text: 'Autre question ?' },
      })
      expect(res).toEqual({ success: true })
      expect(insertedRow).toEqual({
        brand_id: 'brand-1',
        text: 'Autre question ?',
        position: 5,
      })
    })
  })
})
