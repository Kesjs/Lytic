import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient, getSupabaseAdminClient } from '~/lib/supabase/server'
import { discoverUrls } from './discover'
import { fetchPage } from './fetch'
import { sanitizeHtml } from './sanitize'
import { extractContent } from './extract'
import { computeDiff } from './diff'
import { checkBotAccess } from './robots'
import type { IaBotId } from './constants'
import { isFreePlan, FREE_SITE_SCAN_COOLDOWN_DAYS } from '~/lib/plan'
import { insertEvent } from '~/lib/events'
import { computeAuditMetrics } from '~/lib/audit-metrics'

// Délai par défaut entre deux fetches de pages si le robots.txt ne spécifie
// pas de Crawl-delay. 800 ms offre un compromis correct : on n'inonde pas
// les serveurs cibles tout en restant dans les timeouts Vercel (10s/page).
const DEFAULT_CRAWL_DELAY_MS = 800

// Bots IA dont le blocage génère automatiquement une opportunité haute priorité.
// On limite aux bots majeurs pour éviter le bruit (CCBot, Bytespider sont moins
// directement liés à la visibilité dans ChatGPT/Claude).
const MAJOR_BOTS: IaBotId[] = ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Google-Extended']

/** Vérifie le cooldown entre deux scans manuels de site — Free uniquement
 *  (§5 refonte Free), même mécanique que checkMeasurementDelay dans
 *  measure.ts. Basé sur le dernier site_crawl_runs 'completed' de la marque. */
async function checkSiteScanCooldown(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  brandId: string,
): Promise<{ allowed: boolean; daysRemaining: number }> {
  const { data: lastCompleted } = await (admin as any)
    .from('site_crawl_runs')
    .select('completed_at')
    .eq('brand_id', brandId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!lastCompleted?.completed_at) return { allowed: true, daysRemaining: 0 }

  const elapsedDays =
    (Date.now() - new Date(lastCompleted.completed_at).getTime()) / (1000 * 60 * 60 * 24)
  const daysRemaining = Math.max(0, Math.ceil(FREE_SITE_SCAN_COOLDOWN_DAYS - elapsedDays))

  return { allowed: daysRemaining === 0, daysRemaining }
}

