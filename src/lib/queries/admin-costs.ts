import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/queries/admin'
import { startOfDay, subDays, format } from 'date-fns'

export interface CostDataPoint {
  date: string
  cost: number
  callType: string
}

export const fetchAdminCosts = createServerFn({ method: 'GET' })
  .validator((period: '7d' | '30d') => period)
  .handler(async ({ data: period }): Promise<CostDataPoint[]> => {
    const supabase = getSupabaseServerClient()
    await requireAdmin(supabase)

    const days = period === '7d' ? 7 : 30
    const startDate = startOfDay(subDays(new Date(), days)).toISOString()

    const { data: logs, error } = await supabase
      .from('api_usage_log')
      .select('created_at, estimated_cost_usd, call_type')
      .gte('created_at', startDate)

    if (error) throw new Error(error.message)

    // Aggrégation par jour et par call_type
    const aggregated: Record<string, number> = {}
    
    for (const log of logs ?? []) {
      const date = format(new Date(log.created_at), 'yyyy-MM-dd')
      const type = log.call_type
      const key = `${date}|${type}`
      if (!aggregated[key]) aggregated[key] = 0
      aggregated[key] += log.estimated_cost_usd
    }

    const result: CostDataPoint[] = Object.entries(aggregated).map(([key, cost]) => {
      const [date, callType] = key.split('|')
      return { date, cost, callType }
    })

    return result.sort((a, b) => a.date.localeCompare(b.date))
  })
