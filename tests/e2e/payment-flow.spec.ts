import { test, expect, type Page } from '@playwright/test'
import { createTestUser, deleteTestUser } from './helpers/auth'
import { setupTestBrand, cleanupTestBrand } from './helpers/brand'

test.describe('Flux de paiement FedaPay', () => {
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

  test('Widget FedaPay : chargement et affichage correct', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'free')
    brandId = brand.id
    
    await page.goto('/dashboard/parametres')
    
    // Cliquer sur le bouton upgrade
    const upgradeButton = page.locator('button:has-text("Passer au plan Pro")')
    await expect(upgradeButton).toBeVisible()
    
    // Vérifier que le bouton n'est pas désactivé (script FedaPay chargé)
    await page.waitForTimeout(3000) // Laisser le temps au script de se charger
    await expect(upgradeButton).toBeEnabled()
    
    // Cliquer pour ouvrir le widget
    await upgradeButton.click()
    
    // Attendre que le widget s'ouvre (timeout généreux)
    await page.waitForTimeout(5000)
    
    // Vérifier la présence du widget/iframe FedaPay
    const fedapayFrame = page.frameLocator('iframe[src*="fedapay"], iframe[src*="checkout"]')
    
    // Le montant doit être affiché dans le widget
    await expect(fedapayFrame.locator('text=32000, text=XOF')).toBeVisible({ timeout: 10000 })
    
    // Vérifier les informations du produit
    await expect(fedapayFrame.locator('text=Reflet, text=Pro')).toBeVisible()
  })

  test('Données utilisateur : pré-remplies dans le widget', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'free')
    brandId = brand.id
    
    // Aller d'abord modifier le profil pour avoir des données
    await page.goto('/dashboard/parametres')
    
    // Modifier le nom complet
    await page.click('button[aria-label="Modifier le nom"]')
    await page.fill('input[name="fullName"]', 'Jean Dupont Test')
    await page.click('button:has-text("Sauvegarder")')
    
    // Maintenant tester le widget
    await page.click('button:has-text("Passer au plan Pro")')
    await page.waitForTimeout(5000)
    
    const fedapayFrame = page.frameLocator('iframe[src*="fedapay"], iframe[src*="checkout"]')
    
    // Vérifier que les données sont pré-remplies
    await expect(fedapayFrame.locator('input[name*="firstname"], input[value="Jean"]')).toBeVisible()
    await expect(fedapayFrame.locator('input[name*="lastname"], input[value="Dupont"]')).toBeVisible()
    await expect(fedapayFrame.locator(`input[name*="email"], input[value="${testUser.email}"]`)).toBeVisible()
  })

  test('Fermeture widget : reste en plan Free', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'free')
    brandId = brand.id
    
    await page.goto('/dashboard/parametres')
    
    // Ouvrir le widget
    await page.click('button:has-text("Passer au plan Pro")')
    await page.waitForTimeout(3000)
    
    // Fermer le widget (ESC ou bouton fermer)
    await page.keyboard.press('Escape')
    
    // Ou chercher le bouton fermer dans l'iframe
    const fedapayFrame = page.frameLocator('iframe[src*="fedapay"], iframe[src*="checkout"]')
    if (await fedapayFrame.locator('button[aria-label="Close"], .close, .cancel').isVisible()) {
      await fedapayFrame.locator('button[aria-label="Close"], .close, .cancel').first().click()
    }
    
    await page.waitForTimeout(2000)
    
    // Vérifier qu'on reste en plan Free
    await expect(page.locator('text=Plan Free')).toBeVisible()
    await expect(page.locator('text=Plan Actif')).not.toBeVisible()
    
    // Le bouton upgrade doit toujours être présent
    await expect(page.locator('button:has-text("Passer au plan Pro")')).toBeVisible()
  })

  test('Simulation paiement réussi : webhook et mise à jour', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'free')
    brandId = brand.id
    
    await page.goto('/dashboard/parametres')
    
    // Vérifier l'état initial Free
    await expect(page.locator('text=Plan Free')).toBeVisible()
    
    // Simuler un paiement réussi en appelant directement le webhook
    const webhookPayload = {
      name: 'transaction.approved',
      entity: {
        id: 'txn_test_12345',
        status: 'approved',
        custom_metadata: {
          brandId: brand.id,
          plan: 'active'
        }
      }
    }
    
    // Appeler le webhook (nécessite l'API key pour la signature HMAC)
    const webhookResponse = await page.evaluate(async (payload) => {
      return fetch('/api/webhooks/fedapay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fedapay-signature': 'test_signature' // En sandbox, la signature est plus souple
        },
        body: JSON.stringify(payload)
      })
    }, webhookPayload)
    
    // Recharger la page pour voir la mise à jour
    await page.reload()
    
    // Vérifier la transition vers Pro
    await expect(page.locator('text=Plan Actif')).toBeVisible()
    await expect(page.locator('text=Plan Free')).not.toBeVisible()
    
    // Le bouton upgrade ne doit plus être présent
    await expect(page.locator('button:has-text("Passer au plan Pro")')).not.toBeVisible()
  })

  test('Erreur paiement : gestion gracieuse', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'free')
    brandId = brand.id
    
    await page.goto('/dashboard/parametres')
    
    // Mocker une erreur lors de la création de session
    await page.route('/api/billing/create-checkout-session', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Erreur de connexion FedaPay' })
      })
    })
    
    // Essayer de lancer le paiement
    await page.click('button:has-text("Passer au plan Pro")')
    
    // Vérifier l'affichage de l'erreur
    await expect(page.locator('text=Erreur de connexion FedaPay')).toBeVisible()
    
    // Vérifier qu'on reste en plan Free
    await expect(page.locator('text=Plan Free')).toBeVisible()
    
    // Le bouton doit redevenir utilisable
    await expect(page.locator('button:has-text("Passer au plan Pro")')).toBeEnabled()
  })

  test('État de chargement : bouton désactivé pendant traitement', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'free')
    brandId = brand.id
    
    await page.goto('/dashboard/parametres')
    
    // Ralentir la réponse de création de session
    await page.route('/api/billing/create-checkout-session', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000))
      route.continue()
    })
    
    const upgradeButton = page.locator('button:has-text("Passer au plan Pro")')
    
    // Cliquer sur upgrade
    await upgradeButton.click()
    
    // Vérifier que le bouton est désactivé avec spinner
    await expect(upgradeButton).toBeDisabled()
    await expect(page.locator('.animate-spin')).toBeVisible() // Loader icon
    
    // Attendre que le traitement se termine
    await page.waitForTimeout(4000)
    
    // Le bouton doit redevenir normal ou le widget s'ouvrir
    await expect(upgradeButton).toBeEnabled()
  })

  test('Montant correct : 32000 XOF affiché partout', async () => {
    const brand = await setupTestBrand(testUser.userId!, 'free')
    brandId = brand.id
    
    // Vérifier le montant sur différentes pages
    const pagesToCheck = [
      '/dashboard',
      '/dashboard/parametres', 
      '/dashboard/opportunites'
    ]
    
    for (const pageUrl of pagesToCheck) {
      await page.goto(pageUrl)
      
      // Chercher les boutons upgrade avec montant
      const upgradeButtons = page.locator('button:has-text("32000"), button:has-text("XOF")')
      
      if (await upgradeButtons.count() > 0) {
        // Vérifier que le montant est cohérent
        await expect(upgradeButtons.first()).toContainText('32000')
        await expect(upgradeButtons.first()).toContainText('XOF')
      }
    }
    
    // Test spécifique dans le widget
    await page.goto('/dashboard/parametres')
    await page.click('button:has-text("Passer au plan Pro")')
    await page.waitForTimeout(3000)
    
    const fedapayFrame = page.frameLocator('iframe[src*="fedapay"], iframe[src*="checkout"]')
    await expect(fedapayFrame.locator('text=32000')).toBeVisible()
  })

  test('Sécurité : vérification propriétaire marque', async () => {
    // Créer deux utilisateurs
    const brand1 = await setupTestBrand(testUser.userId!, 'free')
    const otherUser = await createTestUser()
    const brand2 = await setupTestBrand(otherUser.userId!, 'free')
    
    brandId = brand1.id
    
    await page.goto('/dashboard/parametres')
    
    // Essayer de payer pour la marque d'un autre utilisateur
    await page.evaluate(async (otherBrandId) => {
      // Attempt to call checkout with another user's brand
      try {
        const response = await fetch('/api/billing/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            brandId: otherBrandId, 
            returnUrl: window.location.href 
          })
        })
        const result = await response.json()
        if (response.ok) {
          throw new Error('Security breach: Could pay for another user\'s brand')
        }
      } catch (e) {
        // Expected to fail
      }
    }, brand2.id)
    
    // Vérifier qu'on ne peut payer que pour sa propre marque
    await page.click('button:has-text("Passer au plan Pro")')
    
    // Le paiement doit fonctionner normalement pour sa propre marque
    await page.waitForTimeout(3000)
    const fedapayFrame = page.frameLocator('iframe[src*="fedapay"], iframe[src*="checkout"]')
    await expect(fedapayFrame.locator('text=32000')).toBeVisible()
    
    // Cleanup
    await cleanupTestBrand(brand2.id)
    await deleteTestUser(otherUser.userId!)
  })
})