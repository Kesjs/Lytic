import { useState } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'
import { GrainGradientShader } from '~/components/shared/grain-gradient-shader'

export const Route = createFileRoute('/signup')({
  beforeLoad: ({ context }) => {
    if (context.user) throw redirect({ to: '/dashboard' })
  },
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    // Selon la config Supabase (confirmation email requise ou non),
    // signUp() renvoie soit une session directe, soit aucune session.
    if (data.session) {
      navigate({ to: '/dashboard' })
    } else {
      setCheckEmail(true)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      <GrainGradientShader className="opacity-40" />

      {checkEmail ? (
        <div className="relative z-10 w-full max-w-sm space-y-3 rounded-lg border border-border bg-surface/90 p-8 text-center backdrop-blur">
          <h1 className="text-lg font-semibold text-ink-primary">Vérifiez vos emails</h1>
          <p className="text-sm text-ink-secondary">
            Un lien de confirmation a été envoyé à <span className="text-ink-primary">{email}</span>.
            Cliquez dessus pour activer votre compte, puis connectez-vous.
          </p>
          <Link to="/login" className="inline-block text-sm text-brand-text hover:underline">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="relative z-10 w-full max-w-sm space-y-5 rounded-lg border border-border bg-surface/90 p-8 backdrop-blur"
        >
          <div>
            <h1 className="text-xl font-semibold text-ink-primary">Créer un compte Reflet</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              Suivez la visibilité de votre marque dans les réponses IA.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-secondary">Nom</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand"
                placeholder="Ken Babatounde"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-secondary">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand"
                placeholder="vous@entreprise.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-secondary">
                Mot de passe
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand"
                placeholder="8 caractères minimum"
              />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>

          <p className="text-center text-xs text-ink-secondary">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-brand-text hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      )}
    </div>
  )
}
