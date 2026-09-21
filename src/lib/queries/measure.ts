import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient, getSupabaseAdminClient } from '~/lib/supabase/server'
import type { Database } from '~/lib/supabase/database.types'
import { runOpenAIQuery } from '~/lib/openai'
import { calculateCost } from '~/lib/openai-pricing'
import { runPerplexityQuery } from '~/lib/perplexity'
import { calculatePerplexityCost } from '~/lib/perplexity-pricing'
import { analyzeAnswer } from '~/lib/analysis'
import { isBrandCited, extractBrandDomain } from '~/lib/cited'
import { computeRunScore } from '~/lib/score'
import { aggregateSamples } from '~/lib/aggregate'
import { isFreePlan, getEngineMix, MEASUREMENT_DELAY_DAYS, FREE_MEASUREMENTS_PER_WEEK, FREE_MEASUREMENT_WINDOW_DAYS, type MeasurementEngine } from '~/lib/plan'
import { getFreeRemeasureUnlock } from '~/lib/reliability'
import { insertEvent } from '~/lib/events'

// Pipeline de mesure (Bloc 0 — §7.3 du doc de conception).
// Architecturé en deux server functions distinctes pour rester dans les
// limites de durée d'une fonction serverless Vercel :
//
//   1. triggerMeasurementRun — crée le run en DB, retourne runId immédiatement (<1s)
//   2. processNextQuestion   — traite UNE question par appel, boucle côté client
//
// Chaque appel à processNextQuestion est donc court (1 aller-retour LLM ~15-60s)
// et ne dépasse pas les limites Vercel par défaut.

type RunStatus = Database['public']['Tables']['measurement_runs']['Row']['status']
type MeasurementRun = Database['public']['Tables']['measurement_runs']['Row']
type Brand = Database['public']['Tables']['brands']['Row']

