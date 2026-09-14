import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import type { Database } from './database.types'

const DEFAULT_SUPABASE_URL = 'https://nmzpskxclwcqnkmkpqkh.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tenBza3hjbHdjcW5rbWtwcWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MzcwMTksImV4cCI6MjEwMTQxMzAxOX0.IVzdnhwDOLr3K4vL0hlrnb4lqNkgRD4Gejr-HPriUyc'

// Client serveur — à utiliser dans les server functions / loaders de routes.
// Respecte le RLS via la session de l'utilisateur (cookies), jamais la clé
// service_role.
export function getSupabaseServerClient(): SupabaseClient<Database> {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL
  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_ANON_KEY

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value: value as string,
        }))
      },
      setAll(cookies: { name: string; value: string; options: any }[]) {
        cookies.forEach(({ name, value, options }) => {
          setCookie(name, value, options)
        })
      },
    },
  }) as SupabaseClient<Database>
}

/**
 * Client admin (service_role) — RLS BYPASSÉ.
 * Réservé aux tâches serveur privilégiées (ex. webhooks, cron de mesure).
 * Ne JAMAIS importer ce module depuis un composant client ou une route
 * du dashboard : les pages utilisateur passent par getSupabaseServerClient()
 * ou le client navigateur, qui respectent le RLS par marque.
 */
export function getSupabaseAdminClient(): SupabaseClient<Database> {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'VITE_SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY doivent être définies pour le client admin.',
    )
  }

  // createClient est importé statiquement au lieu d'un require() dynamique :
  // dans TanStack Start / Nitro, les server functions sont déjà isolées du
  // bundle client à la compilation — le require() était un pattern Next.js
  // qui casse l'inférence de type TypeScript ici.
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as SupabaseClient<Database>
}
