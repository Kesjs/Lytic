import { chromium } from 'playwright'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const authFile = path.resolve(process.cwd(), '.auth/user.json')
const isSetupMode = process.argv.includes('--setup')

;(async () => {
  // Mode configuration : on ouvre le navigateur pour que tu te connectes manuellement avec ton OTP
  if (isSetupMode) {
    console.log('🛠 Mode configuration : Ouverture du navigateur...')
    const browser = await chromium.launch({ headless: false })
    const context = await browser.newContext()
    const page = await context.newPage()
    
    console.log('👉 Va te connecter avec ton email et ton OTP.')
    await page.goto('http://localhost:3001/login')
    
    console.log('⏳ J\'attends que tu arrives sur le dashboard...')
    // On attend que l'URL change pour le dashboard, signifiant que tu as réussi à te connecter
    await page.waitForURL('**/dashboard**', { timeout: 0 })
    
    // On sauvegarde ta session (cookies, local storage)
    if (!fs.existsSync(path.dirname(authFile))) {
      fs.mkdirSync(path.dirname(authFile), { recursive: true })
    }
    await context.storageState({ path: authFile })
    console.log(`✅ Session sauvegardée avec succès dans ${authFile} ! Tu peux maintenant lancer 'npm run screenshot'`)
    
    await browser.close()
    return
  }

  // Mode capture : utilise la session sauvegardée
  if (!fs.existsSync(authFile)) {
    console.error('❌ Aucune session trouvée. Lance d\'abord : node scripts/capture-dashboard.mjs --setup')
    process.exit(1)
  }

  console.log('🚀 Démarrage de la capture en arrière-plan...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    storageState: authFile, // Récupère ta session connectée !
    viewport: { width: 1200, height: 800 },
    deviceScaleFactor: 2,
    colorScheme: 'dark'
  })

  const page = await context.newPage()

  try {
    console.log('✅ Navigation vers l\'accueil du dashboard...')
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle' })

    console.log('⏳ Attente du rendu des graphiques (3 secondes)...')
    await page.waitForTimeout(3000)

    await page.addStyleTag({ content: 'body { overflow: hidden !important; }' })

    const outputPath = path.resolve(process.cwd(), 'public/images/dashboard/overview.png')
    
    console.log('📸 Capture d\'écran en cours...')
    await page.screenshot({ path: outputPath, fullPage: false })

    console.log(`✨ Succès ! Capture enregistrée dans : ${outputPath}`)
    
  } catch (err) {
    console.error('❌ Erreur lors de la capture :', err)
  } finally {
    await browser.close()
  }
})()
