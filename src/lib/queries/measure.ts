// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient, getSupabaseAdminClient } from '~/lib/supabase/server'
import type { Database } from '~/lib/supabase/database.types'
import { runOpenAIQuery } from '~/lib/openai'
import { analyzeAnswer } from '~/lib/analysis'
import { isBrandCited, extractBrandDomain } from '~/lib/cited'
import { computeRunScore } from '~/lib/score'
import { aggregateSamples } from '~/lib/aggregate'
import { isFreePlan, FREE_SAMPLES_PER_QUESTION, PRO_SAMPLES_PER_QUESTION } from '~/lib/plan'

// Pipeline de mesure (Bloc 0 — §7.3 du doc de conception).
// Architecturé en deux server functions distinctes pour rester dans les
// limites de durée d'une fonction serverless Vercel :
//
//   1. triggerMeasurementRun — crée le run en DB, retourne runId immédiatement (<1s)
//   2. processNextQuestion   — traite UNE question par appel, boucle côté client
//
// Chaque appel à processNextQuestion est donc court (1 aller-retour LLM ~15-60s)
// et ne dépasse pas les limites Vercel par défaut.

const MEASUREMENT_DELAY_DAYS = 1

type RunStatus = Database['public']['Tables']['measurement_runs']['Row']['status']
type MeasurementRun = Database['public']['Tables']['measurement_runs']['Row']
type Brand = Database['public']['Tables']['brands']['Row']

/** Vérifie le délai entre deux mesures manuelles (MEASUREMENT_DELAY_DAYS ci-dessus,
 *  actuellement 1 jour — le commentaire précédent mentionnait 7 jours à tort,
 *  corrigé lors de la refonte v2 ; à valider côté produit si 7j était la vraie
 *  intention, auquel cas changer uniquement la constante, pas cette fonction).
 *  Utilise .or() au lieu de .in('status', [...]) pour éviter l'erreur TS
 *  liée à l'inférence stricte du type enum dans le client Supabase. */
async function checkMeasurementDelay(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  brandId: string,
): Promise<{ allowed: boolean; daysRemaining: number }> {
  const { data: lastRun } = await supabase
    .from('measurement_runs')
    .select('completed_at')
    .eq('brand_id', brandId)
    .eq('status', 'success')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!lastRun?.completed_at) return { allowed: true, daysRemaining: 0 }

  const elapsedDays =
    (Date.now() - new Date(lastRun.completed_at).getTime()) / (1000 * 60 * 60 * 24)
  const daysRemaining = Math.max(0, Math.ceil(MEASUREMENT_DELAY_DAYS - elapsedDays))

  return { allowed: daysRemaining === 0, daysRemaining }
}

// ─── Server Function 1 : démarrer un run ──────────────────────────────────────

export const triggerMeasurementRun = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (typeof data !== 'object' || data === null || typeof (data as Record<string, unknown>).brandId !== 'string') {
      throw new Error('brandId manquant')
    }
    return data as { brandId: string }
  })
  .handler(async ({ data }): Promise<any> => {
    const supabase = getSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) throw new Error('Non authentifié')

    // Vérifie que la marque appartient à l'utilisateur (RLS)
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, name, website_url, plan')
      .eq('id', data.brandId)
      .eq('owner_id', auth.user.id)
      .maybeSingle()

    if (brandError || !brand) throw new Error('Marque introuvable ou accès refusé')

    if (isFreePlan(brand.plan)) {
      // Plan Free : jamais de remesure, quel que soit le délai — une seule
      // mesure "aperçu" à vie tant que le compte n'est pas passé en Pro.
      const { data: existingRun } = await supabase
        .from('measurement_runs')
        .select('id')
        .eq('brand_id', brand.id)
        .or('status.eq.success,status.eq.partial')
        .limit(1)
        .maybeSingle()

      if (existingRun) {
        throw new Error('Mesure gratuite déjà utilisée — passez au plan Pro pour remesurer.')
      }
    } else {
      // Vérifie le délai entre deux mesures (plans payants uniquement)
      const { allowed, daysRemaining } = await checkMeasurementDelay(supabase, brand.id)
      if (!allowed) {
        throw new Error(
          `Prochaine mesure manuelle disponible dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}.`,
        )
      }
    }

    // Compte les questions actives
    const { count: questionsTotal } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
      .eq('active', true)

    if (!questionsTotal || questionsTotal === 0) {
      throw new Error(
        "Aucune question active configurée — ajoutez des questions dans Paramètres avant de lancer une mesure.",
      )
    }

    // Cherche un changement non fiable à lier
    const { getChangeReliabilityStatus } = await import('~/lib/reliability')
    const reliability = await getChangeReliabilityStatus(supabase, brand.id)
    const linkedChangeId = reliability && !reliability.reliable ? reliability.changeId : null

    // Crée le run
    const { data: run, error: runError } = await supabase
      .from('measurement_runs')
      .insert({
        brand_id: brand.id,
        status: 'pending' as RunStatus,
        questions_total: questionsTotal,
        questions_completed: 0,
        started_at: new Date().toISOString(),
        linked_change_id: linkedChangeId,
      })
      .select()
      .single()

    if (runError || !run) throw new Error('Impossible de créer le run : ' + runError?.message)

    return { runId: run.id }
  })

