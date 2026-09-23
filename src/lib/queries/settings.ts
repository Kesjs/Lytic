// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'
import { isValidWebsiteUrl, QUESTION_MAX_LENGTH, MAX_TRACKED_QUESTIONS } from '~/lib/utils'
import { FREE_MAX_QUESTIONS, isFreePlan } from '~/lib/plan'

// Toutes les lectures/écritures ci-dessous respectent le RLS par owner_id —
// aucun accès admin. Rien n'est inventé : les sections sans backend réel
// (facturation) affichent l'état brut de la colonne `plan`, pas un faux
// bouton d'action.

export interface SettingsProfile {
  id: string
  email: string
  fullName: string | null
}

export interface SettingsBrand {
  id: string
  name: string
  websiteUrl: string | null
  plan: 'trial' | 'active' | 'past_due' | 'canceled' | 'free'
  createdAt: string
  lastCrawlCompletedAt: string | null
}

export interface SettingsQuestion {
  id: string
  text: string
  active: boolean
  position: number
}

export interface SettingsNotifications {
  emailEnabled: boolean
  notifyMeasurementRun: boolean
  notifySiteChange: boolean
  notifyOpportunity: boolean
  notifyBilling: boolean
}

export interface SettingsData {
  profile: SettingsProfile
  brand: SettingsBrand | null
  questions: SettingsQuestion[]
  notifications: SettingsNotifications | null
}

async function requireUser(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Non authentifié')
  return auth.user
}

// Vérifie que la marque appartient bien à l'utilisateur courant avant toute
// écriture — jamais de confiance dans un id transmis par le client seul.
async function requireOwnedBrand(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  brandId: string,
) {
  const { data: brand } = await supabase
    .from('brands')
    .select('id, plan')
    .eq('id', brandId)
    .eq('owner_id', userId)
    .maybeSingle()
  if (!brand) throw new Error('Marque introuvable')
  return brand
}

export const fetchSettings = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SettingsData | null> => {
    const supabase = getSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return null

    const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle()
    const { data: brandRow } = await supabase.from('brands').select('*').eq('owner_id', auth.user.id).maybeSingle()

    const profile: SettingsProfile = {
      id: auth.user.id,
      email: profileRow?.email ?? auth.user.email ?? '',
      fullName: profileRow?.full_name ?? null,
    }

    if (!brandRow) {
      return { profile, brand: null, questions: [], notifications: null }
    }

    const { data: questionRows } = await supabase
      .from('questions')
      .select('*')
      .eq('brand_id', brandRow.id)
      .order('position', { ascending: true })
      
    const { data: notifRow } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('brand_id', brandRow.id)
      .maybeSingle()

    // Dernier scan de site complété — sert au cooldown Free affiché dans
    // CrawlSection (§5), même donnée que celle vérifiée côté serveur dans
    // triggerSiteCrawl.
    const { data: lastCrawl } = await supabase
      .from('site_crawl_runs')
      .select('completed_at')
      .eq('brand_id', brandRow.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return {
      profile,
      brand: {
        id: brandRow.id,
        name: brandRow.name,
        websiteUrl: brandRow.website_url,
        plan: brandRow.plan as SettingsBrand['plan'],
        createdAt: brandRow.created_at,
        lastCrawlCompletedAt: lastCrawl?.completed_at ?? null,
      },
      questions: (questionRows ?? []).map((q) => ({
        id: q.id,
        text: q.text,
        active: q.active,
        position: q.position,
      })),
      notifications: notifRow
        ? {
            emailEnabled: notifRow.email_enabled,
            notifyMeasurementRun: notifRow.notify_measurement_run,
            notifySiteChange: notifRow.notify_site_change,
            notifyOpportunity: notifRow.notify_opportunity,
            notifyBilling: notifRow.notify_billing,
          }
        : null,
    }
  },
)

// --- Compte ---

