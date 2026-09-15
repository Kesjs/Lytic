import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data: brand } = await supabase.from('brands').select('id').limit(1).single()
  
  if (!brand) return console.log('no brand')

  const { data, error } = await supabase.from('opportunities').insert({
    brand_id: brand.id,
    title: 'Test opp',
    priority: 'high',
    confidence: 90,
    status: 'open',
    observations_count: 1,
    reason: 'Test reason',
    proposed_direction: 'Test direction'
  }).select()

  console.log('Result:', JSON.stringify({ data, error }, null, 2))
}
test()
