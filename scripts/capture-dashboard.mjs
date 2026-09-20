import { chromium } from 'playwright'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const authFile = path.resolve(process.cwd(), '.auth/user.json')
const isSetupMode = process.argv.includes('--setup')

;(async () => {
  console.log('🚀 Démarrage du navigateur (une fenêtre Edge va s\'ouvrir)...')
  const browser = await chromium.launch({ channel: 'msedge', headless: false })
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 },
    deviceScaleFactor: 2,
    colorScheme: 'dark'
  })

  const page = await context.newPage()

  try {
    console.log('✅ Navigation vers l\'accueil du dashboard...')
    await page.goto('http://localhost:3001/dashboard')

    console.log('⚠️ ATTENTION : Vous avez 40 secondes pour vous connecter si la page de connexion s\'affiche.')
    console.log('⏳ Attente (40 secondes)...')
    await page.waitForTimeout(40000)

    await page.addStyleTag({ content: 'body { overflow: hidden !important; }' })

    const outputPath = path.resolve(process.cwd(), 'public/images/dashboard/overview.png')
    
    console.log('URL actuelle au moment de la capture:', page.url())
    console.log('📸 Capture d\'écran en cours...')
    await page.screenshot({ path: outputPath, fullPage: false })

    console.log(`✨ Succès ! Capture enregistrée dans : ${outputPath}`)
    
  } catch (err) {
    console.error('❌ Erreur lors de la capture :', err)
  } finally {
    await browser.close()
  }
})()
