// Étape 1/2 de la capture du mockup hero — à lancer UNE SEULE FOIS (ou
// chaque fois que la session expire).
//
// Ouvre un vrai navigateur (headed, visible à l'écran) sur /login. Connecte-
// toi normalement (OTP par email, comme d'habitude). Une fois arrivé sur le
// dashboard, reviens dans le terminal et appuie sur Entrée : la session est
// alors sauvegardée dans .playwright/auth/demo.json, réutilisée ensuite par
// capture-hero-screenshot.mjs sans avoir à se reconnecter à chaque fois.
//
// Usage : npm run capture:auth
// (nécessite `npm run dev` lancé dans un autre terminal, sur le port 3001)

import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const authFile = join(__dirname, '..', '.playwright', 'auth', 'demo.json')
const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001'

async function main() {
  mkdirSync(dirname(authFile), { recursive: true })

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`${baseUrl}/login`)

  console.log('\n👉 Connecte-toi normalement dans la fenêtre qui vient de s\'ouvrir.')
  console.log('   Une fois arrivé sur le dashboard, reviens ici et appuie sur Entrée.\n')

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  await rl.question('Appuie sur Entrée quand tu es connecté... ')
  rl.close()

  await context.storageState({ path: authFile })
  console.log(`\n✅ Session sauvegardée dans ${authFile}`)
  console.log('   Tu peux maintenant lancer : npm run capture:hero\n')

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
