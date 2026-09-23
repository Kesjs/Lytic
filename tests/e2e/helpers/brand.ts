import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface SetupBrandOptions {
  brandId?: string
  competitors?: string[]
  questions?: string[]
}

export async function setupTestBrand(
  userId: string, 
  plan: string, 
  options: SetupBrandOptions = {}
): Promise<{ id: string }> {
  const timestamp = Date.now()
  const brandName = `Test Brand ${timestamp}`
  const websiteUrl = `https://testbrand${timestamp}.com`

  let brandId = options.brandId

  if (!brandId) {
    // Créer la marque
    const { data: brandData, error: brandError } = await supabaseAdmin
      .from('brands')
      .insert({
        owner_id: userId,
        name: brandName,
        website_url: websiteUrl,
        plan,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (brandError) {
      throw new Error(`Failed to create test brand: ${brandError.message}`)
    }

    brandId = brandData.id
  } else {
    // Mettre à jour le plan d'une marque existante
    const { error: updateError } = await supabaseAdmin
      .from('brands')
      .update({ plan })
      .eq('id', brandId)

    if (updateError) {
      throw new Error(`Failed to update brand plan: ${updateError.message}`)
    }
  }

  // Ajouter des questions par défaut
  const questions = options.questions || [
    'Quels sont les meilleurs outils de test automatisé ?',
    'Comment améliorer la performance de mon site web ?',
    'Quelles sont les meilleures pratiques SEO en 2024 ?'
  ]

  const questionsData = questions.map((question, index) => ({
    brand_id: brandId,
    question_text: question,
    active: true,
    position: index,
    created_at: new Date().toISOString(),
  }))

  const { error: questionsError } = await supabaseAdmin
    .from('tracked_questions')
    .insert(questionsData)

  if (questionsError) {
    console.warn('Failed to create test questions:', questionsError.message)
  }

  // Ajouter des concurrents si spécifiés
  if (options.competitors && options.competitors.length > 0) {
    const competitorsData = options.competitors.map(name => ({
      brand_id: brandId,
      name,
      hidden: false,
      created_at: new Date().toISOString(),
    }))

    const { error: competitorsError } = await supabaseAdmin
      .from('competitors')
      .insert(competitorsData)

    if (competitorsError) {
      console.warn('Failed to create test competitors:', competitorsError.message)
    }
  }

  // Créer une page de test pour l'audit technique
  const { error: pageError } = await supabaseAdmin
    .from('tracked_pages')
    .insert({
      brand_id: brandId,
      url: websiteUrl,
      status: 'ok',
      last_completed_at: new Date().toISOString(),
      extracted_content: {
        title: `${brandName} - Page d'accueil`,
        meta: 'Description de test pour la page d\'accueil',
        headings: ['Accueil', 'Services', 'Contact'],
        body: 'Contenu de test pour la page d\'accueil...',
        pricing: ['29€/mois', '99€/mois'],
        cta: ['Commencer', 'Voir les prix'],
        links: ['/services', '/contact', '/pricing'],
        structure: ['html', 'head', 'title', 'body', 'main'],
        jsonLd: true,
        h1Count: 1,
        titleLength: brandName.length + 15,
        hasMetaDescription: true,
        schemaTypes: ['Organization', 'WebSite'],
        hasUniqueH1: true,
        metaDescriptionLength: 'Description de test pour la page d\'accueil'.length,
        hasCanonical: true,
        imagesWithoutAlt: 0,
        duplicateMetaDescriptions: false,
      },
      created_at: new Date().toISOString(),
    })

  if (pageError) {
    console.warn('Failed to create test page:', pageError.message)
  }

  // Créer des préférences de notification
  const { error: notifError } = await supabaseAdmin
    .from('notification_preferences')
    .insert({
      brand_id: brandId,
      email_weekly_report: true,
      email_opportunities: true,
      email_score_changes: true,
      created_at: new Date().toISOString(),
    })

  if (notifError) {
    console.warn('Failed to create notification preferences:', notifError.message)
  }

  return { id: brandId }
}

export async function cleanupTestBrand(brandId: string): Promise<void> {
  try {
    // Supprimer dans l'ordre inverse des dépendances
    await supabaseAdmin.from('notification_preferences').delete().eq('brand_id', brandId)
    await supabaseAdmin.from('tracked_pages').delete().eq('brand_id', brandId)
    await supabaseAdmin.from('competitors').delete().eq('brand_id', brandId)
    await supabaseAdmin.from('tracked_questions').delete().eq('brand_id', brandId)
    await supabaseAdmin.from('measurement_runs').delete().eq('brand_id', brandId)
    await supabaseAdmin.from('brands').delete().eq('id', brandId)
  } catch (error) {
    console.warn('Failed to cleanup test brand:', error)
  }
}

export async function createTestMeasurement(brandId: string, status: 'success' | 'pending' | 'measuring' = 'success'): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('measurement_runs')
    .insert({
      brand_id: brandId,
      status,
      score: status === 'success' ? 75 : null,
      score_delta: status === 'success' ? 5 : null,
      started_at: new Date().toISOString(),
      completed_at: status === 'success' ? new Date().toISOString() : null,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create test measurement: ${error.message}`)
  }

  return data.id
}