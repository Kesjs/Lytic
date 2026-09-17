import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '~/lib/supabase/database.types'

export async function requireAdmin(supabase: SupabaseClient<Database>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Non authentifié')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (error || !profile?.is_admin) {
    throw new Error('Accès refusé')
  }

  return true
}
