import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createCheckoutSession, PRO_PLAN_PRICE_XOF } from '~/lib/billing'
import { useFedaPayScript } from '~/lib/use-fedapay-script'

export function UpgradeButton({ brandId, className }: { brandId: string; className?: string }) {
  const [loading, setLoading] = useState(false)
  const scriptLoaded = useFedaPayScript()

  const handleUpgrade = async () => {
    if (!scriptLoaded || !window.FedaPay) {
      toast.error('Le module de paiement est en cours de chargement...')
      return
    }

    try {
      setLoading(true)
      
      const { token } = await createCheckoutSession({ 
        data: { brandId, returnUrl: window.location.href } 
      })

      const publicKey = import.meta.env.VITE_FEDAPAY_PUBLIC_KEY
      if (!publicKey) {
        throw new Error('Clé publique FedaPay non configurée')
      }

      window.FedaPay.init({
        public_key: publicKey,
        transaction: {
          token: token
        },
        onComplete: (resp: any) => {
          const reason = resp.reason;
          if (reason === 'FedaPay checkout is closed.') {
             // L'utilisateur a fermé la modale, ignorer
             return
          }
          toast.success('Paiement réussi ! Votre plan Pro est activé.')
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }
      })
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading || !scriptLoaded}
      className={`inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 ${className || ''}`}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      Passer au plan Pro ({PRO_PLAN_PRICE_XOF} XOF)
    </button>
  )
}
