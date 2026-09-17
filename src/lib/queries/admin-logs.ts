import { createServerFn } from '@tanstack/start'
import { getSupabaseServerClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/queries/admin'
import type { Database } from '~/lib/supabase/database.types'

type EventRow = Database['public']['Tables']['events']['Row']

export const fetchAdminEvents = createServerFn({ method: 'GET' })
  .handler(async (): Promise<(EventRow & { brand_name?: string })[]> => {
    const supabase = getSupabaseServerClient()
    await requireAdmin(supabase)

    const { data: events, error } = await supabase
      .from('events')
      .select('*, brands(name)')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw new Error(error.message)

    return (events ?? []).map((e: any) => ({
      ...e,
      brands: undefined,
      brand_name: e.brands?.name
    }))
  })
