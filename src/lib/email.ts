// Envoi d'e-mails transactionnels via Resend (audit détection §3.C).
//
// Utilise directement l'API HTTP de Resend (pas de SDK) pour ne pas ajouter
// de dépendance supplémentaire au projet — un simple fetch() suffit.
//
// Configuration requise en production (voir .env.example) :
//   RESEND_API_KEY   — clé API Resend (https://resend.com/api-keys)
//   RESEND_FROM_EMAIL — adresse d'expédition vérifiée sur le domaine Resend
//                        (ex. "Reflet <notifications@reflet.app>")
//
// Tant que RESEND_API_KEY n'est pas défini, sendEmail() ne fait rien et logue
// un avertissement une seule fois — ça n'empêche jamais le reste du pipeline
// (crawl, mesure, opportunités) de fonctionner. C'est volontaire : l'email
// est une notification, jamais un prérequis fonctionnel.

const RESEND_API_URL = 'https://api.resend.com/emails'
const DEFAULT_FROM = 'Reflet <notifications@reflet.app>'

let hasWarnedMissingKey = false

export interface SendEmailInput {
  to: string
  subject: string
  html: string
}

export interface SendEmailResult {
  sent: boolean
  reason?: string
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    if (!hasWarnedMissingKey) {
      console.warn(
        '[email] RESEND_API_KEY non défini — notifications email désactivées (in-app uniquement).',
      )
      hasWarnedMissingKey = true
    }
    return { sent: false, reason: 'RESEND_API_KEY manquante' }
  }

  if (!to) {
    return { sent: false, reason: 'destinataire manquant' }
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
        to: [to],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[email] Échec envoi Resend (${res.status}) :`, body)
      return { sent: false, reason: `HTTP ${res.status}` }
    }

    return { sent: true }
  } catch (err) {
    console.error('[email] Erreur réseau envoi Resend :', err)
    return { sent: false, reason: 'erreur réseau' }
  }
}

/** Gabarit HTML minimal partagé par toutes les notifications événementielles. */
export function renderEventEmail(params: { title: string; message: string | null; ctaUrl?: string }): string {
  const { title, message, ctaUrl } = params
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <p style="font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; color: #6b7280; margin-bottom: 8px;">Reflet</p>
      <h1 style="font-size: 20px; margin: 0 0 12px;">${escapeHtml(title)}</h1>
      ${message ? `<p style="font-size: 15px; line-height: 1.5; color: #374151;">${escapeHtml(message)}</p>` : ''}
      ${ctaUrl ? `<p style="margin-top: 24px;"><a href="${ctaUrl}" style="display: inline-block; background: #111827; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 14px;">Voir dans le dashboard</a></p>` : ''}
    </div>
  `.trim()
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
