import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nmzpskxclwcqnkmkpqkh.supabase.co'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tenBza3hjbHdjcW5rbWtwcWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgzNzAxOSwiZXhwIjoyMTAxNDEzMDE5fQ.5lPzucwFZTLWFgPplLn2PhUAAFcHUWjaCKvzNmTNNtY'

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
