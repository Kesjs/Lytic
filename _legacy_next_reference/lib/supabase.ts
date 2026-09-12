import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nmzpskxclwcqnkmkpqkh.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tenBza3hjbHdjcW5rbWtwcWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MzcwMTksImV4cCI6MjEwMTQxMzAxOX0.IVzdnhwDOLr3K4vL0hlrnb4lqNkgRD4Gejr-HPriUyc'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

