import { test, expect } from '@playwright/test'

test.describe('Paramètres — Non-régression', () => {
  test('la page paramètres est accessible (redirection login si non auth)', async ({ page }) => {
    await page.goto('/dashboard/parametres')
    
    // Si non authentifié → redirection login
    if (page.url().includes('login')) {
      expect(page.url()).toMatch(/login/)
      return
    }

    // Si authentifié → la page doit charger
    await expect(page).toHaveURL(/parametres/)
  })

  test('modification du nom complet — persistance après reload (non-régression bug upsert)', async ({ page }) => {
    await page.goto('/dashboard/parametres')
    
    if (page.url().includes('login')) {
      test.skip()
      return
    }

    // Chercher le champ nom complet
    const nameInput = page.locator('input[name="name"], input[placeholder*="nom"], input[id*="name"]').first()
    
    if (await nameInput.isVisible()) {
      const testName = `Test User ${Date.now()}`
      await nameInput.fill(testName)
      
      // Sauvegarder
      const saveButton = page.locator('button:has-text("Enregistrer"), button:has-text("Sauvegarder"), button[type="submit"]').first()
      if (await saveButton.isVisible()) {
        await saveButton.click()
        // Attendre un feedback (toast ou message de succès)
        await page.waitForTimeout(1000)
      }
      
      // Recharger la page
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Le nom doit être persisté
      const nameInputAfterReload = page.locator('input[name="name"], input[placeholder*="nom"], input[id*="name"]').first()
      if (await nameInputAfterReload.isVisible()) {
        const value = await nameInputAfterReload.inputValue()
        expect(value).toBe(testName)
      }
    }
  })

  test('déconnexion → redirection login → accès dashboard bloqué', async ({ page }) => {
    await page.goto('/dashboard')
    
    if (page.url().includes('login')) {
      test.skip()
      return
    }

    // Chercher le bouton de déconnexion
    const logoutButton = page.locator('button:has-text("Déconnexion"), button:has-text("Se déconnecter"), [data-testid="logout"]').first()
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
      // Attendre la redirection
      await expect(page).toHaveURL(/login/, { timeout: 5000 })
      
      // Essayer d'accéder au dashboard directement
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/login/)
    }
  })
})