// ─── 1. Déclencher un crawl de site ──────────────────────────────────────────
export const triggerSiteCrawl = createServerFn({ method: 'POST' })
  .validator((data: { brandId: string; cronSecret?: string }) => data)
  .handler(async ({ data }): Promise<{ runId: string }> => {
    const supabaseClient = getSupabaseServerClient()
      const adminSupabase = getSupabaseAdminClient()
      const supabase = (data.cronSecret && data.cronSecret === process.env.CRON_SECRET) ? adminSupabase : supabaseClient
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) throw new Error('Non authentifié')

    const admin = getSupabaseAdminClient() as any

    // Vérifie accès
    const { data: brand } = await admin.from('brands').select('*').eq('id', data.brandId).eq('owner_id', auth.user.id).single()
    if (!brand) throw new Error('Marque introuvable')

    // Cooldown de scan manuel — Free uniquement (§5)
    if (isFreePlan(brand.plan)) {
      const { allowed, daysRemaining } = await checkSiteScanCooldown(admin, brand.id)
      if (!allowed) {
        throw new Error(
          `Prochaine vérification disponible dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}.`,
        )
      }
    }

    // Cherche un run existant bloqué
    const { data: existingRun } = await admin.from('site_crawl_runs')
      .select('id, updated_at')
      .eq('brand_id', brand.id)
      .in('status', ['pending', 'crawling'])
      .maybeSingle()
      
    if (existingRun) {
      const minsSinceUpdate = (Date.now() - new Date(existingRun.updated_at).getTime()) / 60000
      if (minsSinceUpdate > 15) {
        // Run zombie, on le marque failed
        await admin.from('site_crawl_runs').update({ status: 'failed' }).eq('id', existingRun.id)
      } else {
        return { runId: existingRun.id }
      }
    }

    // Découvrir les URLs + récupérer les règles robots.txt (1 seul fetch)
    const { urls, robotsRules } = await discoverUrls(brand.website_url || '')
    
    // Insérer les pages manquantes
    for (const url of urls) {
      const { data: existingPage } = await admin.from('site_pages').select('id').eq('brand_id', brand.id).eq('url', url).maybeSingle()
      if (!existingPage) {
        await admin.from('site_pages').insert({ brand_id: brand.id, url, status: 'unchecked' })
      }
    }

    // Compter le total (existantes + nouvelles)
    const { count: pagesTotal } = await admin.from('site_pages').select('id', { count: 'exact', head: true }).eq('brand_id', brand.id).neq('status', 'removed')

    // Délai à appliquer entre requêtes (robots.txt Crawl-delay ou défaut 800ms)
    const crawlDelayMs = robotsRules.crawlDelayMs ?? DEFAULT_CRAWL_DELAY_MS

    // Créer le run
    const { data: run, error } = await admin.from('site_crawl_runs').insert({
      brand_id: brand.id,
      status: 'pending',
      pages_total: pagesTotal || 0,
      pages_checked: 0,
      crawl_delay_ms: crawlDelayMs,
    }).select().single()

    if (error || !run) throw new Error('Impossible de créer le run')

    // ── Chantier B : Diagnostic bots IA ──────────────────────────────────────
    // Lancé en parallèle de la création du run, ne bloque pas si ça échoue.
    try {
      const botResult = await checkBotAccess(brand.website_url || '')

      // Upsert du résultat (1 ligne par marque, mise à jour à chaque run)
      await admin.from('brand_bot_access').upsert(
        {
          brand_id: brand.id,
          checked_at: botResult.checkedAt,
          llms_txt_found: botResult.llmsTxtFound,
          bot_rules: botResult.bots,
        },
        { onConflict: 'brand_id' },
      )

      // Générer une opportunité haute priorité pour chaque bot majeur bloqué
      for (const botId of MAJOR_BOTS) {
        if (botResult.bots[botId] === 'blocked') {
          const botLabel = botId === 'GPTBot' || botId === 'ChatGPT-User'
            ? 'ChatGPT'
            : botId === 'ClaudeBot'
            ? 'Claude (Anthropic)'
            : 'Google Gemini'

          // Vérifier si une opportunité similaire est déjà ouverte pour éviter les doublons
          const { data: existing } = await admin.from('opportunities')
            .select('id')
            .eq('brand_id', brand.id)
            .eq('status', 'open')
            .ilike('title', `%${botId}%`)
            .maybeSingle()

          if (!existing) {
            await admin.from('opportunities').insert({
              brand_id: brand.id,
              title: `${botLabel} bloqué dans votre robots.txt`,
              priority: 'high',
              confidence: 95,
              status: 'open',
              observations_count: 0,
              reason: `Le bot ${botId} est explicitement bloqué dans votre robots.txt (Disallow: /). ${botLabel} ne peut pas crawler votre site, ce qui réduit directement votre visibilité dans ses réponses générées.`,
              proposed_direction: `Modifiez votre robots.txt pour autoriser ${botId} : ajoutez un bloc "User-agent: ${botId}" suivi de "Allow: /" ou supprimez la règle Disallow qui le bloque.`,
            })
          }
        }
      }

      // Générer une opportunité moyenne priorité si le fichier llms.txt est manquant (#5)
      if (!botResult.llmsTxtFound) {
        const { data: existingLlms } = await admin.from('opportunities')
          .select('id')
          .eq('brand_id', brand.id)
          .eq('status', 'open')
          .ilike('title', '%llms.txt%')
          .maybeSingle()

        if (!existingLlms) {
          await admin.from('opportunities').insert({
            brand_id: brand.id,
            title: `Fichier llms.txt manquant`,
            priority: 'medium',
            confidence: 90,
            status: 'open',
            observations_count: 0,
            reason: `Votre site ne propose pas de fichier /llms.txt à sa racine. Ce standard émergent est utilisé par les IA pour comprendre la structure de votre site et extraire le contenu pertinent plus efficacement lors de leurs recherches.`,
            proposed_direction: `Créez un fichier llms.txt à la racine de votre site (ex: /llms.txt) contenant un résumé Markdown de vos contenus principaux et des liens vers votre documentation clé, selon le standard llmstxt.org.`,
          })
        }
      }

      // Notifier si au moins un bot majeur est bloqué
      const blockedMajorBots = MAJOR_BOTS.filter((b) => botResult.bots[b] === 'blocked')
      if (blockedMajorBots.length > 0) {
        await insertEvent(admin, {
          brand_id: brand.id,
          type: 'warning',
          title: 'Bots IA bloqués détectés',
          message: `${blockedMajorBots.length} bot(s) IA majeur(s) bloqué(s) dans votre robots.txt : ${blockedMajorBots.join(', ')}.`,
          source_type: 'bot_access',
          show_toast: false,
          show_notification: true,
          show_history: true,
          read: false,
        })
      }

      // Notifier si llms.txt est manquant
      if (!botResult.llmsTxtFound) {
        await insertEvent(admin, {
          brand_id: brand.id,
          type: 'info',
          title: 'Fichier llms.txt manquant',
          message: 'Votre site ne propose pas de fichier /llms.txt. Ce standard émergent aide les IA à mieux comprendre la structure de votre site.',
          source_type: 'bot_access',
          show_toast: false,
          show_notification: true,
          show_history: true,
          read: false,
        })
      }
    } catch (botErr) {
      // Le diagnostic bots IA ne doit jamais faire échouer le crawl
      console.error('[orchestrate] Erreur diagnostic bots IA :', botErr)
    }

    return { runId: run.id }
  })

