import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'

// Centre de notifications (§35, §36D.8 du doc de conception) — s'appuie
// sur la table `events` déjà existante en base, qui distingue déjà
// show_toast / show_notification / show_history sur chaque ligne. Ici on
// ne lit que les événements marqués `show_notification = true` : c'est la
// couche "ce qui mérite une action", séparée du fil Historique
// (`show_history`) qui, lui, garde tout ce qui a changé.
// Aucune donnée simulée : si le Measurement Engine n'a encore rien écrit
// dans `events`, la liste reste vide — pas de notification inventée.

export interface NotificationItem {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string | null
  sourceType: 'measurement_run' | 'site_change' | 'opportunity' | 'system' | 'billing'
  read: boolean
  createdAt: string
}

async function requireUser(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Non authentifié')
  return auth.user
}

async function getOwnedBrandId(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
): Promise<string | null> {
  const { data: brand } = await supabase
    .from('brands')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()
  return brand?.id ?? null
}

export const fetchNotifications = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ items: NotificationItem[]; unreadCount: number }> => {
    const supabase = getSupabaseServerClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return { items: [], unreadCount: 0 }

    const brandId = await getOwnedBrandId(supabase, auth.user.id)
    if (!brandId) return { items: [], unreadCount: 0 }

    const { data: rows, error } = await supabase
      .from('events')
      .select('*')
      .eq('brand_id', brandId)
      .eq('show_notification', true)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw new Error(error.message)

    const items: NotificationItem[] = (rows ?? []).map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      sourceType: r.source_type,
      read: r.read,
      createdAt: r.created_at,
    }))

    return { items, unreadCount: items.filter((i) => !i.read).length }
  },
)

export const markNotificationRead = createServerFn({ method: 'POST' })
  .validator((data: { eventId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const user = await requireUser(supabase)
    const brandId = await getOwnedBrandId(supabase, user.id)
    if (!brandId) throw new Error('Aucune marque configurée')

    const { error } = await supabase
      .from('events')
      .update({ read: true })
      .eq('id', data.eventId)
      .eq('brand_id', brandId)
    if (error) throw new Error(error.message)
    return { success: true } as const
  })

export const markAllNotificationsRead = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = getSupabaseServerClient()
  const user = await requireUser(supabase)
  const brandId = await getOwnedBrandId(supabase, user.id)
  if (!brandId) throw new Error('Aucune marque configurée')

  const { error } = await supabase
    .from('events')
    .update({ read: true })
    .eq('brand_id', brandId)
    .eq('show_notification', true)
    .eq('read', false)
  if (error) throw new Error(error.message)
  return { success: true } as const
})
