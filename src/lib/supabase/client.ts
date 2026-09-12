import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

// Client navigateur — utilise la clé anon (publique par design, protégée par RLS).
// Aucune valeur codée en dur : si les variables manquent, on veut une erreur
// explicite au démarrage plutôt qu'un fallback silencieux vers un vrai projet.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies (voir .env.example).',
  )
}

export function getSupabaseBrowserClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
