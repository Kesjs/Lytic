import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function createTestUser(): Promise<{ email: string; password: string; userId: string }> {
  const timestamp = Date.now()
  const email = `test-user-${timestamp}@example.com`
  const password = 'testpassword123'

  // Créer l'utilisateur via l'API admin
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirmer pour les tests
  })

  if (authError) {
    throw new Error(`Failed to create test user: ${authError.message}`)
  }

  const userId = authData.user.id

  // Créer le profil associé
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      email,
      full_name: `Test User ${timestamp}`,
      created_at: new Date().toISOString(),
    })

  if (profileError) {
    console.warn('Failed to create profile, but continuing:', profileError.message)
  }

  return { email, password, userId }
}

export async function deleteTestUser(userId: string): Promise<void> {
  try {
    // Supprimer le profil
    await supabaseAdmin.from('profiles').delete().eq('id', userId)
    
    // Supprimer l'utilisateur auth
    await supabaseAdmin.auth.admin.deleteUser(userId)
  } catch (error) {
    console.warn('Failed to cleanup test user:', error)
  }
}

export async function loginTestUser(page: any, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}