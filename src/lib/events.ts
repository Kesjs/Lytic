import { getSupabaseAdminClient } from '~/lib/supabase/server'
import type { Database } from '~/lib/supabase/database.types'
import { sendEmail, renderEventEmail } from '~/lib/email'

type EventType = Database['public']['Tables']['events']['Row']['type']
type EventSourceType =
  | 'measurement_run'
  | 'site_change'
  | 'bot_access'
  | 'opportunity'
  | 'billing'

export interface InsertEventInput {
  brand_id: string
  type: EventType
  title: string
  message: string | null
  source_type: EventSourceType
  source_id?: string
  show_toast: boolean
  show_notification: boolean
  show_history: boolean
  read: boolean
}

// Correspondance entre la source d'un événement et le toggle granulaire
// stocké dans `notification_preferences` (settings.ts / SettingsNotifications).
// 'bot_access' est rattaché à notify_site_change : c'est un sous-type de
// surveillance du site, pas une catégorie à part dans les réglages actuels.
const NOTIFY_PREFERENCE_BY_SOURCE: Record<EventSourceType, keyof Database['public']['Tables']['notification_preferences']['Row'] | null> = {
  measurement_run: 'notify_measurement_run',
  site_change: 'notify_site_change',
  bot_access: 'notify_site_change',
  opportunity: 'notify_opportunity',
  billing: 'notify_billing',
}

/**
 * Insère un événement (visible dans le NotificationCenter in-app) et,
 * si les conditions sont réunies, envoie l'email transactionnel correspondant
 * (audit détection §3.C — "brancher un service transactionnel sur les
 * événements avec show_notification: true").
 *
 * Remplace les appels directs à `admin.from('events').insert(...)` disséminés
 * dans orchestrate.ts / measure.ts / opportunities_engine.ts, pour que
 * l'envoi d'email soit géré à un seul endroit plutôt que dupliqué à chaque
 * site d'insertion.
 *
 * Ne lève jamais d'exception : une notification (email ou même in-app) ne
 * doit jamais faire échouer le crawl, la mesure ou la génération
 * d'opportunités qui l'a déclenchée.
 */
export async function insertEvent(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  event: InsertEventInput,
): Promise<void> {
  const client = admin as any

  try {
    await client.from('events').insert({
      brand_id: event.brand_id,
      type: event.type,
      title: event.title,
      message: event.message,
      source_type: event.source_type,
      source_id: event.source_id,
      show_toast: event.show_toast,
      show_notification: event.show_notification,
      show_history: event.show_history,
      read: event.read,
    })
  } catch (err) {
    console.error('[events] Échec insertion événement :', err)
    // On tente quand même l'email ci-dessous : l'échec de l'insertion
    // in-app ne doit pas empêcher la notification de partir.
  }

  if (!event.show_notification) return

  try {
    await maybeSendEmail(client, event)
  } catch (err) {
    console.error('[events] Échec envoi notification email :', err)
  }
}

async function maybeSendEmail(
  client: ReturnType<typeof getSupabaseAdminClient>,
  event: InsertEventInput,
): Promise<void> {
  const preferenceColumn = NOTIFY_PREFERENCE_BY_SOURCE[event.source_type]
  if (!preferenceColumn) return

  const { data: prefs } = await (client as any)
    .from('notification_preferences')
    .select('email_enabled, ' + preferenceColumn)
    .eq('brand_id', event.brand_id)
    .maybeSingle()

  // Respecte le toggle global (email_enabled) ET le toggle granulaire de
  // la catégorie — déjà stockés en base mais inutilisés jusqu'ici.
  if (!prefs?.email_enabled || !prefs?.[preferenceColumn]) return

  const { data: brand } = await (client as any)
    .from('brands')
    .select('owner_id, name')
    .eq('id', event.brand_id)
    .maybeSingle()
  if (!brand?.owner_id) return

  const { data: profile } = await (client as any)
    .from('profiles')
    .select('email')
    .eq('id', brand.owner_id)
    .maybeSingle()

  const to = profile?.email
  if (!to) return

  await sendEmail({
    to,
    subject: brand.name ? `${brand.name} — ${event.title}` : event.title,
    html: renderEventEmail({ title: event.title, message: event.message }),
  })
}