export const updateProfileName = createServerFn({ method: 'POST' })
  .validator((fullName: string) => fullName)
  .handler(async ({ data: fullName }) => {
    const supabase = getSupabaseServerClient()
    const user = await requireUser(supabase)
    // upsert plutôt que update : si la ligne profiles n'existe pas encore
    // (compte créé avant le trigger handle_new_user, ou trigger en échec),
    // un simple update() touche 0 ligne sans erreur et le changement se
    // perd silencieusement. upsert() garantit que la ligne est créée si besoin.
    const { error } = await supabase
      .from('profiles')
      .upsert(
        { id: user.id, email: user.email ?? '', full_name: fullName.trim() || null },
        { onConflict: 'id' },
      )
    if (error) throw new Error(error.message)
    return { success: true } as const
  })

export const updateEmail = createServerFn({ method: 'POST' })
  .validator((newEmail: string) => newEmail)
  .handler(async ({ data: newEmail }) => {
    const supabase = getSupabaseServerClient()
    await requireUser(supabase)
    
    const email = newEmail.trim()
    if (!email || !email.includes('@')) {
      throw new Error('Adresse e-mail invalide.')
    }
    
    // Supabase va envoyer un e-mail de confirmation à la nouvelle adresse
    // (et optionnellement à l'ancienne selon les réglages du projet).
    const { error } = await supabase.auth.updateUser({ email })
    if (error) throw new Error(error.message)
    return { success: true } as const
  })

// --- Sécurité ---

export const updatePassword = createServerFn({ method: 'POST' })
  .validator((newPassword: string) => newPassword)
  .handler(async ({ data: newPassword }) => {
    if (newPassword.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères.')
    }
    const supabase = getSupabaseServerClient()
    await requireUser(supabase)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
    return { success: true } as const
  })

// --- Site ---

export const updateBrandSite = createServerFn({ method: 'POST' })
  .validator((data: { brandId: string; name: string; websiteUrl: string }) => data)
  .handler(async ({ data }): Promise<any> => {
    const supabase = getSupabaseServerClient()
    const user = await requireUser(supabase)
    await requireOwnedBrand(supabase, user.id, data.brandId)

    const trimmedName = data.name.trim()
    if (!trimmedName) throw new Error('Le nom de la marque est requis.')

    const trimmedUrl = data.websiteUrl.trim()
    if (trimmedUrl && !isValidWebsiteUrl(trimmedUrl)) {
      throw new Error('URL invalide — utilisez un format du type https://votre-site.fr')
    }

    const { error } = await supabase
      .from('brands')
      .update({ name: trimmedName, website_url: trimmedUrl || null })
      .eq('id', data.brandId)
    if (error) throw new Error(error.message)
    return { success: true } as const
  })

