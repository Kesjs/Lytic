import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nmzpskxclwcqnkmkpqkh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tenBza3hjbHdjcW5rbWtwcWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgzNzAxOSwiZXhwIjoyMTAxNDEzMDE5fQ.5lPzucwFZTLWFgPplLn2PhUAAFcHUWjaCKvzNmTNNtY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function run() {
  const { data: brands, error } = await supabase.from('brands').select('*')
  console.log('Brands:', brands)
  if (error) console.error(error)
}

run()
