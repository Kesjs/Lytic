import { createFileRoute } from '@tanstack/react-router'
import { getSupabaseAdminClient } from '~/lib/supabase/server'
import { isFreePlan, isBrandEligibleForCron, MEASUREMENT_DELAY_DAYS } from '~/lib/plan'
import { triggerSiteCrawl, processNextPage } from '~/lib/crawler/orchestrate'
import { triggerMeasurementRun, processNextQuestion } from '~/lib/queries/measure'
import { getFreeRemeasureUnlock } from '~/lib/reliability'

// Route cron dédiée — plan "Automatisation Vérifier → Remesure" §4.1.
//
// Appelée par un déclencheur externe (Render Cron Job natif, crontab
// Hostinger, ou un service externe type cron-job.org / GitHub Actions
// `schedule:`) via POST + `Authorization: Bearer CRON_SECRET` — jamais par
// une session utilisateur : le cron n'est "personne" en particulier, il
// boucle sur TOUTES les marques actives (§4.1), contrairement aux server
// functions existantes qui n'opèrent que sur la marque de l'utilisateur
// connecté.
//
// Comportement par plan (§4.2) :
//  - Free : crawl automatique uniquement (détection de changement, pas
//    d'appel LLM) — jamais de remesure automatique.
//  - Pro (trial/active) : crawl automatique + remesure automatique si
//    MEASUREMENT_DELAY_DAYS est écoulé ET qu'un changement `importance !=
//    'low'` non encore lié à un run existe.
//  - past_due / canceled : exclues de tout traitement automatique.
//
// Le code ne dépend pas de l'hébergeur — seul le déclencheur externe change
// (§4.3). Cette route ne duplique pas la logique métier : elle réutilise
// triggerSiteCrawlForBrandId / runCrawlToCompletion et
// triggerMeasurementRunForBrandId / runMeasurementToCompletion, qui
// encapsulent exactement la même logique que les boutons manuels
// (HeaderMeasureButton, BotAccessCard), avec le client admin à la place
// d'une session utilisateur.

interface BrandCronResult {
  brandId: string
  crawl: 'ok' | 'skipped' | 'failed'
  remeasure: 'triggered' | 'skipped' | 'failed'
}

async function checkMeasurementDelay(
  adminSupabase: ReturnType<typeof getSupabaseAdminClient>,
  brandId: string,
): Promise<{ allowed: boolean; daysRemaining: number }> {
  const { data: lastRun } = await adminSupabase
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

export const Route = createFileRoute('/api/cron/site-check')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedSecret = process.env.CRON_SECRET
        if (!expectedSecret) {
          console.error('[cron/site-check] CRON_SECRET non défini côté serveur.')
          return Response.json({ error: 'CRON_SECRET non configuré' }, { status: 500 })
        }

        const authHeader = request.headers.get('authorization') ?? ''
        if (authHeader !== `Bearer ${expectedSecret}`) {
          return Response.json({ error: 'Non autorisé' }, { status: 401 })
        }

        const admin = getSupabaseAdminClient() as any

        // Toutes les marques actives — exclut past_due/canceled (§4.1).
        const { data: brands, error: brandsError } = await admin
          .from('brands')
          .select('id, name, website_url, plan')

        if (brandsError) {
          console.error('[cron/site-check] Erreur chargement des marques :', brandsError)
          return Response.json({ error: 'Erreur chargement des marques' }, { status: 500 })
        }

        const eligibleBrands = (brands ?? []).filter((b: any) => isBrandEligibleForCron(b.plan))
        const results: BrandCronResult[] = []

        for (const brand of eligibleBrands) {
          if (!brand.website_url) {
            results.push({ brandId: brand.id, crawl: 'skipped', remeasure: 'skipped' })
            continue
          }

          // ── Crawl automatique — tous plans confondus (§4.2) ─────────────
          let crawlStatus: BrandCronResult['crawl'] = 'skipped'
          try {
            const crawl = await triggerSiteCrawlForBrandId(brand.id)
            if (crawl) {
              await runCrawlToCompletion(crawl.runId)
              crawlStatus = 'ok'
            }
          } catch (err) {
            console.error(`[cron/site-check] Crawl échoué pour la marque ${brand.id} :`, err)
            crawlStatus = 'failed'
          }

          // ── Remesure automatique — Pro uniquement, conditions réunies ───
          let remeasureStatus: BrandCronResult['remeasure'] = 'skipped'
          if (!isFreePlan(brand.plan)) {
            try {
              const { allowed } = await checkMeasurementDelay(admin, brand.id)

              const { data: lastRun } = await admin
                .from('measurement_runs')
                .select('completed_at')
                .eq('brand_id', brand.id)
                .or('status.eq.success,status.eq.partial')
                .order('completed_at', { ascending: false })
                .limit(1)
                .maybeSingle()

              const unlock = await getFreeRemeasureUnlock(
                admin,
                brand.id,
                lastRun?.completed_at ?? null,
              )

              if (allowed && unlock.available) {
                const run = await triggerMeasurementRunForBrandId(brand.id)
                if (run) {
                  await runMeasurementToCompletion(run.runId)
                  remeasureStatus = 'triggered'
                }
              }
            } catch (err) {
              console.error(`[cron/site-check] Remesure échouée pour la marque ${brand.id} :`, err)
              remeasureStatus = 'failed'
            }
          }

          results.push({ brandId: brand.id, crawl: crawlStatus, remeasure: remeasureStatus })
        }

        return Response.json({ processed: results.length, results })
      },
    },
  },
})
