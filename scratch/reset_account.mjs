import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nmzpskxclwcqnkmkpqkh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgzNzAxOSwiZXhwIjoyMTAxNDEzMDE5fQ.5lPzucwFZTLWFgPplLn2PhUAAFcHUWjaCKvzNmTNNtY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function run() {
  const brandId = '58fc24d1-2891-4679-ac03-2cccdcf59a52'

  console.log('Deleting data for brand:', brandId)

  // Try to delete child data first in case ON DELETE CASCADE is missing
  const tables = [
    'observation_competitors',
    'observations',
    'measurement_runs',
    'opportunity_questions',
    'opportunity_evidence',
    'opportunities',
    'site_changes',
    'site_pages',
    'site_crawl_runs',
    'competitors',
    'events',
    'brand_bot_access',
    'questions',
    'notification_preferences'
  ]

  for (const table of tables) {
    console.log(`Deleting ${table}...`)
    // Special handling for tables that don't have brand_id directly
    if (table === 'observation_competitors' || table === 'observations' || table === 'opportunity_questions' || table === 'opportunity_evidence') {
      // Just let cascade handle them if possible, or we will see if we need manual logic
      continue
    }

    const { error } = await supabase.from(table).delete().eq('brand_id', brandId)
    if (error) console.error(`Error deleting ${table}:`, error.message)
  }

  console.log('Deleting brand...')
  const { error } = await supabase.from('brands').delete().eq('id', brandId)
  if (error) {
    console.error('Error deleting brand:', error.message)
  } else {
    console.log('Brand successfully deleted! Account is now reset.')
  }
}

run()