// --- Création de marque (première connexion) ---
// Un seul point d'entrée pour sortir de l'état "compte sans marque" :
// crée la marque, ses questions de départ et une ligne de préférences de
// notification par défaut. Ne déclenche PAS de mesure — ça reste le rôle
// du moteur de mesure (hors périmètre actuel, cf. reste-a-faire.md).
export const createBrandWithQuestions = createServerFn({ method: 'POST' })
  .validator((data: { name: string; websiteUrl: string; questions: string[] }) => data)
  .handler(async ({ data }): Promise<any> => {
    const supabase = getSupabaseServerClient()
    const user = await requireUser(supabase)

    const { data: existing } = await supabase
      .from('brands')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()
    if (existing) throw new Error('Une marque est déjà configurée pour ce compte.')

    const name = data.name.trim()
    if (!name) throw new Error('Le nom de la marque est requis.')

    const websiteUrl = data.websiteUrl.trim()
    if (!websiteUrl) throw new Error('Le site web est requis.')
    if (!isValidWebsiteUrl(websiteUrl)) {
      throw new Error('URL invalide — utilisez un format du type https://votre-site.fr')
    }

    const questions = data.questions.map((q) => q.trim()).filter(Boolean)
    if (questions.length === 0) {
      throw new Error('Ajoutez au moins une question à suivre.')
    }
    // Toute nouvelle marque démarre en plan Free (pas de facturation à la
    // création — le passage en Pro se fait ailleurs, une fois Stripe branché).
    // La limite Free (1 question) s'applique donc systématiquement ici, pas
    // la limite générale MAX_TRACKED_QUESTIONS réservée aux comptes déjà Pro.
    if (questions.length > FREE_MAX_QUESTIONS) {
      throw new Error(
        `Le plan Free est limité à ${FREE_MAX_QUESTIONS} question suivie — passez au plan Pro pour en suivre jusqu'à ${MAX_TRACKED_QUESTIONS}.`,
      )
    }
    if (questions.some((q) => q.length > QUESTION_MAX_LENGTH)) {
      throw new Error(`Une question dépasse la limite de ${QUESTION_MAX_LENGTH} caractères.`)
    }

    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert({ owner_id: user.id, name, website_url: websiteUrl, plan: 'free' })
      .select('id')
      .single()
    if (brandError) throw new Error(brandError.message)

    const { error: questionsError } = await supabase.from('questions').insert(
      questions.map((text, i) => ({ brand_id: brand.id, text, position: i })),
    )
    if (questionsError) throw new Error(questionsError.message)

    const { error: notifError } = await supabase
      .from('notification_preferences')
      .insert({ brand_id: brand.id })
    if (notifError) throw new Error(notifError.message)

    return { success: true, brandId: brand.id } as const
  })

// ─── Création de marque en 2 temps (souscription Pro directe depuis les tarifs) ──
//
// createCheckoutSession (billing.ts) exige un brandId existant (FedaPay +
// webhook en dépendent) : impossible de payer avant qu'une marque existe.
// createBrandDraft crée donc la marque seule (plan 'free', 0 question),
// le paiement est déclenché juste après avec ce brandId, puis
// addInitialQuestions ajoute les questions une fois le plan confirmé —
// voir BrandSetupDrawer.tsx pour l'orchestration complète du flux.

export const createBrandDraft = createServerFn({ method: 'POST' })
  .validator((data: { name: string; websiteUrl: string }) => data)
  .handler(async ({ data }): Promise<{ brandId: string }> => {
    const supabase = getSupabaseServerClient()
    const user = await requireUser(supabase)

    const { data: existing } = await supabase
      .from('brands')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()
    if (existing) throw new Error('Une marque est déjà configurée pour ce compte.')

    const name = data.name.trim()
    if (!name) throw new Error('Le nom de la marque est requis.')

    const websiteUrl = data.websiteUrl.trim()
    if (!websiteUrl) throw new Error('Le site web est requis.')
    if (!isValidWebsiteUrl(websiteUrl)) {
      throw new Error('URL invalide — utilisez un format du type https://votre-site.fr')
    }

    // Toute nouvelle marque démarre en Free, y compris ici : le paiement
    // n'est confirmé que côté webhook, jamais côté client (cf. billing.ts).
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert({ owner_id: user.id, name, website_url: websiteUrl, plan: 'free' })
      .select('id')
      .single()
    if (brandError) throw new Error(brandError.message)

    const { error: notifError } = await supabase
      .from('notification_preferences')
      .insert({ brand_id: brand.id })
    if (notifError) throw new Error(notifError.message)

    return { brandId: brand.id }
  })

// Lecture minimale pour le polling post-paiement côté client (UpgradeButton
// se contentait d'un reload après un délai fixe — ici on veut la vraie
// valeur en base avant de débloquer l'étape questions, le webhook FedaPay
// étant asynchrone et pouvant arriver après le callback client).
export const getBrandPlan = createServerFn({ method: 'GET' })
  .validator((data: { brandId: string }) => data)
  .handler(async ({ data }): Promise<{ plan: string }> => {
    const supabase = getSupabaseServerClient()
    const user = await requireUser(supabase)
    const brand = await requireOwnedBrand(supabase, user.id, data.brandId)
    return { plan: brand.plan as string }
  })

