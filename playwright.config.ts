import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Charger les variables d'environnement pour les tests
dotenv.config({ path: '.env.local' })

/**
 * Configuration Playwright pour les tests E2E
 * Tests des parcours utilisateur Free/Pro et flux de paiement FedaPay
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Timeout global pour chaque test */
  timeout: 60000,
  
  /* Nombre de retry en cas d'échec */
  retries: process.env.CI ? 2 : 1,
  
  /* Parallélisation des tests */
  workers: process.env.CI ? 1 : 2,
  
  /* Reporter */
  reporter: process.env.CI ? 'github' : [
    ['html'],
    ['list']
  ],
  
  /* Configuration globale */
  use: {
    /* URL de base pour les tests */
    baseURL: 'http://localhost:3001',
    
    /* Collecte de traces pour debug */
    trace: 'retain-on-failure',
    
    /* Screenshots en cas d'échec */
    screenshot: 'only-on-failure',
    
    /* Video en cas d'échec */
    video: 'retain-on-failure',
    
    /* Attendre les requêtes réseau */
    actionTimeout: 15000,
  },

  /* Configuration des projets (navigateurs) */
  projects: [
    {
      name: 'setup',
      testMatch: 'tests/e2e/setup.ts',
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
  ],

  /* Configuration du serveur de test */
  webServer: {
    command: 'npm run dev',
    port: 3001,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
}
})