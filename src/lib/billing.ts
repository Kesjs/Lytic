import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/lib/supabase/server'

export const PRO_PLAN_PRICE_XOF = 32000 // ~49 EUR (Prix du plan mensuel)

export const createCheckoutSession = createServerFn({ method: 'POST' })
  .validator((data: { brandId: string; returnUrl: string }) => data)
  .handler(async ({ data: { brandId, returnUrl } }) => {
    const supabase = getSupabaseServerClient()

    // 1. Vérifier l'authentification et récupérer le profil
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Non authentifié')
    }

    // Vérifie que la marque appartient bien à l'appelant — sans ça, n'importe
    // quel compte authentifié pouvait passer le brandId d'une autre marque
    // et faire activer le plan Pro de quelqu'un d'autre avec son propre
    // paiement, puisque c'est ce brandId qui est renvoyé tel quel au webhook.
    const { data: ownedBrand } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .eq('owner_id', user.id)
      .maybeSingle()
    if (!ownedBrand) {
      throw new Error('Marque introuvable ou accès refusé')
    }

    const { data: profile } = await (supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: { email: string; full_name: string | null } | null }>)

    const email = profile?.email || user.email
    const fullName = profile?.full_name || 'User'
    const nameParts = fullName.split(' ')
    const firstname = nameParts[0]
    const lastname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Doe'

    // 2. Déterminer l'URL de base et les clés FedaPay
    const secretKey = process.env.FEDAPAY_SECRET_KEY
    const isSandbox = process.env.FEDAPAY_ENVIRONMENT !== 'live'
    const apiUrl = isSandbox 
      ? 'https://sandbox-api.fedapay.com/v1/transactions' 
      : 'https://api.fedapay.com/v1/transactions'

    if (!secretKey) {
      throw new Error('La clé secrète FedaPay n\'est pas configurée')
    }

    // 3. Créer la transaction FedaPay
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: 'Reflet - Plan Pro (Accès mensuel)',
        amount: PRO_PLAN_PRICE_XOF,
        currency: { iso: 'XOF' },
        customer: {
          email,
          firstname,
          lastname
        },
        custom_metadata: {
          brandId,
          plan: 'active'
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('[FedaPay] Erreur lors de la création de la transaction:', errorData)
      throw new Error('Erreur lors de la création de la transaction FedaPay')
    }

    const result = await response.json()
    const transactionToken = result.v1_transaction?.token || result.transaction?.token

    if (!transactionToken) {
        console.error('[FedaPay] Token manquant dans la réponse:', result)
        throw new Error('Token de transaction non trouvé')
    }

    // On retourne le token au client pour initialiser le widget FedaPay
    return { token: transactionToken }
  })
