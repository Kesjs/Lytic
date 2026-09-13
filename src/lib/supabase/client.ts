import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

const DEFAULT_SUPABASE_URL = 'https://nmzpskxclwcqnkmkpqkh.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tenBza3hjbHdjcW5rbWtwcWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MzcwMTksImV4cCI6MjEwMTQxMzAxOX0.IVzdnhwDOLr3K4vL0hlrnb4lqNkgRD4Gejr-HPriUyc'

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

// Client navigateur — utilise la clé anon (publique par design, protégée par RLS).
// Maintient une session glissante de 30 jours (standard SaaS professionnel).
export function getSupabaseBrowserClient() {
  if (clientInstance) return clientInstance

  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined) ||
    DEFAULT_SUPABASE_URL

  const supabaseAnonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined) ||
    DEFAULT_SUPABASE_ANON_KEY

  clientInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      maxAge: 30 * 24 * 60 * 60, // 30 jours de rétention
      sameSite: 'lax',
      path: '/',
    },
  })

  return clientInstance
}