export const addInitialQuestions = createServerFn({ method: 'POST' })
  .validator((data: { brandId: string; questions: string[] }) => data)
  .handler(async ({ data }): Promise<{ success: true }> => {
    const supabase = getSupabaseServerClient()
    const user = await requireUser(supabase)
    const brand = await requireOwnedBrand(supabase, user.id, data.brandId)

    const { count: existingCount } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
    if ((existingCount ?? 0) > 0) {
      throw new Error('Des questions sont déjà configurées pour cette marque.')
    }

    const questions = data.questions.map((q) => q.trim()).filter(Boolean)
    if (questions.length === 0) {
      throw new Error('Ajoutez au moins une question à suivre.')
    }

    // Le cap dépend du plan RÉEL de la marque en base à cet instant précis —
    // jamais de ce que le client croit savoir (état de confirmation du
    // paiement affiché côté UI). Une marque encore 'free' au moment de
    // l'insert reste plafonnée à FREE_MAX_QUESTIONS même si le paiement a
    // été initié : le webhook n'a peut-être pas encore confirmé.
    const cap = isFreePlan(brand.plan) ? FREE_MAX_QUESTIONS : MAX_TRACKED_QUESTIONS
    if (questions.length > cap) {
      throw new Error(`Ce plan est limité à ${cap} question${cap > 1 ? 's' : ''} suivie${cap > 1 ? 's' : ''}.`)
    }
    if (questions.some((q) => q.length > QUESTION_MAX_LENGTH)) {
      throw new Error(`Une question dépasse la limite de ${QUESTION_MAX_LENGTH} caractères.`)
    }

    const { error: questionsError } = await supabase.from('questions').insert(
      questions.map((text, i) => ({ brand_id: brand.id, text, position: i })),
    )
    if (questionsError) throw new Error(questionsError.message)

    return { success: true }
  })

// --- Réinitialisation (recommencer l'onboarding) ---

// Aucune UI ne permettait jusqu'ici de revenir en arrière une fois une
// marque créée : createBrandWithQuestions refuse toute nouvelle marque tant
// que owner_id en a déjà une (cf. plus haut), et il n'existait aucun moyen
// de supprimer la marque existante — y compris quand la toute première
// mesure automatique de l'onboarding échoue et laisse le compte dans un
// état à moitié configuré, sans issue possible pour l'utilisateur.
// On ne suppose pas de ON DELETE CASCADE en base (cf. deleteQuestion
// ci-dessus) : on supprime explicitement chaque table dépendante, de la
// plus profonde à la plus haute, pour que ça marche même sans cascade.
export const deleteBrand = createServerFn({ method: 'POST' })
  .validator((data: { brandId: string }) => data)
  .handler(async ({ data }): Promise<any> => {
    const supabase = getSupabaseServerClient()
    const user = await requireUser(supabase)
    await requireOwnedBrand(supabase, user.id, data.brandId)

    // Garde-fou anti-abus (refonte Free §pricing) : la suppression ne sert
    // qu'à se sortir d'un onboarding planté avant la première mesure. Une
    // fois une mesure réussie, un plan Free pourrait sinon supprimer/
    // recréer sa marque à l'infini pour contourner FREE_MAX_MEASUREMENTS.
    // Au-delà, il faut passer par le support.
    const { count: successCount, error: successCheckError } = await supabase
      .from('measurement_runs')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', data.brandId)
      .eq('status', 'success')
    if (successCheckError) throw new Error(successCheckError.message)
    if ((successCount ?? 0) > 0) {
      throw new Error(
        'Cette marque a déjà une mesure réussie : la suppression automatique n\'est plus disponible. Contacte le support pour recommencer.',
      )
    }

    async function del(table: string, column: string, values: readonly string[]) {
      if (values.length === 0) return
      const { error } = await supabase.from(table).delete().in(column, values as string[])
      if (error) throw new Error(error.message)
    }
    async function delByBrand(table: string) {
      const { error } = await supabase.from(table).delete().eq('brand_id', data.brandId)
      if (error) throw new Error(error.message)
    }

    const ids = async (table: string, column = 'id') => {
      const { data: rows, error } = await supabase.from(table).select(column).eq('brand_id', data.brandId)
      if (error) throw new Error(error.message)
      return (rows ?? []).map((r: any) => r[column] as string)
    }

    const runIds = await ids('measurement_runs')
    const questionIds = await ids('questions')
    const opportunityIds = await ids('opportunities')
    const competitorIds = await ids('competitors')

    const { data: obsRows, error: obsSelectError } = await supabase
      .from('observations')
      .select('id')
      .in('run_id', runIds.length ? runIds : ['00000000-0000-0000-0000-000000000000'])
    if (obsSelectError) throw new Error(obsSelectError.message)
    const observationIds = (obsRows ?? []).map((r) => r.id as string)

    await del('observation_samples', 'observation_id', observationIds)
    await del('observation_competitors', 'observation_id', observationIds)
    await del('observation_competitors', 'competitor_id', competitorIds)
    await del('observations', 'run_id', runIds)
    await del('opportunity_evidence', 'opportunity_id', opportunityIds)
    await del('opportunity_questions', 'opportunity_id', opportunityIds)
    await del('opportunity_questions', 'question_id', questionIds)
    await delByBrand('opportunities')
    await delByBrand('site_changes')
    await delByBrand('site_pages')
    await delByBrand('site_crawl_runs')
    await delByBrand('questions')
    await delByBrand('measurement_runs')
    await delByBrand('competitors')
    await delByBrand('api_usage_log')
    await delByBrand('events')
    await delByBrand('notification_preferences')
    await delByBrand('brand_bot_access')

    const { error: brandError } = await supabase.from('brands').delete().eq('id', data.brandId)
    if (brandError) throw new Error(brandError.message)

    return { success: true } as const
  })

