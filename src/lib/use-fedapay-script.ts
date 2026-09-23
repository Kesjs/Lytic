import { useEffect, useState } from 'react'

declare global {
  interface Window {
    FedaPay: any
  }
}

// Extrait de UpgradeButton.tsx (comportement inchangé) pour être réutilisé
// aussi par BrandSetupDrawer.tsx (souscription Pro directe à l'inscription,
// qui ouvre le même widget FedaPay sans passer par la carte Abonnement de
// Paramètres).
export function useFedaPayScript(): boolean {
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    if (document.getElementById('fedapay-checkout-script')) {
      setScriptLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.id = 'fedapay-checkout-script'
    script.src = 'https://cdn.fedapay.com/checkout.js?v=1.1.7'
    script.async = true
    script.onload = () => setScriptLoaded(true)
    document.body.appendChild(script)
  }, [])

  return scriptLoaded
}
