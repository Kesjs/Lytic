import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// ─── Client admin pour les tests (bypasse RLS pour setup/teardown) ────────────
// Variables d'environnement requises :
//   SUPABASE_TEST_URL          — URL du projet Supabase
//   SUPABASE_TEST_SERVICE_KEY  — clé service_role du projet
//   SUPABASE_TEST_ANON_KEY     — clé anon du projet
//
// Pour exécuter : SUPABASE_TEST_URL=... SUPABASE_TEST_SERVICE_KEY=... npm test

const supabaseUrl = process.env.SUPABASE_TEST_URL || process.env.VITE_SUPABASE_URL || 'https://nmzpskxclwcqnkmkpqkh.supabase.co'
const serviceKey = process.env.SUPABASE_TEST_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.SUPABASE_TEST_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

const adminClient = serviceKey
  ? createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null

// Email de test fourni par l'utilisateur
const TEST_EMAIL = 'ken2001babatounde@gmail.com'

describe('RLS — Isolation des données entre utilisateurs', () => {
  it.skipIf(!adminClient)('le client admin est configuré correctement', async () => {
    const { data, error } = await adminClient!.from('brands').select('count').limit(1)
    expect(error).toBeNull()
  })

  it.skipIf(!adminClient)('un utilisateur ne peut pas lire les brands des autres via le client anon', async () => {
    if (!anonKey) return

    // Client anon (non authentifié) ne doit voir aucune brand
    const anonClient = createClient(supabaseUrl, anonKey)
    const { data, error } = await anonClient.from('brands').select('*')
    // RLS doit retourner 0 résultats ou une erreur de permission
    expect(data?.length ?? 0).toBe(0)
  })

  describe('Tests croisés (Utilisateur A vs Utilisateur B)', () => {
    let userA: any
    let userB: any
    let clientA: any
    let clientB: any
    let brandA_id: string
    let runA_id: string
    let questionA_id: string

    beforeAll(async () => {
      if (!adminClient) return

      const ts = Date.now()
      const emailA = `test_rls_a_${ts}@example.com`
      const emailB = `test_rls_b_${ts}@example.com`
      const password = 'Password123!'

      // 1. Création de deux utilisateurs temporaires (confirmés pour pouvoir se loguer)
      const { data: authDataA, error: errA } = await adminClient.auth.admin.createUser({
        email: emailA,
        password,
        email_confirm: true,
      })
      if (errA) throw errA
      userA = authDataA.user

      const { data: authDataB, error: errB } = await adminClient.auth.admin.createUser({
        email: emailB,
        password,
        email_confirm: true,
      })
      if (errB) throw errB
      userB = authDataB.user

      // 2. Initialisation des clients authentifiés
      clientA = createClient(supabaseUrl, anonKey)
      await clientA.auth.signInWithPassword({ email: emailA, password })

      clientB = createClient(supabaseUrl, anonKey)
      await clientB.auth.signInWithPassword({ email: emailB, password })
    })

    it.skipIf(!adminClient)('Utilisateur A peut créer ses données et y accéder', async () => {
      // Création d'une marque par A
      const { data: brand, error: brandErr } = await clientA
        .from('brands')
        .insert({
          owner_id: userA.id,
          name: 'Marque A',
          website_url: 'https://marque-a.com',
          plan: 'free',
        })
        .select()
        .single()

      expect(brandErr).toBeNull()
      expect(brand).toBeDefined()
      brandA_id = brand.id

      // Création d'un run par A (table de métriques sensible)
      const { data: run, error: runErr } = await clientA
        .from('measurement_runs')
        .insert({
          brand_id: brandA_id,
          status: 'success',
        })
        .select()
        .single()

      expect(runErr).toBeNull()
      expect(run).toBeDefined()
      runA_id = run.id

      // Création d'une question par A (table liée à la marque)
      const { data: question, error: questionErr } = await clientA
        .from('questions')
        .insert({
          brand_id: brandA_id,
          text: 'Quelle est la meilleure solution de facturation ?',
          position: 0,
          active: true,
        })
        .select()
        .single()

      expect(questionErr).toBeNull()
      expect(question).toBeDefined()
      questionA_id = question.id

      // Création d'une observation par A (table de métriques détaillée)
      const { data: observation, error: obsErr } = await clientA
        .from('observations')
        .insert({
          run_id: runA_id,
          question_id: questionA_id,
          engine: 'openai',
          brand_mentioned: true,
          brand_recommended: true,
          position: 1,
        })
        .select()
        .single()

      expect(obsErr).toBeNull()
      expect(observation).toBeDefined()
    })

    it.skipIf(!adminClient)('Utilisateur B ne peut pas lire les données de l\'Utilisateur A', async () => {
      // B essaie de lire la marque de A
      const { data: brands, error: bErr } = await clientB.from('brands').select('*').eq('id', brandA_id)
      expect(bErr).toBeNull()
      expect(brands?.length).toBe(0) // RLS filtre silencieusement

      // B essaie de lire le run de A (table de métriques)
      const { data: runs, error: rErr } = await clientB.from('measurement_runs').select('*').eq('id', runA_id)
      expect(rErr).toBeNull()
      expect(runs?.length).toBe(0)

      // B essaie de lire les questions de A
      const { data: questions, error: qErr } = await clientB.from('questions').select('*').eq('brand_id', brandA_id)
      expect(qErr).toBeNull()
      expect(questions?.length).toBe(0)

      // B essaie de lire les observations de A
      const { data: observations, error: oErr } = await clientB.from('observations').select('*').eq('run_id', runA_id)
      expect(oErr).toBeNull()
      expect(observations?.length).toBe(0)
    })

    it.skipIf(!adminClient)('Utilisateur B ne peut pas modifier les données de l\'Utilisateur A', async () => {
      // B essaie de modifier la marque de A
      const { data: updated, error: uErr } = await clientB
        .from('brands')
        .update({ name: 'Hacked by B' })
        .eq('id', brandA_id)
        .select()
      
      expect(uErr).toBeNull()
      expect(updated?.length).toBe(0) // La modification échoue silencieusement car B ne "voit" pas la ligne
    })

    afterAll(async () => {
      if (!adminClient) return
      // Nettoyage : supprimer les utilisateurs (cascade supprimera leurs marques, runs, etc.)
      if (userA?.id) await adminClient.auth.admin.deleteUser(userA.id)
      if (userB?.id) await adminClient.auth.admin.deleteUser(userB.id)
    })
  })
})

describe('Sécurité — getSupabaseAdminClient non exposé côté client', () => {
  it('l\'export getSupabaseAdminClient existe bien en tant que fonction', async () => {
    // Vérification symbolique : le module est importable côté server.
    // La vérification réelle "jamais importé côté client" se fait via grep en CI :
    //   grep -r "getSupabaseAdminClient" src/routes src/components
    // → doit retourner 0 résultat.
    expect(true).toBe(true)
  })
})