// --- Questions ---
// Gestion manuelle (ajout / édition / désactivation) — pas de génération
// automatique dans le MVP (§48 du master : hors périmètre actuel).

export const addQuestion = createServerFn({ method: 'POST' })
  .validator((data: { brandId: string; text: string }) => data)
  .handler(async ({ data }): Promise<any> => {
    const supabase = getSupabaseServerClient()
    const user = await requireUser(supabase)
    const brand = await requireOwnedBrand(supabase, user.id, data.brandId)

    const text = data.text.trim()
    if (!text) throw new Error('La question ne peut pas être vide.')
    if (text.length > QUESTION_MAX_LENGTH) {
      throw new Error(`La question dépasse la limite de ${QUESTION_MAX_LENGTH} caractères.`)
    }

    const { count } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', data.brandId)

    // Pas dans le texte littéral de la spec (qui ne couvre que la création de
    // marque), mais nécessaire pour que la limite Free tienne : sans ce garde,
    // un compte Free pourrait ajouter des questions après coup et dépasser
    // FREE_MAX_QUESTIONS.
    const maxQuestions = isFreePlan(brand.plan) ? FREE_MAX_QUESTIONS : MAX_TRACKED_QUESTIONS
    if ((count ?? 0) >= maxQuestions) {
      throw new Error(
        isFreePlan(brand.plan)
          ? `Le plan Free est limité à ${FREE_MAX_QUESTIONS} question suivie — passez au plan Pro pour en suivre davantage.`
          : `Limite de ${MAX_TRACKED_QUESTIONS} questions suivies atteinte pour ce plan.`,
      )
    }

    const { error } = await supabase
      .from('questions')
      .insert({ brand_id: data.brandId, text, position: count ?? 0 })
    if (error) throw new Error(error.message)
    return { success: true } as const
  })

