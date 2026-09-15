import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const brandId = '58fc24d1-2891-4679-ac03-2cccdcf59a52'

  console.log('Deleting brand...')
  const { error } = await supabase.from('brands').delete().eq('id', brandId)
  if (error) {
    console.error('Error deleting brand:', error.message)
  } else {
    console.log('Brand successfully deleted! Account is now reset.')
  }
}

run()
