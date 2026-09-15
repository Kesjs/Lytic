// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'
import { isValidWebsiteUrl, QUESTION_MAX_LENGTH } from '~/lib/utils'

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
  plan: 'trial' | 'active' | 'past_due' | 'canceled'
  createdAt: string
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
    .select('id')
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

    return {
      profile,
      brand: {
        id: brandRow.id,
        name: brandRow.name,
        websiteUrl: brandRow.website_url,
        plan: brandRow.plan as SettingsBrand['plan'],
        createdAt: brandRow.created_at,
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
    if (questions.length > 30) {
      throw new Error('Limite de 30 questions suivies atteinte pour ce plan.')
    }
    if (questions.some((q) => q.length > QUESTION_MAX_LENGTH)) {
      throw new Error(`Une question dépasse la limite de ${QUESTION_MAX_LENGTH} caractères.`)
    }

    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert({ owner_id: user.id, name, website_url: websiteUrl })
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

// --- Questions ---
// Gestion manuelle (ajout / édition / désactivation) — pas de génération
// automatique dans le MVP (§48 du master : hors périmètre actuel).

export const addQuestion = createServerFn({ method: 'POST' })
  .validator((data: { brandId: string; text: string }) => data)
  .handler(async ({ data }): Promise<any> => {
    const supabase = getSupabaseServerClient()
    const user = await requireUser(supabase)
    await requireOwnedBrand(supabase, user.id, data.brandId)

    const text = data.text.trim()
    if (!text) throw new Error('La question ne peut pas être vide.')
    if (text.length > QUESTION_MAX_LENGTH) {
      throw new Error(`La question dépasse la limite de ${QUESTION_MAX_LENGTH} caractères.`)
    }

    const { count } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', data.brandId)

    if ((count ?? 0) >= 30) {
      throw new Error('Limite de 30 questions suivies atteinte pour ce plan.')
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
    await requireUser(supabase)

    const name = data.name.trim()
    const websiteUrl = data.websiteUrl.trim()
    if (!name || !websiteUrl) {
      throw new Error('Le nom et l\'URL de la marque sont requis pour générer les questions.')
    }
    if (!isValidWebsiteUrl(websiteUrl)) {
      throw new Error('URL invalide.')
    }

    // Dynamic import to avoid running gemini code on client side bundle if not split
    const { generateBrandQuestions } = await import('~/lib/analysis')
    return await generateBrandQuestions(name, websiteUrl)
  })
