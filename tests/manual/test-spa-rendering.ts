/**
 * Script de validation B1 - Fiabilité du rendu JS (SPA)
 * 
 * Test sur 5-6 vrais sites de PME françaises pour vérifier que :
 * 1. Les SPA sont correctement détectés
 * 2. Le rendu headless fonctionne
 * 3. Le contenu extrait est exploitable (title, h1, body non vide)
 * 
 * Usage : node --loader tsx tests/manual/test-spa-rendering.ts
 */

import { fetchPage } from '../../src/lib/crawler/fetch'
import { sanitizeHtml } from '../../src/lib/crawler/sanitize'
import { extractContent } from '../../src/lib/crawler/extract'

// Sites de test : mix de SPA/SSR, PME françaises réelles
const TEST_URLS = [
  'https://www.doctolib.fr', // SPA (React)
  'https://www.qonto.com/fr', // Probablement SSR moderne
  'https://www.payfit.com/fr', // SPA
  'https://www.shine.fr', // SPA probable
  'https://www.legalstart.fr', // À tester
  'https://www.swile.co', // À tester
]

interface TestResult {
  url: string
  isSPA: boolean
  spaRenderFailed: boolean
  hasTitle: boolean
  hasH1: boolean
  bodyLength: number
  extractionOk: boolean
  error?: string
}

async function testSite(url: string): Promise<TestResult> {
  try {
    console.log(`\n🔍 Test de ${url}...`)
    
    const fetchResult = await fetchPage(url)
    console.log(`  - SPA détecté: ${fetchResult.isSPA}`)
    console.log(`  - Rendu failed: ${fetchResult.spaRenderFailed}`)
    
    const sanitized = sanitizeHtml(fetchResult.html)
    const extracted = extractContent(sanitized)
    
    const hasTitle = !!extracted.title && extracted.title.length > 0
    const hasH1 = extracted.h1Count > 0
    const bodyLength = extracted.mainContent?.length || 0
    
    console.log(`  - Titre: ${hasTitle ? `✅ "${extracted.title}"` : '❌ Manquant'}`)
    console.log(`  - H1: ${hasH1 ? `✅ ${extracted.h1Count} trouvé(s)` : '❌ Aucun'}`)
    console.log(`  - Body: ${bodyLength > 0 ? `✅ ${bodyLength} caractères` : '❌ Vide'}`)
    
    const extractionOk = hasTitle && hasH1 && bodyLength > 100
    
    return {
      url,
      isSPA: fetchResult.isSPA,
      spaRenderFailed: fetchResult.spaRenderFailed,
      hasTitle,
      hasH1,
      bodyLength,
      extractionOk,
    }
  } catch (error) {
    console.error(`  ❌ Erreur: ${error}`)
    return {
      url,
      isSPA: false,
      spaRenderFailed: false,
      hasTitle: false,
      hasH1: false,
      bodyLength: 0,
      extractionOk: false,
      error: String(error),
    }
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════')
  console.log('Test B1 - Validation du rendu SPA')
  console.log('═══════════════════════════════════════════════════')
  
  const results: TestResult[] = []
  
  for (const url of TEST_URLS) {
    const result = await testSite(url)
    results.push(result)
  }
  
  console.log('\n═══════════════════════════════════════════════════')
  console.log('Résumé')
  console.log('═══════════════════════════════════════════════════')
  
  const spaCount = results.filter(r => r.isSPA).length
  const spaFailedCount = results.filter(r => r.spaRenderFailed).length
  const extractionOkCount = results.filter(r => r.extractionOk).length
  
  console.log(`\nTotal testé: ${results.length}`)
  console.log(`SPA détectés: ${spaCount}`)
  console.log(`SPA render failed: ${spaFailedCount}`)
  console.log(`Extraction OK: ${extractionOkCount}/${results.length}`)
  
  console.log('\nDétail par site:')
  results.forEach(r => {
    const status = r.extractionOk ? '✅' : '❌'
    const spaNote = r.isSPA ? ' [SPA]' : ''
    const failNote = r.spaRenderFailed ? ' [RENDER FAILED]' : ''
    console.log(`${status} ${r.url}${spaNote}${failNote}`)
    if (r.error) {
      console.log(`    Erreur: ${r.error}`)
    }
  })
  
  const failedSites = results.filter(r => !r.extractionOk)
  if (failedSites.length > 0) {
    console.log('\n⚠️  Sites en échec:')
    failedSites.forEach(r => {
      console.log(`\n${r.url}:`)
      if (!r.hasTitle) console.log('  - Titre manquant')
      if (!r.hasH1) console.log('  - H1 manquant')
      if (r.bodyLength < 100) console.log(`  - Body trop court (${r.bodyLength} caractères)`)
    })
  }
  
  console.log('\n═══════════════════════════════════════════════════')
  const success = extractionOkCount === results.length
  console.log(success ? '✅ Tous les tests passent' : '❌ Certains tests échouent')
  console.log('═══════════════════════════════════════════════════')
  
  process.exit(success ? 0 : 1)
}

runTests().catch(console.error)
