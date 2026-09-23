import { test, expect, type Page } from '@playwright/test'
import { createTestUser, deleteTestUser } from './helpers/auth'
import { setupTestBrand, cleanupTestBrand } from './helpers/brand'

test.describe('Parcours utilisateur Plan PRO', () => {
  let page: Page
  let testUser: { email: string; password: string; userId?: string }
  let brandId: string

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    
    // Créer un utilisateur de test
    testUser = await createTestUser()
    
    // Se connecter
    await page.goto('/login')
    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)
    await page.click('button[type="submit"]')
    
    // Attendre la redirection vers dashboard
    await page.waitForURL('/dashboard')
  })

  test.afterEach(async () => {
    if (brandId) {
      await cleanupTestBrand(brandId)
    }
    if (testUser.userId) {
      await deleteTestUser(testUser.userId)
    }
    await page.close()
  })

  test('Configuration marque PRO : questions illimitées', async () => {
    // Setup marque Pro directement
    const brand = await setupTestBrand(testUser.userId!, 'active')
    brandId = brand.id
    
    await page.goto('/dashboard/parametres')
    
    // Vérifier l'affichage du plan Pro
    await expect(page.locator('text=Plan Actif')).toBeVisible()
    
    // Ajouter plusieurs questions (>3 pour tester la différence avec Free)
    const questions = [
      'Question Pro 1',
      'Question Pro 2', 
      'Question Pro 3',
      'Question Pro 4',
      'Question Pro 5',
      'Question Pro 6'
    ]
    
    for (const questionText of questions) {
      // Ajouter une question
      await page.click('button:has-text("Ajouter une question")')
      
      // Remplir la nouvelle question
      const newQuestionInput = page.locator('textarea[placeholder*="question"]').last()
      await newQuestionInput.fill(questionText)
      
      // Sauvegarder
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500) // Attendre la sauvegarde
    }
    
    // Vérifier qu'on a bien 6+ questions
    const questionInputs = await page.locator('textarea[placeholder*="question"]')
    await expect(questionInputs).toHaveCount(6)
    
    // Pas de message de limitation
    await expect(page.locator('text=limité à')).not.toBeVisible()
  })

  test('Mesures PRO : illimitées avec délai 1 jour', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'active')
    brandId = brand.id
    
    await page.reload()
    
    // Lancer une première mesure
    const measureButton = page.locator('button:has-text("Lancer une mesure")')
    await measureButton.click()
    
    // Attendre que la mesure commence
    await expect(page.locator('text=Mesure en cours')).toBeVisible()
    
    // Simuler la fin de mesure
    await page.waitForTimeout(3000)
    
    // Le bouton doit être désactivé temporairement (délai 1 jour)
    await expect(measureButton).toBeDisabled()
    
    // Mais pas de message de quota hebdomadaire
    await expect(page.locator('text=quota hebdomadaire')).not.toBeVisible()
    
    // Message de délai Pro (différent du quota Free)
    await expect(page.locator('text=dans 1 jour')).toBeVisible()
    
    // Pas de bouton upgrade (déjà Pro)
    await expect(page.locator('button:has-text("Passer au plan Pro")')).not.toBeVisible()
  })

  test('Scan technique PRO : quotidien sans restriction', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'active')
    brandId = brand.id
    
    await page.goto('/dashboard/audit-technique')
    
    // Premier scan
    const scanButton = page.locator('button:has-text("Vérifier mon site")')
    await expect(scanButton).toBeEnabled()
    await scanButton.click()
    
    // Attendre la fin du scan
    await page.waitForTimeout(3000)
    
    // Le bouton doit redevenir disponible rapidement (pas de cooldown 1 jour)
    await expect(scanButton).toBeEnabled()
    
    // Pas de message de cooldown
    await expect(page.locator('text=dans 1 jour')).not.toBeVisible()
    
    // Pas d'incitation upgrade
    await expect(page.locator('text=monitoring quotidien')).not.toBeVisible()
  })

  test('Concurrents PRO : tous visibles sans floutage', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'active', {
      competitors: ['Concurrent 1', 'Concurrent 2', 'Concurrent 3', 'Concurrent 4', 'Concurrent 5']
    })
    brandId = brand.id
    
    await page.goto('/dashboard/concurrents')
    
    // Vérifier qu'on voit TOUS les concurrents
    const visibleCompetitors = page.locator('[data-testid="competitor-card"]:not([data-locked="true"])')
    await expect(visibleCompetitors).toHaveCount(5)
    
    // Aucun concurrent verrouillé
    const lockedCompetitors = page.locator('[data-testid="competitor-card"][data-locked="true"]')
    await expect(lockedCompetitors).toHaveCount(0)
    
    // Pas de message de déblocage
    await expect(page.locator('text=Déverrouillez tous vos concurrents')).not.toBeVisible()
    await expect(page.locator('button:has-text("Voir tous les concurrents")')).not.toBeVisible()
  })

  test('Multi-moteur PRO : OpenAI + Perplexity', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'active')
    brandId = brand.id
    
    await page.goto('/dashboard/performance')
    
    // Lancer une mesure pour voir les moteurs utilisés
    await page.goto('/dashboard')
    await page.click('button:has-text("Lancer une mesure")')
    
    // Attendre que la mesure se termine
    await page.waitForTimeout(5000)
    
    // Aller voir les détails de performance
    await page.goto('/dashboard/performance')
    
    // Vérifier la mention multi-moteur
    await expect(page.locator('text=OpenAI')).toBeVisible()
    await expect(page.locator('text=Perplexity')).toBeVisible()
    
    // Badge "3 échantillons" vs "1 échantillon" pour Free
    await expect(page.locator('text=3 échantillons')).toBeVisible()
    await expect(page.locator('text=Précision élevée')).toBeVisible()
  })

  test('Dashboard PRO : pas de limites affichées', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'active')
    brandId = brand.id
    
    await page.goto('/dashboard')
    
    // Vérifier l'absence de bandeaux de limitation Free
    await expect(page.locator('text=1 question sur dizaines')).not.toBeVisible()
    await expect(page.locator('text=Précision Basse')).not.toBeVisible()
    await expect(page.locator('text=Plan Free')).not.toBeVisible()
    
    // Vérifier l'affichage des fonctionnalités Pro
    await expect(page.locator('text=Plan Actif')).toBeVisible()
    await expect(page.locator('text=Précision élevée')).toBeVisible()
    
    // Pas de boutons upgrade
    await expect(page.locator('button:has-text("Passer au plan Pro")')).not.toBeVisible()
  })

  test('Opportunités PRO : accès complet sans restrictions', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'active')
    brandId = brand.id
    
    await page.goto('/dashboard/opportunites')
    
    // Pas de message de limitation
    await expect(page.locator('text=1 question sur dizaines')).not.toBeVisible()
    await expect(page.locator('text=Déverrouillez')).not.toBeVisible()
    
    // Accès aux fonctionnalités avancées
    await expect(page.locator('[data-testid="opportunity-card"]')).toBeVisible()
    
    // Contenu actionnable disponible
    if (await page.locator('button:has-text("Générer du contenu")').isVisible()) {
      await page.click('button:has-text("Générer du contenu")')
      // Pas de limitation Pro requise
      await expect(page.locator('text=Upgrade required')).not.toBeVisible()
    }
  })

  test('Audit technique PRO : fonctionnalités avancées', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'active')
    brandId = brand.id
    
    await page.goto('/dashboard/audit-technique')
    
    // Vérifier les fonctionnalités Pro
    if (await page.locator('button:has-text("Auto-apply via GitHub")').isVisible()) {
      await expect(page.locator('button:has-text("Auto-apply via GitHub")')).toBeVisible()
    }
    
    // Score plus détaillé
    await expect(page.locator('[data-testid="detailed-audit-metrics"]')).toBeVisible()
    
    // Historique complet accessible
    await page.goto('/dashboard/historique')
    
    // Pas de limitation d'historique
    await expect(page.locator('text=Historique limité')).not.toBeVisible()
    
    // Diff complet disponible
    const diffEntries = page.locator('[data-testid="diff-entry"]')
    if (await diffEntries.count() > 0) {
      await diffEntries.first().click()
      // Diff détaillé accessible
      await expect(page.locator('[data-testid="detailed-diff"]')).toBeVisible()
    }
  })

  test('Paramètres PRO : gestion complète', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'active')
    brandId = brand.id
    
    await page.goto('/dashboard/parametres')
    
    // Status plan Pro
    await expect(page.locator('text=Plan Actif')).toBeVisible()
    
    // Gestion d'abonnement (si implémentée)
    if (await page.locator('button:has-text("Gérer l\'abonnement")').isVisible()) {
      await expect(page.locator('button:has-text("Gérer l\'abonnement")')).toBeVisible()
    }
    
    // Pas de limitations dans les paramètres
    await expect(page.locator('text=limité à')).not.toBeVisible()
    
    // Notifications avancées disponibles
    await expect(page.locator('text=Notifications avancées')).toBeVisible()
  })

  test('Transition Free vers Pro : déblocage immédiat', async () => {
    // Commencer avec un compte Free
    let brand = await setupTestBrand(testUser.userId!, 'free')
    brandId = brand.id
    
    await page.goto('/dashboard')
    
    // Vérifier les limitations Free
    await expect(page.locator('text=Plan Free')).toBeVisible()
    
    // Simuler le paiement réussi (mise à jour directe en base)
    await setupTestBrand(testUser.userId!, 'active', { brandId: brand.id })
    
    // Recharger la page
    await page.reload()
    
    // Vérifier le déblocage immédiat
    await expect(page.locator('text=Plan Actif')).toBeVisible()
    await expect(page.locator('text=Plan Free')).not.toBeVisible()
    
    // Fonctionnalités Pro maintenant disponibles
    await expect(page.locator('text=Précision élevée')).toBeVisible()
    
    // Tester une mesure Pro
    const measureButton = page.locator('button:has-text("Lancer une mesure")')
    await measureButton.click()
    
    // Pas de quota hebdomadaire
    await expect(page.locator('text=quota hebdomadaire')).not.toBeVisible()
  })
})