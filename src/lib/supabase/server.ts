import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import type { Database } from './database.types'

// Client serveur — à utiliser dans les server functions / loaders de routes.
// Respecte le RLS via la session de l'utilisateur (cookies), jamais la clé
// service_role. Pas de fallback codé en dur : on veut échouer bruyamment
// si les variables d'env manquent, jamais retomber sur un secret en clair.
export function getSupabaseServerClient() {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'VITE_SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) et la clé ANON doivent être définies côté serveur.',
    )
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }))
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          setCookie(name, value, options)
        })
      },
    },
  })
}

/**
 * Client admin (service_role) — RLS BYPASSÉ.
 * Réservé aux tâches serveur privilégiées (ex. webhooks, cron de mesure).
 * Ne JAMAIS importer ce module depuis un composant client ou une route
 * du dashboard : les pages utilisateur passent par getSupabaseServerClient()
 * ou le client navigateur, qui respectent le RLS par marque.
 */
export function getSupabaseAdminClient() {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'VITE_SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY doivent être définies pour le client admin.',
    )
  }

  // Import dynamique pour être certain que ce chemin n'est jamais tiré
  // dans un bundle client.
  const { createClient } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js')

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
