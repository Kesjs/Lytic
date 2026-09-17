import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/queries/admin'

export interface AbuseRecord {
  ip_address: string
  attempts: number
  last_attempt: string
}

export const fetchSignupAttempts = createServerFn({ method: 'GET' })
  .handler(async (): Promise<AbuseRecord[]> => {
    const supabase = getSupabaseServerClient()
    await requireAdmin(supabase)

    // On récupère les 1000 derniers attempts pour faire le group by en JS
    // (Dans un vrai projet on utiliserait une vue SQL ou RPC, mais pour admin c'est ok)
    const { data: attempts, error } = await supabase
      .from('signup_attempts')
      .select('ip_address, created_at')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) throw new Error(error.message)

    const aggregated: Record<string, { attempts: number; last_attempt: string }> = {}
    
    for (const row of attempts ?? []) {
      if (!aggregated[row.ip_address]) {
        aggregated[row.ip_address] = { attempts: 0, last_attempt: row.created_at }
      }
      aggregated[row.ip_address].attempts++
      if (row.created_at > aggregated[row.ip_address].last_attempt) {
        aggregated[row.ip_address].last_attempt = row.created_at
      }
    }

    const result = Object.entries(aggregated).map(([ip_address, data]) => ({
      ip_address,
      ...data
    }))

    return result.sort((a, b) => b.attempts - a.attempts)
  })