/** Vérifie le délai entre deux mesures manuelles (MEASUREMENT_DELAY_DAYS,
 *  importée de plan.ts — actuellement 1 jour, seule source de vérité,
 *  partagée avec l'affichage du bouton côté client pour ne plus diverger).
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
    return data as { brandId: string; cronSecret?: string }
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

    let freeUnlockChangeId: string | null = null

    if (isFreePlan(brand.plan)) {
      // Plan Free — décision #7/#12 : quota glissant de FREE_MEASUREMENTS_PER_WEEK
      // par fenêtre de FREE_MEASUREMENT_WINDOW_DAYS jours, à vie récurrent.
      // Un changement de site significatif débloque un slot BONUS additif
      // (getFreeRemeasureUnlock) au-delà du quota — jamais en remplacement.
      const windowStart = new Date(
        Date.now() - FREE_MEASUREMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString()

      const { count: runsThisWeek } = await supabase
        .from('measurement_runs')
        .select('id', { count: 'exact', head: true })
        .eq('brand_id', brand.id)
        .or('status.eq.success,status.eq.partial')
        .gte('completed_at', windowStart)

      const weeklyQuotaReached = (runsThisWeek ?? 0) >= FREE_MEASUREMENTS_PER_WEEK

      if (weeklyQuotaReached) {
        // Quota hebdo épuisé — seul un slot bonus (changement de site non consommé)
        // peut débloquer une remesure supplémentaire.
        const { data: lastFreeRun } = await supabase
          .from('measurement_runs')
          .select('id, completed_at')
          .eq('brand_id', brand.id)
          .or('status.eq.success,status.eq.partial')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const unlock = await getFreeRemeasureUnlock(
          supabase,
          brand.id,
          lastFreeRun?.completed_at ?? null,
        )

        if (!unlock.available) {
          throw new Error(
            `Quota atteint (${FREE_MEASUREMENTS_PER_WEEK} mesures sur ${FREE_MEASUREMENT_WINDOW_DAYS} jours). ` +
            `Revenez la semaine prochaine, ou passez Pro pour mesurer quotidiennement.`,
          )
        }
        // Slot bonus actif — on consomme le changement de site
        freeUnlockChangeId = unlock.changeId
      }
      // Si quota non atteint : aucune restriction supplémentaire, mesure autorisée.
    } else {
      // Vérifie le délai entre deux mesures (plans payants uniquement)
      // Bug réel révélé en levant @ts-nocheck (#17) : `adminSupabase` n'était
      // jamais déclaré dans ce fichier — le chemin cron (cronSecret) aurait
      // levé une ReferenceError au premier appel programmé. On utilise le
      // getter déjà importé en haut du fichier.
      const { allowed, daysRemaining } = await checkMeasurementDelay(
        data.cronSecret && data.cronSecret === process.env.CRON_SECRET
          ? getSupabaseAdminClient()
          : supabase,
        brand.id,
      )
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

    // Cherche un changement non fiable à lier (plans payants — suivi de
    // fiabilité §21j/15runs, sans lien avec la règle Free ci-dessus)
    let linkedChangeId: string | null = freeUnlockChangeId
    if (!isFreePlan(brand.plan)) {
      const { getChangeReliabilityStatus } = await import('~/lib/reliability')
      const reliability = await getChangeReliabilityStatus(supabase, brand.id)
      linkedChangeId = reliability && !reliability.reliable ? reliability.changeId : null
    }

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

    // Marque le changement de site comme consommé pour ce déblocage Free,
    // pour qu'il ne puisse pas débloquer une deuxième remesure.
    if (freeUnlockChangeId) {
      await supabase
        .from('site_changes')
        .update({ linked_run_id: run.id })
        .eq('id', freeUnlockChangeId)
    }

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
        
      await insertEvent(adminSupabase, {
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

    // Moteurs à interroger pour ce plan (multi-moteur — voir plan.ts).
    // Une question n'est "faite" que quand TOUS ses moteurs ont une
    // observation, pas juste un seul — sinon une reprise après crash sur le
    // 2e moteur marquerait la question comme définitivement traitée avec
    // seulement la moitié des données.
    const engineMix = getEngineMix(brand.plan)
    const enginesForQuestion = Array.from(new Set(engineMix))

    // Questions déjà traitées pour ce run (idempotence), par (question, moteur)
    const { data: doneObservations } = await adminSupabase
      .from('observations')
      .select('question_id, engine')
      .eq('run_id', run.id)

    const doneKeys = new Set((doneObservations ?? []).map((o) => `${o.question_id}:${o.engine}`))
    const isQuestionFullyDone = (questionId: string) =>
      enginesForQuestion.every((e) => doneKeys.has(`${questionId}:${e}`))

    // Prochaine question à traiter
    const { data: questions } = await adminSupabase
      .from('questions')
      .select('id, text')
      .eq('brand_id', brand.id)
      .eq('active', true)
      .order('position', { ascending: true })

    const nextQuestion = (questions ?? []).find((q) => !isQuestionFullyDone(q.id))
    const completedQuestionsCount = (questions ?? []).filter((q) => isQuestionFullyDone(q.id)).length

    // ─── Plus de questions → finaliser le run ──────────────────────────────
    if (!nextQuestion) {
      // Calcule le score global à partir de toutes les observations du run
      const { data: allObs } = await adminSupabase
        .from('observations')
        .select('brand_mentioned, brand_recommended, brand_position, raw_answer')
        .eq('run_id', run.id)

      const score = computeRunScore(allObs ?? [])
      const completedCount = completedQuestionsCount

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

      // Détermine le statut final — comparé au nombre d'observations ATTENDU
      // (questions × moteurs), pas juste au nombre de questions : avec 2
      // moteurs, une question 100% réussie produit 2 observations, donc
      // comparer à totalQuestions sous-estimerait systématiquement les échecs.
      const totalQuestions = run.questions_total
      const expectedObservations = totalQuestions * enginesForQuestion.length
      const successfulCount = (allObs ?? []).filter(o => o.raw_answer !== null).length
      let finalStatus: 'success' | 'partial' | 'failed'
      if (successfulCount === 0) {
        finalStatus = 'failed'
      } else if (successfulCount < expectedObservations) {
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
      await insertEvent(adminSupabase, {
        brand_id: brand.id,
        type: (finalStatus === 'failed' ? 'error' : finalStatus === 'partial' ? 'warning' : 'success') as Database['public']['Tables']['events']['Row']['type'],
        title:
          finalStatus === 'failed'
            ? 'La mesure a échoué'
            : finalStatus === 'partial'
              ? `Mesure partielle (${successfulCount}/${expectedObservations} réussies)`
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

      // Déclenche l'Opportunity Engine (non-bloquant) — Pro uniquement.
      // §8 de l'audit détection : le teaser Free (1 opportunité gratuite,
      // sans doublon) est déjà géré par `fetchOpportunities` à la visite du
      // dashboard ; le déclenchement automatique ici court-circuitait ce
      // teaser en générant une opportunité supplémentaire à chaque run
      // stable suivant. On le limite donc au Pro, où il reste protégé par
      // le garde-fou de déduplication ajouté dans generateOpportunitiesForRun.
      if ((finalStatus === 'success' || finalStatus === 'partial') && !isFreePlan(brand.plan)) {
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
    // donc UNE question = plusieurs appels indépendants par moteur, agrégés
    // par vote majoritaire — jamais une conclusion sur un seul appel.
    // Voir doc de refonte §3.2/3.3 et src/lib/aggregate.ts.
    //
    // Multi-moteur : une question peut désormais produire DEUX observations
    // (une par moteur dans enginesForQuestion), chacune agrégée séparément —
    // c'est ce qui alimente la comparaison par moteur du dashboard
    // (EngineRadarChart lit observations.engine directement, sans changement
    // frontend nécessaire). Le budget total d'appels par question ne change
    // pas : voir PRO_ENGINE_MIX / FREE_ENGINE_MIX dans plan.ts.
    const brandDomain = brand.website_url ? extractBrandDomain(brand.website_url) : ''

    // Alias figés pour que le typage narrowé (non-null) des checks ci-dessus
    // survive dans processEngine — une closure imbriquée ne conserve pas le
    // narrowing de contrôle de flux sur la variable d'origine (limitation TS),
    // mais le conserve sur un alias `const` jamais réassigné comme ceux-ci.
    const question = nextQuestion
    const currentBrand = brand
    const currentRun = run

    // Ne (re)traite que les moteurs manquants pour cette question — au 1er
    // passage c'est tous les moteurs, en reprise après échec partiel c'est
    // seulement celui qui a échoué (l'autre garde son observation existante).
    const missingEngines = enginesForQuestion.filter((e) => !doneKeys.has(`${nextQuestion.id}:${e}`))

    // Concurrents déjà connus, injectés dans chaque parsing pour éviter que
    // l'IA en rate ou change légèrement leur nom d'un échantillon à l'autre.
    // Récupéré une fois, partagé entre les moteurs de cette question.
    const { data: existingCompetitors } = await adminSupabase
      .from('competitors')
      .select('name')
      .eq('brand_id', brand.id)
    const knownCompetitorNames = (existingCompetitors ?? []).map((c) => c.name)

    /** Traite un moteur pour la question courante : appels bruts → analyse →
     *  agrégation → insertion observation + samples + competitors. Isolé par
     *  moteur pour qu'un échec Perplexity ne fasse pas perdre un succès
     *  ChatGPT déjà obtenu dans le même appel (et vice-versa). */
    async function processEngine(engine: MeasurementEngine): Promise<{ engine: MeasurementEngine; ok: boolean }> {
      const sampleCount = engineMix.filter((e) => e === engine).length

      try {
        // Étape A : sampleCount appels indépendants pour ce moteur, en parallèle
        const rawResults = await Promise.all(
          Array.from({ length: sampleCount }, () =>
            engine === 'perplexity'
              ? runPerplexityQuery(question.text)
              : runOpenAIQuery(question.text, currentBrand.plan as 'free' | 'pro'),
          ),
        )

        // Étape B : analyse structurée de chaque échantillon (toujours via le
        // modèle d'analyse OpenAI — cf. analysis.ts — quel que soit le moteur
        // qui a produit le texte brut : coût d'analyse minime, cohérence du parsing)
        const analyses = await Promise.all(
          rawResults.map((r) => analyzeAnswer(r.text, currentBrand.name, brandDomain, knownCompetitorNames, currentBrand.plan as 'free' | 'pro')),
        )

        // Logging des coûts IA — tarification propre à chaque moteur
        let totalInput = 0
        let totalOutput = 0
        rawResults.forEach((r) => {
          totalInput += r.usage?.inputTokens ?? 0
          totalOutput += r.usage?.outputTokens ?? 0
        })
        let analysisInput = 0
        let analysisOutput = 0
        analyses.forEach((a) => {
          analysisInput += a.usage?.inputTokens ?? 0
          analysisOutput += a.usage?.outputTokens ?? 0
        })
        try {
          const rows: Record<string, unknown>[] = []
          if (totalInput > 0 || totalOutput > 0) {
            const actualModel = rawResults[0]?.model || (engine === 'perplexity' ? 'sonar' : 'gpt-5.6-luna')
            const cost =
              engine === 'perplexity'
                ? calculatePerplexityCost(actualModel, totalInput, totalOutput, sampleCount)
                : calculateCost(actualModel, totalInput, totalOutput)
            rows.push({
              brand_id: currentBrand.id,
              user_id: currentBrand.owner_id,
              call_type: 'measurement',
              model: actualModel,
              tokens_input: totalInput,
              tokens_output: totalOutput,
              estimated_cost_usd: cost,
            })
          }
          if (analysisInput > 0 || analysisOutput > 0) {
            rows.push({
              brand_id: currentBrand.id,
              user_id: currentBrand.owner_id,
              call_type: 'analysis',
              model: 'gpt-5.6-luna',
              tokens_input: analysisInput,
              tokens_output: analysisOutput,
              estimated_cost_usd: calculateCost('gpt-5.6-luna', analysisInput, analysisOutput),
            })
          }
          if (rows.length > 0) {
            await (adminSupabase as any).from('api_usage_log').insert(rows)
          }
        } catch (logErr) {
          console.warn('[processNextQuestion] api_usage_log insert skipped:', logErr)
        }

        // cited déterministe par échantillon (non utilisé dans la DB pour l'instant,
        // prévu pour la colonne brand_cited dans une future migration §DB-2)
        const _brandCitedPerSample = rawResults.map((r) => isBrandCited(r.citations, brandDomain))

        // Étape D : agrégation par vote majoritaire (voir aggregate.ts)
        const aggregated = aggregateSamples(
          analyses.map((a) => ({
            brand_mentioned: a.parsed.brand_mentioned,
            brand_recommended: a.parsed.brand_recommended,
            brand_position: a.parsed.brand_position,
          })),
        )

        // Étape E : insert/upsert concurrents inconnus, vus sur n'importe quel échantillon de ce moteur
        const allMentionedCompetitors = analyses.flatMap((a) => a.parsed.competitors).filter((c) => c.mentioned)
        for (const competitor of allMentionedCompetitors) {
          const { data: existing } = await adminSupabase
            .from('competitors')
            .select('id')
            .eq('brand_id', currentBrand.id)
            .ilike('name', competitor.name)
            .maybeSingle()

          if (!existing) {
            await adminSupabase.from('competitors').insert({
              brand_id: currentBrand.id,
              name: competitor.name,
              hidden: false,
              first_seen_at: new Date().toISOString(),
            })
          }
        }

        // Étape E-bis : thèmes fusionnés — union des échantillons de ce moteur,
        // dédupliqués par libellé (insensible à la casse).
        const themesSeen = new Map<string, string>()
        for (const a of analyses) {
          for (const theme of a.parsed.themes ?? []) {
            const key = theme.trim().toLowerCase()
            if (key && !themesSeen.has(key)) themesSeen.set(key, theme.trim())
          }
        }
        const mergedThemes = Array.from(themesSeen.values())

        // Étape F : insert observation agrégée — une par moteur
        const { data: obs, error: obsError } = await adminSupabase
          .from('observations')
          .insert({
            run_id: currentRun.id,
            question_id: question.id,
            engine,
            brand_mentioned: aggregated.brand_mentioned,
            brand_recommended: aggregated.brand_recommended,
            brand_position: aggregated.brand_position,
            raw_answer: rawResults[0]?.text ?? null, // 1er échantillon conservé pour affichage rapide ; le détail est dans observation_samples
            samples_count: aggregated.samples_count,
            agreement_score: aggregated.agreement_score,
            themes: mergedThemes,
          })
          .select()
          .single()

        if (obsError || !obs) throw new Error('Erreur insertion observation : ' + obsError?.message)

        // Étape G : insert des échantillons bruts (traçabilité / Evidence Chain)
        const { error: samplesError } = await adminSupabase.from('observation_samples').insert(
          rawResults.map((r, i) => ({
            observation_id: obs.id,
            sample_index: i + 1,
            engine,
            brand_mentioned: analyses[i].parsed.brand_mentioned,
            brand_recommended: analyses[i].parsed.brand_recommended,
            brand_position: analyses[i].parsed.brand_position,
            raw_answer: r.text,
          })),
        )
        if (samplesError) {
          console.error('[measure] Échec insertion observation_samples (non bloquant) :', samplesError)
        }

        // Étape H : insert observation_competitors (dédupliqués par concurrent, pour ce moteur)
        if (allMentionedCompetitors.length > 0) {
          const { data: competitorRows } = await adminSupabase
            .from('competitors')
            .select('id, name')
            .eq('brand_id', currentBrand.id)
            .in(
              'name',
              allMentionedCompetitors.map((c) => c.name),
            )

          const competitorByName = new Map((competitorRows ?? []).map((c) => [c.name.toLowerCase(), c.id]))

          // Un seul enregistrement observation_competitors par concurrent : on garde
          // l'échantillon le plus "favorable" à la détection (recommandé > mentionné,
          // meilleure position) pour ne pas dupliquer sur les échantillons.
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
                  [...competitorByName.keys()].find((k) => k.toLowerCase().includes(c.name.toLowerCase())) ?? '',
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

        return { engine, ok: true }
      } catch (err) {
        // Échec sur ce moteur pour cette question : logue mais continue —
        // l'autre moteur (s'il y en a un) n'est pas affecté, et une observation
        // vide est insérée pour ne pas reboucler indéfiniment dessus.
        console.error(`[measure] Échec question ${question.id} (moteur ${engine}) :`, err)

        await adminSupabase.from('observations').insert({
          run_id: currentRun.id,
          question_id: question.id,
          engine,
          brand_mentioned: false,
          brand_recommended: false,
          brand_position: null,
          raw_answer: null,
        })

        return { engine, ok: false }
      }
    }

    // Tous les moteurs manquants en parallèle — le temps de traitement d'une
    // question reste celui du moteur le plus lent, pas la somme des deux.
    const engineResults = await Promise.all(missingEngines.map((engine) => processEngine(engine)))
    const anyFailed = engineResults.some((r) => !r.ok)

    if (anyFailed) {
      await insertEvent(adminSupabase, {
        brand_id: brand.id,
        type: 'warning' as Database['public']['Tables']['events']['Row']['type'],
        title: 'Échec sur une question',
        message: `La question "${nextQuestion.text.slice(0, 80)}..." n'a pas pu être mesurée sur ${engineResults.filter((r) => !r.ok).map((r) => r.engine).join(', ')}. Réessayez plus tard.`,
        source_type: 'measurement_run',
        source_id: run.id,
        show_toast: false,
        show_notification: false,
        show_history: true,
        read: false,
      })
    }

    const newlyCompletedCount = completedQuestionsCount + 1 // cette question est désormais faite (succès ou échec géré) sur tous ses moteurs

    await adminSupabase
      .from('measurement_runs')
      .update({ questions_completed: newlyCompletedCount })
      .eq('id', run.id)

    return {
      done: false,
      run: {
        id: run.id,
        status: 'measuring' as RunStatus,
        questions_completed: newlyCompletedCount,
        questions_total: run.questions_total,
        score: null,
      },
    }
  })
