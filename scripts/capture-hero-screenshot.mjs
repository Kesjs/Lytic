// Étape 2/2 de la capture du mockup hero.
//
// Réutilise la session sauvegardée par capture-hero-auth.mjs (aucune
// connexion manuelle nécessaire ici), ouvre chaque page du dashboard dans un
// viewport fixe en 2x (retina, net sur tous les écrans), et enregistre
// directement les images utilisées par ScreenshotFrame sur la landing page.
//
// Usage :
//   npm run capture:hero                  → capture les 4 pages connues
//   npm run capture:hero -- accueil       → capture uniquement "accueil"
//
// Prérequis : npm run capture:auth (une seule fois), et npm run dev lancé
// dans un autre terminal sur le port 3001.

import { chromium } from '@playwright/test'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const authFile = join(__dirname, '..', '.playwright', 'auth', 'demo.json')
const outDir = join(__dirname, '..', 'public', 'images', 'dashboard')
const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001'

// Une entrée par page à capturer. `path` = route du dashboard, `file` = nom
// du fichier dans public/images/dashboard/ (doit matcher ce que consomment
// Hero.tsx et les autres sections de la landing qui utilisent ScreenshotFrame).
const TARGETS = {
  accueil: { path: '/dashboard', file: 'overview.png' },
  concurrents: { path: '/dashboard/concurrents', file: 'competitors.png' },
  historique: { path: '/dashboard/historique', file: 'history.png' },
  opportunites: { path: '/dashboard/opportunites', file: 'opportunities.png' },
}

async function captureOne(context, key, { path, file }) {
  const page = await context.newPage()
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' })

  // Le shell du dashboard doit être monté
  const shell = page.locator('[data-testid="dashboard-shell"]')
  await shell.waitFor({ state: 'visible', timeout: 15_000 })

  // Laisse le temps aux graphiques (recharts) de finir leur animation
  // d'entrée et aux données de s'afficher, sinon on capture un chart à moitié
  // animé ou un skeleton de chargement.
  await page.waitForTimeout(1200)

  const outPath = join(outDir, file)
  await shell.screenshot({ path: outPath })
  console.log(`✅ ${key.padEnd(14)} → ${outPath}`)

  await page.close()
}

async function main() {
  if (!existsSync(authFile)) {
    console.error(
      `❌ Session introuvable (${authFile}).\n   Lance d'abord : npm run capture:auth`,
    )
    process.exit(1)
  }
  mkdirSync(outDir, { recursive: true })

  const requested = process.argv.slice(2)
  const keys = requested.length > 0 ? requested : Object.keys(TARGETS)

  for (const key of keys) {
    if (!TARGETS[key]) {
      console.warn(`⚠️  Cible inconnue "${key}", ignorée. Cibles valides : ${Object.keys(TARGETS).join(', ')}`)
    }
  }

  const browser = await chromium.launch()
  // deviceScaleFactor DOIT être fixé à la création du contexte — le changer
  // après coup (setViewportSize) ne suffit pas à obtenir du vrai retina.
  const context = await browser.newContext({
    storageState: authFile,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })

  for (const key of keys) {
    if (!TARGETS[key]) continue
    await captureOne(context, key, TARGETS[key])
  }

  await browser.close()
  console.log('\n🎉 Terminé. Vérifie les images dans public/images/dashboard/ avant de commit.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
