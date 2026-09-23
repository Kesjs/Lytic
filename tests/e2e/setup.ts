import { test as setup } from '@playwright/test'

// Setup global pour préparer l'environnement de test
setup('global setup', async ({ }) => {
  // Configuration globale si nécessaire
  console.log('🔧 Configuration des tests E2E parcours utilisateur')
  
  // Vérifier que les variables d'environnement sont présentes
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'FEDAPAY_SECRET_KEY',
    'VITE_FEDAPAY_PUBLIC_KEY'
  ]
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Variable d'environnement manquante: ${envVar}`)
    }
  }
  
  console.log('✅ Variables d\'environnement validées')
})