export const cancelMeasurementRun = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (typeof data !== 'object' || data === null || typeof (data as Record<string, unknown>).runId !== 'string') {
      throw new Error('runId manquant')
    }
    return data as { runId: string }
  })
  .handler(async ({ data }) => {
    const adminSupabase = getSupabaseAdminClient()
    const userSupabase = getSupabaseServerClient()
    
    const { data: auth } = await userSupabase.auth.getUser()
    if (!auth.user) throw new Error('Non authentifié')

    const { data: run, error: runError } = await adminSupabase
      .from('measurement_runs')
      .select('id, brand_id, status')
      .eq('id', data.runId)
      .single()

    if (runError || !run) throw new Error('Run introuvable')

    const { data: brand, error: brandError } = await adminSupabase
      .from('brands')
      .select('owner_id')
      .eq('id', run.brand_id)
      .single()

    if (brandError || !brand || brand.owner_id !== auth.user.id) throw new Error('Accès refusé')

    if (run.status === 'pending' || run.status === 'measuring') {
      await adminSupabase
        .from('measurement_runs')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', run.id)
        
      await adminSupabase.from('events').insert({
        brand_id: run.brand_id,
        type: 'warning',
        title: 'Mesure annulée',
        message: 'La mesure a été annulée par l\'utilisateur.',
        source_type: 'measurement_run',
        source_id: run.id,
        show_toast: false,
        show_notification: true,
        show_history: true,
        read: false,
      })
    }
    return { success: true }
  })

// ─── Server Function 2 : traiter une question ─────────────────────────────────

export interface ProcessNextResult {
  done: boolean
  run: {
    id: string
    status: RunStatus
    questions_completed: number
    questions_total: number
    score: number | null
  }
}

export const processNextQuestion = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (typeof data !== 'object' || data === null || typeof (data as Record<string, unknown>).runId !== 'string') {
      throw new Error('runId manquant')
    }
    return data as { runId: string }
  })
  .handler(async ({ data }): Promise<ProcessNextResult> => {
    // Client admin pour les opérations du pipeline (insert observations, etc.)
    // La vérification d'appartenance est faite ci-dessous via userSupabase.
    const adminSupabase = getSupabaseAdminClient()
    const userSupabase = getSupabaseServerClient()

    // Vérifie que l'utilisateur courant est authentifié
    const { data: auth } = await userSupabase.auth.getUser()
    if (!auth.user) throw new Error('Non authentifié')

    // Charge le run (sans jointure — la jointure brands!inner casse l'inférence TS)
    const { data: run, error: runError } = await adminSupabase
      .from('measurement_runs')
      .select('*')
      .eq('id', data.runId)
      .single()

    if (runError || !run) throw new Error('Run introuvable')

    // Charge la marque séparément pour éviter la jointure non typée
    const { data: brand, error: brandError } = await adminSupabase
      .from('brands')
      .select('id, name, website_url, owner_id, plan')
      .eq('id', run.brand_id)
      .single()

    if (brandError || !brand) throw new Error('Marque introuvable')

    // Vérifie l'appartenance
    if (brand.owner_id !== auth.user.id) throw new Error('Accès refusé')

    // Run déjà terminé → retourne done immédiatement (idempotent)
    if (run.status === 'success' || run.status === 'failed' || run.status === 'partial') {
      return {
        done: true,
        run: {
          id: run.id,
          status: run.status,
          questions_completed: run.questions_completed,
          questions_total: run.questions_total,
          score: run.score,
        },
      }
    }

    // Passe en 'measuring' si encore 'pending'
    if (run.status === 'pending') {
      await adminSupabase
        .from('measurement_runs')
        .update({ status: 'measuring' as RunStatus })
        .eq('id', run.id)
    }

    // Questions déjà traitées pour ce run (idempotence)
    const { data: doneObservations } = await adminSupabase
      .from('observations')
      .select('question_id')
      .eq('run_id', run.id)

    const doneQuestionIds = new Set((doneObservations ?? []).map((o) => o.question_id))

    // Prochaine question à traiter
    const { data: questions } = await adminSupabase
      .from('questions')
      .select('id, text')
      .eq('brand_id', brand.id)
      .eq('active', true)
      .order('position', { ascending: true })

    const nextQuestion = (questions ?? []).find((q) => !doneQuestionIds.has(q.id))

    // ─── Plus de questions → finaliser le run ──────────────────────────────
    if (!nextQuestion) {
      // Calcule le score global à partir de toutes les observations du run
      const { data: allObs } = await adminSupabase
        .from('observations')
        .select('brand_mentioned, brand_recommended, brand_position, raw_answer')
        .eq('run_id', run.id)

      const score = computeRunScore(allObs ?? [])
      const completedCount = doneQuestionIds.size

      // Score delta vs run précédent — .or() au lieu de .in() pour éviter never
      const { data: prevRun } = await adminSupabase
        .from('measurement_runs')
        .select('score')
        .eq('brand_id', brand.id)
        .eq('status', 'success')
        .neq('id', run.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const scoreDelta =
        prevRun?.score != null ? score - Math.round(prevRun.score) : null

      // Détermine le statut final
      const totalQuestions = run.questions_total
      const successfulCount = (allObs ?? []).filter(o => o.raw_answer !== null).length
      let finalStatus: 'success' | 'partial' | 'failed'
      if (successfulCount === 0) {
        finalStatus = 'failed'
      } else if (successfulCount < totalQuestions) {
        finalStatus = 'partial'
      } else {
        finalStatus = 'success'
      }

      const completedAt = new Date().toISOString()

      await adminSupabase
        .from('measurement_runs')
        .update({
          status: finalStatus as RunStatus,
          score,
          score_delta: scoreDelta,
          completed_at: completedAt,
          questions_completed: completedCount,
        })
        .eq('id', run.id)

      // Insère un event de notification
      await adminSupabase.from('events').insert({
        brand_id: brand.id,
        type: (finalStatus === 'failed' ? 'error' : finalStatus === 'partial' ? 'warning' : 'success') as Database['public']['Tables']['events']['Row']['type'],
        title:
          finalStatus === 'failed'
            ? 'La mesure a échoué'
            : finalStatus === 'partial'
              ? `Mesure partielle (${successfulCount}/${totalQuestions} réussies)`
              : 'Mesure terminée',
        message:
          finalStatus !== 'failed'
            ? `Score de visibilité IA : ${score}/100${scoreDelta != null ? ` (${scoreDelta >= 0 ? '+' : ''}${scoreDelta} depuis la dernière mesure)` : ''}`
            : null,
        source_type: 'measurement_run',
        source_id: run.id,
        show_toast: true,
        show_notification: true,
        show_history: true,
        read: false,
      })

      // Déclenche l'Opportunity Engine (non-bloquant)
      if (finalStatus === 'success' || finalStatus === 'partial') {
        import('~/lib/opportunities_engine').then(({ generateOpportunitiesForRun }) => {
          generateOpportunitiesForRun(run.id, brand.id, adminSupabase).catch((err) =>
            console.error('Erreur generateOpportunitiesForRun:', err)
          )
        })
      }

      return {
        done: true,
        run: {
          id: run.id,
          status: finalStatus,
          questions_completed: completedCount,
          questions_total: totalQuestions,
          score,
        },
      }
    }

    // ─── Traitement de la question suivante ────────────────────────────────
    // Refonte v2 (Evidence Engine) : une IA générative n'est pas déterministe,
    // donc UNE question = SAMPLES_PER_QUESTION appels indépendants, agrégés
    // par vote majoritaire — jamais une conclusion sur un seul appel.
    // Voir doc de refonte §3.2/3.3 et src/lib/aggregate.ts.
    const brandDomain = brand.website_url ? extractBrandDomain(brand.website_url) : ''
    const SAMPLES_PER_QUESTION = isFreePlan(brand.plan) ? FREE_SAMPLES_PER_QUESTION : PRO_SAMPLES_PER_QUESTION

    try {
      // Étape A : SAMPLES_PER_QUESTION appels ChatGPT indépendants, en parallèle
      // (sinon le temps de traitement par question est multiplié par 3)
      const rawResults = await Promise.all(
        Array.from({ length: SAMPLES_PER_QUESTION }, () => runOpenAIQuery(nextQuestion.text)),
      )

      // Étape B : concurrents déjà connus, injectés dans chaque parsing pour
      // éviter que l'IA en rate ou change légèrement leur nom d'un échantillon à l'autre.
      const { data: existingCompetitors } = await adminSupabase
        .from('competitors')
        .select('name')
        .eq('brand_id', brand.id)
      const knownCompetitorNames = (existingCompetitors ?? []).map((c) => c.name)

      // Étape C : chaque échantillon est analysé séparément (pas de moyenne sur le texte brut)
      const analyses = await Promise.all(
        rawResults.map((r) => analyzeAnswer(r.text, brand.name, brandDomain, knownCompetitorNames)),
      )

      // cited déterministe par échantillon (non utilisé dans la DB pour l'instant,
      // prévu pour la colonne brand_cited dans une future migration §DB-2)
      const _brandCitedPerSample = rawResults.map((r) => isBrandCited(r.citations, brandDomain))

      // Étape D : agrégation par vote majoritaire (voir aggregate.ts)
      const aggregated = aggregateSamples(
        analyses.map((a) => ({
          brand_mentioned: a.brand_mentioned,
          brand_recommended: a.brand_recommended,
          brand_position: a.brand_position,
        })),
      )

      // Étape E : insert/upsert concurrents inconnus, vus sur n'importe quel échantillon
      const allMentionedCompetitors = analyses.flatMap((a) => a.competitors).filter((c) => c.mentioned)
      for (const competitor of allMentionedCompetitors) {
        const { data: existing } = await adminSupabase
          .from('competitors')
          .select('id')
          .eq('brand_id', brand.id)
          .ilike('name', competitor.name)
          .maybeSingle()

        if (!existing) {
          await adminSupabase.from('competitors').insert({
            brand_id: brand.id,
            name: competitor.name,
            hidden: false,
            first_seen_at: new Date().toISOString(),
          })
        }
      }

      // Étape F : insert observation agrégée
      const { data: obs, error: obsError } = await adminSupabase
        .from('observations')
        .insert({
          run_id: run.id,
          question_id: nextQuestion.id,
          engine: 'openai',
          brand_mentioned: aggregated.brand_mentioned,
          brand_recommended: aggregated.brand_recommended,
          brand_position: aggregated.brand_position,
          raw_answer: rawResults[0]?.text ?? null, // 1er échantillon conservé pour affichage rapide ; les 3 sont dans observation_samples
          samples_count: aggregated.samples_count,
          agreement_score: aggregated.agreement_score,
        })
        .select()
        .single()

      if (obsError || !obs) throw new Error('Erreur insertion observation : ' + obsError?.message)

      // Étape G : insert des échantillons bruts (traçabilité / Evidence Chain)
      const { error: samplesError } = await adminSupabase.from('observation_samples').insert(
        rawResults.map((r, i) => ({
          observation_id: obs.id,
          sample_index: i + 1,
          engine: 'openai',
          brand_mentioned: analyses[i].brand_mentioned,
          brand_recommended: analyses[i].brand_recommended,
          brand_position: analyses[i].brand_position,
          raw_answer: r.text,
        })),
      )
      if (samplesError) {
        console.error('[measure] Échec insertion observation_samples (non bloquant) :', samplesError)
      }

      // Étape H : insert observation_competitors (agrégés sur tous les échantillons, dédupliqués par concurrent)
      if (allMentionedCompetitors.length > 0) {
        const { data: competitorRows } = await adminSupabase
          .from('competitors')
          .select('id, name')
          .eq('brand_id', brand.id)
          .in(
            'name',
            allMentionedCompetitors.map((c) => c.name),
          )

        const competitorByName = new Map(
          (competitorRows ?? []).map((c) => [c.name.toLowerCase(), c.id]),
        )

        // Un seul enregistrement observation_competitors par concurrent : on garde
        // l'échantillon le plus "favorable" à la détection (recommandé > mentionné,
        // meilleure position) pour ne pas dupliquer sur les 3 échantillons.
        const byCompetitor = new Map<string, (typeof allMentionedCompetitors)[number]>()
        for (const c of allMentionedCompetitors) {
          const key = c.name.toLowerCase()
          const existing = byCompetitor.get(key)
          if (!existing || (c.recommended && !existing.recommended)) {
            byCompetitor.set(key, c)
          }
        }

        const obsCompetitors = [...byCompetitor.values()]
          .map((c) => {
            const competitorId =
              competitorByName.get(c.name.toLowerCase()) ??
              competitorByName.get(
                [...competitorByName.keys()].find((k) =>
                  k.toLowerCase().includes(c.name.toLowerCase()),
                ) ?? '',
              )
            if (!competitorId) return null
            return {
              observation_id: obs.id,
              competitor_id: competitorId,
              mentioned: c.mentioned,
              recommended: c.recommended,
              position: c.position,
              context_excerpt: c.context_excerpt ?? null,
            }
          })
          .filter((x): x is NonNullable<typeof x> => x !== null)

        if (obsCompetitors.length > 0) {
          await adminSupabase.from('observation_competitors').insert(obsCompetitors)
        }
      }

      // Étape I : incrémente questions_completed
      await adminSupabase
        .from('measurement_runs')
        .update({ questions_completed: doneQuestionIds.size + 1 })
        .eq('id', run.id)

      return {
        done: false,
        run: {
          id: run.id,
          status: 'measuring' as RunStatus,
          questions_completed: doneQuestionIds.size + 1,
          questions_total: run.questions_total,
          score: null,
        },
      }
    } catch (err) {
      // Échec sur cette question : logue mais continue — les questions suivantes
      // ne sont pas bloquées (impacte seulement partial vs success à la fin)
      // Le détail complet (ex: rate_limit_exceeded, code, message brut du
      // fournisseur IA) reste UNIQUEMENT dans ce log serveur — jamais dans
      // un event visible utilisateur (Historique / Notifications lisent
      // events.message directement).
      console.error(`[measure] Échec question ${nextQuestion.id} :`, err)

      await adminSupabase.from('events').insert({
        brand_id: brand.id,
        type: 'warning' as Database['public']['Tables']['events']['Row']['type'],
        title: 'Échec sur une question',
        message: `La question "${nextQuestion.text.slice(0, 80)}..." n'a pas pu être mesurée. Réessayez plus tard.`,
        source_type: 'measurement_run',
        source_id: run.id,
        show_toast: false,
        show_notification: false,
        show_history: true,
        read: false,
      })

      // Marque la question comme "traitée" avec une observation vide pour ne
      // pas boucler dessus indéfiniment
      await adminSupabase.from('observations').insert({
        run_id: run.id,
        question_id: nextQuestion.id,
        engine: 'openai',
        brand_mentioned: false,
        brand_recommended: false,
        brand_position: null,
        raw_answer: null,
      })

      await adminSupabase
        .from('measurement_runs')
        .update({ questions_completed: doneQuestionIds.size + 1 })
        .eq('id', run.id)

      return {
        done: false,
        run: {
          id: run.id,
          status: 'measuring' as RunStatus,
          questions_completed: doneQuestionIds.size + 1,
          questions_total: run.questions_total,
          score: null,
        },
      }
    }
  })
