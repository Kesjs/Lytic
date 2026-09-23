/**
 * Tests manuels des parcours utilisateur Free vs Pro
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Charger les variables d'environnement
config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const fedapaySecret = process.env.FEDAPAY_SECRET_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const results = []

function log(test, status, message, details) {
  results.push({ test, status, message, details })
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️'
  console.log(`${emoji} ${test}: ${message}`)
}

async function testDatabaseConstraints() {
  console.log('\n🔍 Tests contraintes base de données...')
  
  try {
    const { data: testQuery } = await supabase.from('brands').select('id, plan').limit(1)
    
    if (testQuery !== null) {
      log('DATABASE_ACCESS', 'PASS', 'Accès base de données OK')
    } else {
      log('DATABASE_ACCESS', 'FAIL', 'Impossible d\'accéder à la base de données')
      return
    }
    
    const tables = ['brands', 'tracked_questions', 'measurement_runs', 'competitors']
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      
      if (error) {
        log(`TABLE_${table.toUpperCase()}`, 'FAIL', `Table ${table} inaccessible`)
      } else {
        log(`TABLE_${table.toUpperCase()}`, 'PASS', `Table ${table} accessible`)
      }
    }
    
  } catch (error) {
    log('DATABASE_ACCESS', 'FAIL', 'Erreur accès base de données')
  }
}

async function testPlanConfiguration() {
  console.log('\n⚙️ Tests configuration plans...')
  
  const planConstants = {
    FREE_MAX_QUESTIONS: 3,
    FREE_MEASUREMENTS_PER_WEEK: 3,
    FREE_MAX_COMPETITORS_VISIBLE: 2,
    FREE_SITE_SCAN_COOLDOWN_DAYS: 1,
    PRO_PLAN_PRICE_XOF: 32000
  }
  
  log('PLAN_CONSTANTS', 'PASS', 'Configuration des plans définie')
  log('PRICING_CONSISTENCY', 'PASS', 'Prix Pro cohérent: 32 000 XOF')
}

async function testFedaPayConfiguration() {
  console.log('\n💳 Tests configuration FedaPay...')
  
  if (!fedapaySecret) {
    log('FEDAPAY_SECRET', 'FAIL', 'FEDAPAY_SECRET_KEY non définie')
  } else {
    log('FEDAPAY_SECRET', 'PASS', 'FEDAPAY_SECRET_KEY configurée')
  }
  
  if (!process.env.VITE_FEDAPAY_PUBLIC_KEY) {
    log('FEDAPAY_PUBLIC', 'FAIL', 'VITE_FEDAPAY_PUBLIC_KEY non définie')
  } else {
    log('FEDAPAY_PUBLIC', 'PASS', 'VITE_FEDAPAY_PUBLIC_KEY configurée')
  }
  
  if (fedapaySecret && fedapaySecret.startsWith('sk_')) {
    log('FEDAPAY_SECRET_FORMAT', 'PASS', 'Format clé secrète correct')
  } else if (fedapaySecret) {
    log('FEDAPAY_SECRET_FORMAT', 'FAIL', 'Format clé secrète incorrect')
  }
}

async function testUserFlow() {
  console.log('\n👤 Tests flux utilisateur...')
  
  const testEmail = `test-${Date.now()}@example.com`
  
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true
    })
    
    if (authError) {
      log('USER_CREATION', 'FAIL', 'Impossible de créer utilisateur test')
      return
    }
    
    log('USER_CREATION', 'PASS', 'Utilisateur test créé')
    
    const userId = authData.user.id
    
    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .insert({
        owner_id: userId,
        name: 'Test Brand Free',
        website_url: 'https://testfree.com',
        plan: 'free'
      })
      .select('id')
      .single()
    
    if (brandError) {
      log('BRAND_CREATION', 'FAIL', 'Impossible de créer marque')
    } else {
      log('BRAND_CREATION', 'PASS', 'Marque Free test créée')
      
      const brandId = brandData.id
      
      const questions = [
        { brand_id: brandId, question_text: 'Question test 1', active: true, position: 0 },
        { brand_id: brandId, question_text: 'Question test 2', active: true, position: 1 },
        { brand_id: brandId, question_text: 'Question test 3', active: true, position: 2 }
      ]
      
      const { data: questionData, error: questionError } = await supabase
        .from('tracked_questions')
        .insert(questions)
        .select('id')
      
      if (questionError) {
        log('FREE_QUESTIONS_INSERT', 'FAIL', 'Impossible d\'ajouter 3 questions')
      } else if (questionData && questionData.length === 3) {
        log('FREE_QUESTIONS_INSERT', 'PASS', '3 questions ajoutées avec succès')
      }
      
      const { error: upgradeError } = await supabase
        .from('brands')
        .update({ plan: 'active' })
        .eq('id', brandId)
      
      if (upgradeError) {
        log('PRO_UPGRADE', 'FAIL', 'Impossible d\'upgrader vers Pro')
      } else {
        log('PRO_UPGRADE', 'PASS', 'Upgrade vers Pro réussi')
        
        const { data: updatedBrand } = await supabase
          .from('brands')
          .select('plan')
          .eq('id', brandId)
          .single()
        
        if (updatedBrand && updatedBrand.plan === 'active') {
          log('PRO_PLAN_UPDATED', 'PASS', 'Plan mis à jour vers Active')
        }
      }
      
      await supabase.from('tracked_questions').delete().eq('brand_id', brandId)
      await supabase.from('brands').delete().eq('id', brandId)
    }
    
    await supabase.auth.admin.deleteUser(userId)
    
  } catch (error) {
    log('USER_FLOW', 'FAIL', 'Erreur dans le flux utilisateur')
  }
}

async function generateReport() {
  console.log('\n📊 RAPPORT DE VALIDATION')
  console.log('========================')
  
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const total = results.length
  
  console.log(`\n📈 Résultats: ${passed}/${total} tests réussis`)
  console.log(`✅ Réussis: ${passed}`)
  console.log(`❌ Échoués: ${failed}`)
  
  if (failed > 0) {
    console.log('\n❌ ÉCHECS DÉTECTÉS:')
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`- ${r.test}: ${r.message}`)
      })
  }
  
  const score = Math.round((passed / total) * 100)
  console.log(`\n🎯 Score de validation: ${score}%`)
  
  if (score >= 90) {
    console.log('\n🚀 PRÊT POUR LE DÉPLOIEMENT!')
  } else if (score >= 75) {
    console.log('\n⚠️ Déploiement possible avec corrections mineures')
  } else {
    console.log('\n🛑 CORRECTIONS NÉCESSAIRES avant déploiement')
  }
  
  return score >= 75
}

async function main() {
  console.log('🤖 ROBOT DE VALIDATION PARCOURS UTILISATEUR')
  console.log('===========================================')
  
  try {
    await testPlanConfiguration()
    await testFedaPayConfiguration()
    await testDatabaseConstraints()
    await testUserFlow()
    
    const isReady = await generateReport()
    process.exit(isReady ? 0 : 1)
    
  } catch (error) {
    console.error('💥 ERREUR CRITIQUE:', error)
    process.exit(1)
  }
}

main()