// ─── 2. Traiter la prochaine page (boucle client) ────────────────────────────
export const processNextPage = createServerFn({ method: 'POST' })
  .validator((data: { runId: string; cronSecret?: string }) => data)
  .handler(async ({ data }): Promise<{ done: boolean, runId: string }> => {
    const admin = getSupabaseAdminClient() as any

    const { data: run } = await admin.from('site_crawl_runs').select('*').eq('id', data.runId).single()
    if (!run) throw new Error('Run introuvable')

    if (run.status === 'completed' || run.status === 'failed') {
      return { done: true, runId: run.id }
    }

    if (run.status === 'pending') {
      await admin.from('site_crawl_runs').update({ status: 'crawling' }).eq('id', run.id)
    }

    // Trouver une page non vérifiée depuis le début du run
    const { data: page } = await admin.from('site_pages')
      .select('*')
      .eq('brand_id', run.brand_id)
      .neq('status', 'removed')
      .or(`last_checked_at.is.null,last_checked_at.lt.${run.started_at}`)
      .limit(1)
      .maybeSingle()

    if (!page) {
      // Clôture transactionnelle via fonction SQL
      await admin.rpc('close_crawl_run', { p_run_id: run.id, p_brand_id: run.brand_id })

      // Instantané du score Audit Technique IA sur ce run (§27) — on
      // réutilise la même logique que la carte UI (computeAuditMetrics),
      // mais avec l'état frais juste après ce crawl plutôt qu'un
      // recalcul à la volée jamais stocké. Best-effort : une erreur ici
      // ne doit pas faire échouer la clôture du run déjà actée ci-dessus.
      try {
        const [{ data: botAccessRow }, { data: pagesForScore }] = await Promise.all([
          admin.from('brand_bot_access').select('*').eq('brand_id', run.brand_id).maybeSingle(),
          admin.from('site_pages').select('*').eq('brand_id', run.brand_id).neq('status', 'removed'),
        ])

        const botAccessData = botAccessRow
          ? {
              checkedAt: botAccessRow.checked_at,
              llmsTxtFound: botAccessRow.llms_txt_found,
              bots: botAccessRow.bot_rules,
            }
          : null

        const metrics = computeAuditMetrics(botAccessData, pagesForScore ?? [])
        if (metrics) {
          await admin.from('site_crawl_runs').update({ audit_score: metrics.score }).eq('id', run.id)
        }
      } catch (err) {
        console.error(`[crawler] Échec calcul audit_score pour le run ${run.id} :`, err)
      }

      return { done: true, runId: run.id }
    }

    // ── Délai de politeness ───────────────────────────────────────────────────
    // On attend avant le fetch (sauf pour le tout premier appel où pages_checked
    // vaut 0 — inutile d'attendre avant la première requête du run).
    const delayMs = run.crawl_delay_ms ?? DEFAULT_CRAWL_DELAY_MS
    if ((run.pages_checked ?? 0) > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }

    try {
      const fetchRes = await fetchPage(page.url)

      if (fetchRes.status >= 400) {
        // Garde-fou #13 : ne classer 'removed' qu'après plusieurs échecs consécutifs
        // pour éviter les fausses alertes sur des pannes passagères (503, rate-limit, timeout)
        const consecutiveFailures = (page.consecutive_failures || 0) + 1
        const MAX_CONSECUTIVE_FAILURES = 3 // 3 échecs consécutifs avant de considérer la page supprimée

        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && page.status !== 'removed') {
          // Page considérée comme supprimée/déplacée après échecs répétés
          await admin.from('site_pages').update({
            status: 'removed',
            consecutive_failures: consecutiveFailures,
            last_checked_at: new Date().toISOString()
          }).eq('id', page.id)

          // Générer une opportunité haute priorité (#13)
          const { data: existingRemoved } = await admin.from('opportunities')
            .select('id')
            .eq('brand_id', run.brand_id)
            .eq('status', 'open')
            .ilike('title', `%${page.url}%`)
            .ilike('title', '%supprimée%')
            .maybeSingle()

          if (!existingRemoved) {
            await admin.from('opportunities').insert({
              brand_id: run.brand_id,
              title: `Page supprimée ou déplacée : ${page.url}`,
              priority: 'high',
              confidence: 85,
              status: 'open',
              observations_count: 0,
              reason: `La page ${page.url} n'a pas pu être atteinte après ${consecutiveFailures} tentatives consécutives (codes HTTP 4xx/5xx). Elle a probablement été supprimée, déplacée ou renommée.`,
              proposed_direction: `Vérifiez si cette page existe toujours. Si elle a été déplacée, mettez à jour les liens internes. Si elle a été supprimée, créez une redirection 301 vers la nouvelle page équivalente.`,
            })

            // Notifier la page supprimée
            await insertEvent(admin, {
              brand_id: run.brand_id,
              type: 'warning',
              title: 'Page supprimée détectée',
              message: `La page ${page.url} n'a pas pu être atteinte après ${consecutiveFailures} tentatives consécutives.`,
              source_type: 'site_change',
              source_id: page.id,
              show_toast: false,
              show_notification: true,
              show_history: true,
              read: false,
            })
          }
        } else {
          // Échec temporaire, incrémenter le compteur mais rester en 'unavailable'
          await admin.from('site_pages').update({
            status: 'unavailable',
            consecutive_failures: consecutiveFailures,
            last_checked_at: new Date().toISOString()
          }).eq('id', page.id)
        }
      } else {
        const $ = sanitizeHtml(fetchRes.html)
        const newContent = extractContent($)

        // Rendu SPA échoué (cf. #26) : le HTML analysé est la coquille vide
        // d'origine, pas le vrai contenu — on le marque dans le JSON stocké
        // (pas de migration nécessaire) pour que l'Audit Technique IA
        // affiche "non vérifiable" plutôt qu'un faux "Aucun H1 détecté" sur
        // une page qui a en réalité un contenu réel jamais rendu.
        if (fetchRes.spaRenderFailed) {
          ;(newContent as any).renderIncomplete = true
        }

        const oldContent = page.extracted_content as any || null

        // On considère isBaseline si on n'a jamais extrait de titre ni de body (ou pas d'ancien contenu JSON)
        const isBaseline = !oldContent || (!oldContent.title && !oldContent.body && !oldContent.structure)
        const diff = computeDiff(isBaseline ? null : oldContent, newContent)

        // Mettre à jour la page
        await admin.from('site_pages').update({
          extracted_content: newContent as any,
          is_spa: fetchRes.isSPA,
          status: 'ok',
          consecutive_failures: 0, // Reset le compteur d'échecs consécutifs
          last_checked_at: new Date().toISOString(),
        }).eq('id', page.id)

        // Un seul event par page tant que le rendu échoue, pour ne pas
        // spammer l'historique à chaque run (même logique que #24).
        if (fetchRes.spaRenderFailed && !(oldContent as any)?.renderIncomplete) {
          await insertEvent(admin, {
            brand_id: run.brand_id,
            type: 'warning',
            title: 'Rendu de page incomplet',
            message: `${page.url} est une application JavaScript (SPA) dont le rendu headless a échoué — le contenu analysé peut être incomplet. Reflet réessaiera au prochain crawl.`,
            source_type: 'site_change',
            source_id: page.id,
            show_toast: false,
            show_notification: true,
            show_history: true,
            read: false,
          })
        }

        // Enregistrer le changement — importance pondérée par champ (§3.A) :
        // 'watch' seulement si un champ pertinent (title/pricing/meta) a
        // changé, ou si le delta d'un champ conditionnel (body/headings)
        // dépasse le seuil de similarité. Le bruit pur (links/cta/structure)
        // reste en 'low', visible en historique mais sans déclencher quoi
        // que ce soit derrière (remesure Pro, notification).
        const importance = isBaseline ? 'low' : diff.importance
        if (diff.hasChanged) {
          await admin.from('site_changes').insert({
            brand_id: run.brand_id,
            page_id: page.id,
            crawl_run_id: run.id,
            change_type: isBaseline ? 'structure' : 'content',
            importance,
            detection_method: 'semantic_diff',
            changed_fields: diff.changedFields,
            old_content: isBaseline ? null : oldContent,
            new_content: newContent as any,
          })

          // Notifier uniquement les changements significatifs (§3.C) — pas
          // la baseline du premier crawl, pas le bruit sous le seuil.
          if (importance === 'watch') {
            await insertEvent(admin, {
              brand_id: run.brand_id,
              type: 'info',
              title: 'Changement détecté sur votre site',
              message: `Un changement significatif a été détecté sur ${page.url} (champs concernés : ${diff.changedFields.join(', ')}).`,
              source_type: 'site_change',
              source_id: page.id,
              show_toast: false,
              show_notification: true,
              show_history: true,
              read: false,
            })
          }
        }
      }
    } catch (err) {
      // Erreur réseau (timeout, DNS, TLS, blocage SSRF...) — avant ce fix,
      // l'erreur était capturée puis jetée sans jamais être loggée ni
      // stockée : impossible de diagnostiquer pourquoi une page échouait.
      // On applique aussi le même garde-fou "3 échecs consécutifs" que la
      // branche HTTP 4xx/5xx ci-dessus, pour ne pas paniquer sur un simple
      // aléa réseau ponctuel (cf. #24).
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error(`[crawler] Échec réseau pour ${page.url}:`, errorMessage)

      const consecutiveFailures = (page.consecutive_failures || 0) + 1

      await admin.from('site_pages').update({
        status: 'unavailable',
        consecutive_failures: consecutiveFailures,
        last_checked_at: new Date().toISOString(),
      }).eq('id', page.id)

      // Un seul événement par série d'échecs (pas un à chaque run tant que
      // le site reste injoignable) — pour ne pas spammer l'historique.
      if (consecutiveFailures === 1) {
        await insertEvent(admin, {
          brand_id: run.brand_id,
          type: 'warning',
          title: 'Page injoignable lors du crawl',
          message: `${page.url} n'a pas pu être chargée (${errorMessage}). Reflet réessaiera au prochain crawl.`,
          source_type: 'site_change',
          source_id: page.id,
          show_toast: false,
          show_notification: true,
          show_history: true,
          read: false,
        })
      }
    }

    // Heartbeat: maj updated_at et pages_checked
    await admin.from('site_crawl_runs')
      .update({ 
        updated_at: new Date().toISOString(),
        pages_checked: (run.pages_checked || 0) + 1 
      })
      .eq('id', run.id)

    return { done: false, runId: run.id }
  })
