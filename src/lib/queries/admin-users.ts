import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/queries/admin'

export interface AdminUserRecord {
  id: string
  email: string
  created_at: string
  is_admin: boolean
  brands: {
    id: string
    name: string
    plan: string
  }[]
}

export const fetchAdminUsers = createServerFn({ method: 'GET' })
  .handler(async (): Promise<AdminUserRecord[]> => {
    const supabase = getSupabaseServerClient()
    await requireAdmin(supabase)

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        created_at,
        is_admin,
        brands (
          id,
          name,
          plan
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return (profiles as any) || []
  })
