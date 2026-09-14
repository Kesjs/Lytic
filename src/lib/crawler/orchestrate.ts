import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient, getSupabaseAdminClient } from '~/lib/supabase/server'
import { discoverUrls } from './discover'
import { fetchPage } from './fetch'
import { sanitizeHtml } from './sanitize'
import { generateHashes } from './hash'
import { computeDiff } from './diff'
import { checkBotAccess } from './robots'
import type { IaBotId } from './constants'

// Délai par défaut entre deux fetches de pages si le robots.txt ne spécifie
// pas de Crawl-delay. 800 ms offre un compromis correct : on n'inonde pas
// les serveurs cibles tout en restant dans les timeouts Vercel (10s/page).
const DEFAULT_CRAWL_DELAY_MS = 800

// Bots IA dont le blocage génère automatiquement une opportunité haute priorité.
// On limite aux bots majeurs pour éviter le bruit (CCBot, Bytespider sont moins
// directement liés à la visibilité dans ChatGPT/Claude).
const MAJOR_BOTS: IaBotId[] = ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Google-Extended']

// ─── 1. Déclencher un crawl de site ──────────────────────────────────────────
export const triggerSiteCrawl = createServerFn({ method: 'POST' })
  .validator((data: { brandId: string }) => data)
  .handler(async ({ data }): Promise<{ runId: string }> => {
    const supabase = getSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) throw new Error('Non authentifié')

    const admin = getSupabaseAdminClient() as any

    // Vérifie accès
    const { data: brand } = await admin.from('brands').select('*').eq('id', data.brandId).eq('owner_id', auth.user.id).single()
    if (!brand) throw new Error('Marque introuvable')

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

      // Notifier si au moins un bot majeur est bloqué
      const blockedMajorBots = MAJOR_BOTS.filter((b) => botResult.bots[b] === 'blocked')
      if (blockedMajorBots.length > 0) {
        await admin.from('events').insert({
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
    } catch (botErr) {
      // Le diagnostic bots IA ne doit jamais faire échouer le crawl
      console.error('[orchestrate] Erreur diagnostic bots IA :', botErr)
    }

    return { runId: run.id }
  })

// ─── 2. Traiter la prochaine page (boucle client) ────────────────────────────
export const processNextPage = createServerFn({ method: 'POST' })
  .validator((data: { runId: string }) => data)
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
        await admin.from('site_pages').update({ status: 'unavailable', last_checked_at: new Date().toISOString() }).eq('id', page.id)
      } else {
        const $ = sanitizeHtml(fetchRes.html)
        const newHashes = generateHashes($)

        const oldHashes = {
          title_hash: page.title_hash,
          meta_hash: page.meta_hash,
          headings_hash: page.headings_hash,
          body_hash: page.body_hash,
          pricing_hash: page.pricing_hash,
          cta_hash: page.cta_hash,
          links_hash: page.links_hash,
          structure_hash: page.structure_hash,
        }

        const isBaseline = !page.title_hash && !page.body_hash && !page.structure_hash
        const diff = computeDiff(isBaseline ? null : oldHashes, newHashes)

        // Mettre à jour la page
        await admin.from('site_pages').update({
          ...newHashes,
          status: 'ok',
          last_checked_at: new Date().toISOString(),
        }).eq('id', page.id)

        // Enregistrer le changement
        if (diff.hasChanged) {
          await admin.from('site_changes').insert({
            brand_id: run.brand_id,
            page_id: page.id,
            crawl_run_id: run.id,
            change_type: isBaseline ? 'structure' : 'content',
            importance: isBaseline ? 'low' : 'watch',
            detection_method: 'hash_diff',
            changed_fields: diff.changedFields,
          })
        }
      }
    } catch (err) {
      // Erreur de fetch (timeout, etc)
      await admin.from('site_pages').update({ status: 'unavailable', last_checked_at: new Date().toISOString() }).eq('id', page.id)
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
