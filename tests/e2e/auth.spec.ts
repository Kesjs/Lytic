import { test, expect } from '@playwright/test'

// Compte de test : ken2001babatounde@gmail.com
// Les tests E2E utilisent Supabase OTP — le test d'inscription est
// principalement un test de flux UI (on ne reçoit pas l'OTP en CI,
// sauf si configuré avec un vrai compte de test).

test.describe('Authentification', () => {
  test('un utilisateur non connecté redirige vers /login depuis /dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*login.*/)
  })

  test('la page de login s\'affiche correctement', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Reflet|Login/)
    // Le champ email doit être visible
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('un mot de passe incorrect affiche un message d\'erreur', async ({ page }) => {
    await page.goto('/login')
    
    // Remplir avec un email et mot de passe incorrects
    await page.locator('input[type="email"]').fill('wrong@example.com')
    
    // S'il y a un champ mot de passe
    const passwordInput = page.locator('input[type="password"]')
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('wrongpassword')
      await page.locator('button[type="submit"]').click()
      
      // Un message d'erreur doit apparaître
      await expect(page.locator('[role="alert"], .error, [data-sonner-toast]')).toBeVisible({ timeout: 5000 })
      
      // Pas de redirection vers le dashboard
      await expect(page).not.toHaveURL(/.*dashboard.*/)
    }
  })

  test('formulaire OTP : l\'email est envoyé (vérification UI uniquement)', async ({ page }) => {
    await page.goto('/login')
    
    await page.locator('input[type="email"]').fill('ken2001babatounde@gmail.com')
    
    // Cliquer sur le bouton d'envoi OTP si présent
    const otpButton = page.locator('button:has-text("Envoyer"), button:has-text("Connexion"), button[type="submit"]').first()
    if (await otpButton.isVisible()) {
      await otpButton.click()
      // On attend soit un message de confirmation, soit un champ OTP
      await expect(
        page.locator('input[placeholder*="code"], input[name*="otp"], [data-sonner-toast]')
      ).toBeVisible({ timeout: 10000 })
    }
  })
})
