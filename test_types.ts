import { getSupabaseServerClient } from './src/lib/supabase/server'
import { Database } from './src/lib/supabase/database.types'

async function test() {
  const supabase = getSupabaseServerClient()
  const result = await supabase.from('brands').select('id, name, website_url').maybeSingle()
  
  // This should error if result.data is `never`, we want to see the error message
  const data = result.data
  data.unknown_property = 1
}
test()
