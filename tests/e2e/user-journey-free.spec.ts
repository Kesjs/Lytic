import { test, expect, type Page } from '@playwright/test'
import { createTestUser, deleteTestUser } from './helpers/auth'
import { setupTestBrand, cleanupTestBrand } from './helpers/brand'

test.describe('Parcours utilisateur Plan FREE', () => {
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

  test('Configuration marque FREE : respecte la limite 3 questions', async () => {
    // Cliquer sur "Configurer ma marque"
    await page.click('button:has-text("Configurer ma marque")')
    
    // Remplir les informations de base
    await page.fill('input[name="name"]', 'Test Brand FREE')
    await page.fill('input[name="website"]', 'https://testfree.com')
    
    // Ajouter 4 questions (doit être limité à 3)
    const questions = [
      'Question 1 pour test FREE',
      'Question 2 pour test FREE', 
      'Question 3 pour test FREE',
      'Question 4 - cette question ne doit PAS être acceptée'
    ]
    
    for (let i = 0; i < questions.length; i++) {
      // Ajouter une question
      await page.click('button:has-text("Ajouter une question")')
      const questionInputs = await page.locator('textarea[placeholder*="question"]')
      await questionInputs.nth(i).fill(questions[i])
      
      if (i >= 3) {
        // Vérifier qu'on ne peut pas ajouter plus de 3 questions
        const addButton = page.locator('button:has-text("Ajouter une question")')
        await expect(addButton).toBeDisabled()
        break
      }
    }
    
    // Vérifier qu'on a exactement 3 questions
    const questionInputs = await page.locator('textarea[placeholder*="question"]')
    await expect(questionInputs).toHaveCount(3)
    
    // Finaliser la création
    await page.click('button:has-text("Créer ma marque")')
    
    // Vérifier la redirection vers dashboard avec plan FREE
    await page.waitForURL('/dashboard')
    
    // Vérifier l'affichage du badge plan FREE
    await expect(page.locator('text=Free')).toBeVisible()
    
    // Stocker brandId pour cleanup
    brandId = await page.evaluate(() => {
      const url = new URL(window.location.href)
      return localStorage.getItem('currentBrandId') || 'test-brand'
    })
  })

  test('Mesures FREE : respecte le quota 3/semaine', async () => {
    // Setup marque de test
    const brand = await setupTestBrand(testUser.userId!, 'free')
    brandId = brand.id
    
    await page.reload()
    
    // Lancer 3 mesures successives
    for (let i = 1; i <= 3; i++) {
      const measureButton = page.locator('button:has-text("Lancer une mesure")')
      await measureButton.click()
      
      // Attendre que la mesure commence
      await expect(page.locator('text=Mesure en cours')).toBeVisible()
      
      // Simuler la fin de mesure (en mode test)
      await page.waitForTimeout(2000)
      
      if (i < 3) {
        // Vérifier qu'on peut encore mesurer
        await expect(measureButton).toBeEnabled()
      }
    }
    
    // Après 3 mesures, le bouton doit être désactivé
    const measureButton = page.locator('button:has-text("Lancer une mesure")')
    await expect(measureButton).toBeDisabled()
    
    // Vérifier le message de quota atteint
    await expect(page.locator('text=quota hebdomadaire atteint')).toBeVisible()
    
    // Vérifier l'affichage de l'upgrade vers Pro
    await expect(page.locator('button:has-text("Passer au plan Pro")')).toBeVisible()
  })

  test('Scan technique FREE : respecte cooldown 1 jour', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'free')
    brandId = brand.id
    
    await page.goto('/dashboard/audit-technique')
    
    // Premier scan doit être possible
    const scanButton = page.locator('button:has-text("Vérifier mon site")')
    await expect(scanButton).toBeEnabled()
    await scanButton.click()
    
    // Attendre la fin du scan
    await page.waitForTimeout(3000)
    
    // Le bouton doit maintenant être désactivé avec cooldown
    await expect(scanButton).toBeDisabled()
    await expect(page.locator('text=dans 1 jour')).toBeVisible()
    
    // Vérifier l'incitation à l'upgrade
    await expect(page.locator('text=monitoring quotidien')).toBeVisible()
    await expect(page.locator('button:has-text("Passer au plan Pro")')).toBeVisible()
  })

  test('Concurrents FREE : affiche max 2 concurrents + floutage', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'free', {
      competitors: ['Concurrent 1', 'Concurrent 2', 'Concurrent 3', 'Concurrent 4']
    })
    brandId = brand.id
    
    await page.goto('/dashboard/concurrents')
    
    // Vérifier qu'on voit seulement 2 concurrents
    const visibleCompetitors = page.locator('[data-testid="competitor-card"]:not([data-locked="true"])')
    await expect(visibleCompetitors).toHaveCount(2)
    
    // Vérifier qu'il y a des concurrents floutés/verrouillés
    const lockedCompetitors = page.locator('[data-testid="competitor-card"][data-locked="true"]')
    await expect(lockedCompetitors).toHaveCount(2)
    
    // Vérifier le message de déblocage Pro
    await expect(page.locator('text=Déverrouillez tous vos concurrents')).toBeVisible()
    await expect(page.locator('button:has-text("Voir tous les concurrents")')).toBeVisible()
  })

  test('Boutons upgrade Pro : présents aux bons endroits', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'free')
    brandId = brand.id
    
    // Page d'accueil
    await page.goto('/dashboard')
    await expect(page.locator('button:has-text("Passer au plan Pro")')).toBeVisible()
    
    // Page Opportunités
    await page.goto('/dashboard/opportunites')
    await expect(page.locator('text=1 question sur dizaines')).toBeVisible()
    
    // Page Concurrents
    await page.goto('/dashboard/concurrents')
    await expect(page.locator('button:has-text("Voir tous les concurrents")')).toBeVisible()
    
    // Page Paramètres
    await page.goto('/dashboard/parametres')
    await expect(page.locator('text=Plan Free')).toBeVisible()
    await expect(page.locator('button:has-text("Passer au plan Pro")')).toBeVisible()
  })

  test('Tentative upgrade : ouvre widget FedaPay', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'free')
    brandId = brand.id
    
    await page.goto('/dashboard/parametres')
    
    // Cliquer sur upgrade
    await page.click('button:has-text("Passer au plan Pro")')
    
    // Attendre que le widget FedaPay se charge
    await page.waitForTimeout(2000)
    
    // Vérifier que le widget/modal de paiement s'ouvre
    // (Le widget FedaPay s'ouvre dans une iframe ou modal)
    const paymentModal = page.frameLocator('iframe[src*="fedapay"]').first()
    await expect(paymentModal.locator('text=32000')).toBeVisible({ timeout: 10000 })
    
    // Fermer le widget sans payer
    await page.keyboard.press('Escape')
    
    // Vérifier qu'on est toujours en plan Free
    await expect(page.locator('text=Plan Free')).toBeVisible()
  })

  test('Audit technique FREE : badge et recommandations', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'free')
    brandId = brand.id
    
    await page.goto('/dashboard')
    
    // Vérifier la présence du badge optimisation IA
    const badge = page.locator('[data-testid="ai-optimization-badge"]')
    await expect(badge).toBeVisible()
    
    // Le badge doit être orange/rouge pour inciter à l'upgrade
    await expect(badge).toHaveClass(/warning|danger/)
    
    // Cliquer pour aller sur audit technique
    await page.click('text=Voir les recommandations')
    
    // Vérifier la page audit technique
    await page.waitForURL('/dashboard/audit-technique')
    
    // Vérifier les recommandations humanisées
    await expect(page.locator('text=Les IA savent qui vous êtes')).toBeVisible()
    await expect(page.locator('text=Votre site parle aux robots')).toBeVisible()
    
    // Code snippets cachés par défaut
    await expect(page.locator('pre code')).not.toBeVisible()
    
    // Cliquer sur "Voir le code"
    await page.click('button:has-text("Voir le code")')
    await expect(page.locator('pre code')).toBeVisible()
  })
})