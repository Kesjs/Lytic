import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'

// Toutes les requêtes ci-dessous lisent les vraies tables Supabase
// (brands, measurement_runs, opportunities, events, site_pages…).
// Aucune donnée simulée : si une marque n'a pas encore de run, les pages
// doivent afficher un état "No data" / "Reflet n'a pas encore mesuré",
// jamais un chiffre inventé.

export const fetchCurrentBrand = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = getSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data: brand, error } = await supabase
    .from('brands')
    .select('*')
    .eq('owner_id', auth.user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return brand
})

export const fetchDashboardHome = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = getSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { brand: null } as const

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('owner_id', auth.user.id)
    .maybeSingle()

  if (!brand) return { brand: null } as const

  const [{ data: runs }, { data: opportunities }, { data: events }, { data: pages }] =
    await Promise.all([
      supabase
        .from('measurement_runs')
        .select('*')
        .eq('brand_id', brand.id)
        .order('started_at', { ascending: false })
        .limit(2),
      supabase
        .from('opportunities')
        .select('*')
        .eq('brand_id', brand.id)
        .eq('status', 'open')
        .order('confidence', { ascending: false })
        .limit(5),
      supabase
        .from('events')
        .select('*')
        .eq('brand_id', brand.id)
        .eq('show_history', true)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('site_pages').select('*').eq('brand_id', brand.id),
    ])

  const latestRun = runs?.[0] ?? null
  const previousRun = runs?.[1] ?? null

  return {
    brand,
    latestRun,
    previousRun,
    opportunities: opportunities ?? [],
    events: events ?? [],
    pages: pages ?? [],
  } as const
})
