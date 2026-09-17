import { createServerFn } from '@tanstack/start'
import { getSupabaseServerClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/queries/admin'

export const fetchAdminOverview = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = getSupabaseServerClient()
    await requireAdmin(supabase)

    const [
      { count: usersCount },
      { count: brandsCount },
      { count: runsCount },
      { data: costsData },
      { data: signupsData }
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('brands').select('id', { count: 'exact', head: true }),
      supabase.from('runs').select('id', { count: 'exact', head: true }),
      supabase.from('api_usage_log').select('estimated_cost_usd'),
      supabase.from('signup_attempts').select('id', { count: 'exact' }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ])

    const totalCosts = (costsData ?? []).reduce((acc, row) => acc + (row.estimated_cost_usd || 0), 0)

    return {
      totalUsers: usersCount ?? 0,
      totalBrands: brandsCount ?? 0,
      totalRuns: runsCount ?? 0,
      totalCostsUSD: totalCosts,
      recentSignups: signupsData?.length ?? 0
    }
  })
