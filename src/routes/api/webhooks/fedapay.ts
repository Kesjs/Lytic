import { createFileRoute } from '@tanstack/react-router'
import { getSupabaseAdminClient } from '~/lib/supabase/server'
import crypto from 'crypto'

export const Route = createFileRoute('/api/webhooks/fedapay')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const signature = request.headers.get('x-fedapay-signature')
          if (!signature) {
            return Response.json({ error: 'Missing signature' }, { status: 400 })
          }

          const secretKey = process.env.FEDAPAY_SECRET_KEY
          if (!secretKey) {
            return Response.json({ error: 'Server misconfigured' }, { status: 500 })
          }

          const textBody = await request.text()
          let payload
          try {
            payload = JSON.parse(textBody)
          } catch (e) {
            return Response.json({ error: 'Invalid JSON' }, { status: 400 })
          }

          const hmac = crypto.createHmac('sha256', secretKey)
          hmac.update(textBody)
          const expectedSignature = hmac.digest('hex')

          if (signature !== expectedSignature) {
            console.error('[FedaPay Webhook] Signature invalide')
            return Response.json({ error: 'Invalid signature' }, { status: 401 })
          }

          const { name, entity } = payload

          if (name === 'transaction.approved' && entity) {
            const transactionId = entity.id
            const status = entity.status
            const brandId = entity.custom_metadata?.brandId
            const plan = entity.custom_metadata?.plan

            if (status === 'approved' && brandId && plan) {
              console.log(`[FedaPay Webhook] Paiement approuvé pour brand ${brandId}, activation du plan ${plan}`)
              const admin = getSupabaseAdminClient() as any
              const { error } = await admin
                .from('brands')
                .update({ plan })
                .eq('id', brandId)
              
              if (error) {
                console.error('[FedaPay Webhook] Erreur mise à jour base de données', error)
                return Response.json({ error: 'Database update failed' }, { status: 500 })
              }
            } else {
              console.warn('[FedaPay Webhook] Métadonnées manquantes ou statut incorrect')
            }
          }

          return Response.json({ received: true })
        } catch (error) {
          console.error('[FedaPay Webhook] Erreur serveur:', error)
          return Response.json({ error: 'Internal Server Error' }, { status: 500 })
        }
      }
    }
  }
})