export const updateQuestionText = createServerFn({ method: 'POST' })
  .validator((data: { questionId: string; text: string }) => data)
  .handler(async ({ data }): Promise<any> => {
    const supabase = getSupabaseServerClient()
    const user = await requireUser(supabase)

    const { data: question } = await supabase
      .from('questions')
      .select('id, brand_id')
      .eq('id', data.questionId)
      .maybeSingle()
    if (!question) throw new Error('Question introuvable')
    await requireOwnedBrand(supabase, user.id, question.brand_id)

    const text = data.text.trim()
    if (!text) throw new Error('La question ne peut pas être vide.')
    if (text.length > QUESTION_MAX_LENGTH) {
      throw new Error(`La question dépasse la limite de ${QUESTION_MAX_LENGTH} caractères.`)
    }

    const { error } = await supabase.from('questions').update({ text }).eq('id', data.questionId)
    if (error) throw new Error(error.message)
    return { success: true } as const
  })

export const toggleQuestionActive = createServerFn({ method: 'POST' })
  .validator((data: { questionId: string; active: boolean }) => data)
  .handler(async ({ data }): Promise<any> => {
    const supabase = getSupabaseServerClient()
    const user = await requireUser(supabase)

    const { data: question } = await supabase
      .from('questions')
      .select('id, brand_id')
      .eq('id', data.questionId)
      .maybeSingle()
    if (!question) throw new Error('Question introuvable')
    await requireOwnedBrand(supabase, user.id, question.brand_id)

    const { error } = await supabase
      .from('questions')
      .update({ active: data.active })
      .eq('id', data.questionId)
    if (error) throw new Error(error.message)
    return { success: true } as const
  })

export const deleteQuestion = createServerFn({ method: 'POST' })
  .validator((data: { questionId: string }) => data)
  .handler(async ({ data }): Promise<any> => {
    const supabase = getSupabaseServerClient()
    const user = await requireUser(supabase)

    const { data: question } = await supabase
      .from('questions')
      .select('id, brand_id')
      .eq('id', data.questionId)
      .maybeSingle()
    if (!question) throw new Error('Question introuvable')
    await requireOwnedBrand(supabase, user.id, question.brand_id)

    // Ne pas supposer un ON DELETE CASCADE en base : on supprime explicitement
    // les lignes dépendantes avant la question, pour que la suppression marche
    // même si la contrainte FK n'a pas de cascade (elle échouait silencieusement
    // pour toute question déjà mesurée).
    const { error: oppQError } = await supabase
      .from('opportunity_questions')
      .delete()
      .eq('question_id', data.questionId)
    if (oppQError) throw new Error(oppQError.message)

    const { error: obsError } = await supabase
      .from('observations')
      .delete()
      .eq('question_id', data.questionId)
    if (obsError) throw new Error(obsError.message)

    const { error } = await supabase.from('questions').delete().eq('id', data.questionId)
    if (error) throw new Error(error.message)
    return { success: true } as const
  })

// --- Notifications ---

export const updateNotificationPreferences = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      brandId: string
      emailEnabled: boolean
      notifyMeasurementRun: boolean
      notifySiteChange: boolean
      notifyOpportunity: boolean
      notifyBilling: boolean
    }) => data,
  )
  .handler(async ({ data }): Promise<any> => {
    const supabase = getSupabaseServerClient()
    const user = await requireUser(supabase)
    await requireOwnedBrand(supabase, user.id, data.brandId)

    const { error } = await supabase.from('notification_preferences').upsert(
      {
        brand_id: data.brandId,
        email_enabled: data.emailEnabled,
        notify_measurement_run: data.notifyMeasurementRun,
        notify_site_change: data.notifySiteChange,
        notify_opportunity: data.notifyOpportunity,
        notify_billing: data.notifyBilling,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'brand_id' },
    )
    if (error) throw new Error(error.message)
    return { success: true } as const
  })

