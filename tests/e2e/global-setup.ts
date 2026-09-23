import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Démarrage des tests E2E - Parcours utilisateur Lytic')
  
  // Lancer un navigateur pour vérifier que l'app est accessible
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Vérifier que l'application répond
    await page.goto(config.projects[0].use?.baseURL || 'http://localhost:3001', {
      timeout: 30000
    })
    
    // Vérifier que la page d'accueil se charge
    await page.waitForSelector('text=Votre visibilité IA', { timeout: 10000 })
    
    console.log('✅ Application accessible et opérationnelle')
  } catch (error) {
    console.error('❌ Erreur lors de l\'accès à l\'application:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup