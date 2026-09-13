import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'
import { GrainGradientShader } from '~/components/shared/grain-gradient-shader'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoading(true)
    const supabase = getSupabaseBrowserClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    setTimeout(() => navigate({ to: '/login' }), 1500)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      <GrainGradientShader className="opacity-40" />

      <div className="relative z-10 w-full max-w-sm space-y-5 rounded-lg border border-border bg-surface/90 p-8 backdrop-blur">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Reflet</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Choisissez un nouveau mot de passe pour votre compte.
          </p>
        </div>

        {success ? (
          <div className="space-y-2 py-2 text-center">
            <p className="text-sm text-ink-primary">Mot de passe mis à jour.</p>
            <p className="text-xs text-ink-secondary">Redirection vers la connexion…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-secondary">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                className="w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-secondary">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirmez le mot de passe"
                className="w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
            </button>

            <p className="text-center text-xs text-ink-secondary">
              <Link to="/login" className="text-brand-text hover:underline">
                Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