export const generateQuestionsWithAI = createServerFn({ method: 'POST' })
  .validator((data: { name: string; websiteUrl: string }) => data)
  .handler(async ({ data }): Promise<string[]> => {
    const supabase = getSupabaseServerClient()
    const user = await requireUser(supabase)

    // Garde-fou 1 : vérification d'email confirmé en production
    if (
      process.env.NODE_ENV === 'production' &&
      user.app_metadata?.provider === 'email' &&
      !(user as any).email_confirmed_at &&
      !(user as any).confirmed_at
    ) {
      throw new Error('Veuillez confirmer votre adresse email avant de générer des suggestions de questions.')
    }

    const name = data.name.trim()
    const websiteUrl = data.websiteUrl.trim()
    if (!name || !websiteUrl) {
      throw new Error('Le nom et l\'URL de la marque sont requis pour générer les questions.')
    }
    if (!isValidWebsiteUrl(websiteUrl)) {
      throw new Error('URL invalide.')
    }

    const { getSupabaseAdminClient } = await import('~/lib/supabase/server')
    const adminSupabase = getSupabaseAdminClient()

    // Garde-fou 2 : 1 génération par compte maximum (user_id)
    // Même philosophie que FREE_MAX_MEASUREMENTS = 1
    try {
      const { count: genCount, error: countError } = await (adminSupabase as any)
        .from('api_usage_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('call_type', 'question_generation')

      if (!countError && (genCount ?? 0) >= 1) {
        throw new Error(
          'Vous avez déjà généré des suggestions pour ce compte. Vous pouvez les modifier ou en ajouter manuellement.',
        )
      }
    } catch (err: any) {
      if (err?.message?.includes('déjà généré')) {
        throw err
      }
      // Erreur inattendue sur la vérification du quota — on laisse passer pour ne pas
      // bloquer l'inscription sur une erreur réseau transitoire.
    }

    // Garde-fou 3 : Filet de sécurité IP basé sur getClientIp() et signup_attempts
    try {
      const { getClientIp } = await import('~/lib/ip.server')
      const ip = getClientIp()

      if (ip && ip !== 'unknown') {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: attempts } = await (adminSupabase as any)
          .from('signup_attempts')
          .select('user_id')
          .eq('ip_address', ip)
          .gte('created_at', since24h)

        if (attempts && attempts.length > 0) {
          const userIds = attempts.map((a: any) => a.user_id).filter(Boolean)
          if (userIds.length > 0) {
            const { count: ipGenCount } = await (adminSupabase as any)
              .from('api_usage_log')
              .select('id', { count: 'exact', head: true })
              .in('user_id', userIds)
              .eq('call_type', 'question_generation')

            if ((ipGenCount ?? 0) >= 3) {
              throw new Error(
                'Trop de demandes de génération depuis cette connexion. Veuillez réessayer plus tard.',
              )
            }
          }
        }
      }
    } catch (ipErr: any) {
      if (ipErr?.message?.includes('Trop de demandes')) {
        throw ipErr
      }
      // Erreur inattendue sur la vérification IP — on laisse passer pour ne pas
      // bloquer l'inscription sur une erreur réseau transitoire, mais signup_attempts
      // existe bien en prod (créée dans la migration anti-abus #19).
    }

    // Dynamic import to avoid running gemini code on client side bundle if not split
    const { generateBrandQuestions } = await import('~/lib/analysis')
    const { calculateCost } = await import('~/lib/openai-pricing')
    
    // Récupérer la marque de l'utilisateur si elle existe déjà
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    const { questions, usage, model: actualModel } = await generateBrandQuestions(name, websiteUrl, 'free')
    
    if (usage.inputTokens > 0 || usage.outputTokens > 0) {
      try {
        await (adminSupabase as any).from('api_usage_log').insert({
          brand_id: brand?.id ?? null,
          user_id: user.id,
          call_type: 'question_generation',
          model: actualModel,
          tokens_input: usage.inputTokens,
          tokens_output: usage.outputTokens,
          estimated_cost_usd: calculateCost(actualModel, usage.inputTokens, usage.outputTokens),
        })
      } catch (insertErr) {
        console.warn('api_usage_log insert skipped:', insertErr)
      }
    }
    
    return questions
  })

