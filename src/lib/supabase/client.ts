import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

// Client navigateur — utilise la clé anon (publique par design, protégée par RLS).
// Aucune valeur codée en dur : si les variables manquent, on veut une erreur
// explicite au démarrage plutôt qu'un fallback silencieux vers un vrai projet.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined)
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) et la clé ANON doivent être définies.',
  )
}

export function getSupabaseBrowserClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
