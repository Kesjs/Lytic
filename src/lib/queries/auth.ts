import { createServerFn } from '@tanstack/react-start'
import { getWebRequest } from '@tanstack/react-start/server'
import { getSupabaseServerClient, getSupabaseAdminClient } from '~/lib/supabase/server'

// Fenêtre glissante anti-abus : au-delà de ce nombre de comptes créés depuis
// la même IP sur les 30 derniers jours, on bloque la création. Un chiffre
// simple, à ajuster une fois qu'on aura du signal réel (cf. reflet-plan-free-spec.md,
// point ouvert — on a choisi "bloquer" plutôt que "laisser passer sans mesure",
// faute de schéma supplémentaire pour l'état intermédiaire).
const SIGNUP_WINDOW_DAYS = 30
const SIGNUP_MAX_PER_IP = 1

function getClientIp(): string {
  // Transmis par le proxy (Render) — jamais fiable à 100% mais c'est la seule
  // IP réelle accessible côté serveur ici (le SDK Supabase côté navigateur
  // n'a aucun accès à l'IP du visiteur).
  const request = getWebRequest()
  const forwardedFor = request?.headers.get('x-forwarded-for') ?? ''
  return forwardedFor.split(',')[0]?.trim() || 'unknown'
}

export const signUpWithGuard = createServerFn({ method: 'POST' })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }): Promise<{ success: true }> => {
    const email = data.email.trim().toLowerCase()
    if (!email) throw new Error('Veuillez renseigner votre adresse email')

    const ip = getClientIp()
    const admin = getSupabaseAdminClient()

    if (ip !== 'unknown') {
      const since = new Date(Date.now() - SIGNUP_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
      const { count } = await admin
        .from('signup_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .gte('created_at', since)

      if ((count ?? 0) >= SIGNUP_MAX_PER_IP) {
        throw new Error(
          'Un compte a déjà été créé récemment depuis cette connexion. Contactez-nous si vous pensez qu’il s’agit d’une erreur.',
        )
      }
    }

    // signUp() passe par le client serveur normal (pas l'admin) : c'est lui
    // qui sait poser les cookies de session via createServerClient.
    const supabase = getSupabaseServerClient()
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password: data.password || '',
    })
    if (error) throw error

    const { error: attemptError } = await admin.from('signup_attempts').insert({
      ip_address: ip,
      email,
      user_id: signUpData.user?.id ?? null,
    })
    // Un échec d'insertion dans le log anti-abus ne doit jamais bloquer une
    // inscription par ailleurs valide — on le journalise côté serveur seulement.
    if (attemptError) console.error('signup_attempts insert failed:', attemptError.message)

    return { success: true } as const
  })
