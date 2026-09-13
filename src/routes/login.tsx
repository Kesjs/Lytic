import { useState, useEffect } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Lock, ArrowRight } from 'lucide-react'
import { GrainGradientShader } from '~/components/shared/grain-gradient-shader'
import { OtpInput } from '~/components/shared/otp-input'
import { Toaster, toast } from 'sonner'
import { cn } from '~/lib/utils'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'

type AuthMode = 'otp-email' | 'otp-code' | 'password' | 'register' | 'forgot'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { mode?: AuthMode } => ({
    mode: search.mode as AuthMode,
  }),
  beforeLoad: ({ context }) => {
    if (context.user) throw redirect({ to: '/dashboard' })
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [mode, setMode] = useState<AuthMode>(search.mode || 'otp-email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [otpError, setOtpError] = useState(false)
  const [otpSuccess, setOtpSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  // Timer renvoi OTP
  useEffect(() => {
    if (resendTimer <= 0) return
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!email) {
      toast.error('Veuillez saisir votre adresse email')
      return
    }
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      })
      if (error) throw error
      setMode('otp-code')
      setResendTimer(60)
      toast.success(`Code envoyé à ${email}`)
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'envoi du code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpComplete = async (code: string) => {
    setIsLoading(true)
    setOtpError(false)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      })
      if (error) throw error
      setOtpSuccess(true)
      toast.success('Connexion réussie ! Redirection...')
      setTimeout(() => {
        navigate({ to: '/dashboard' })
      }, 700)
    } catch (err: any) {
      setOtpError(true)
      setTimeout(() => setOtpError(false), 1000)
      toast.error(err?.message || 'Code incorrect')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Veuillez renseigner tous les champs')
      return
    }
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      toast.success('Connexion réussie !')
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      toast.error(err?.message || 'Email ou mot de passe incorrect')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Veuillez renseigner votre email et mot de passe')
      return
    }
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (error) throw error
      toast.success('Compte créé ! Vérifiez votre boîte mail pour confirmer votre inscription.')
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Veuillez renseigner votre email')
      return
    }
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      toast.success('Un lien de réinitialisation vous a été envoyé par email')
      setMode('password')
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'envoi de la réinitialisation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090e1a] p-4 text-white select-none sm:p-6">
      <Toaster theme="dark" position="top-center" richColors />

      {/* Dynamic Background Shader & Meshes */}
      <GrainGradientShader className="opacity-70" />
      <div className="absolute inset-0 bg-[#090e1a]/80 backdrop-blur-[60px]" />

      {/* Back to Home Button */}
      <div className="absolute left-6 top-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3.5 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Accueil</span>
        </Link>
      </div>

      {/* Main Auth Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[440px] rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/90 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-8"
      >
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#3758f9] to-blue-700 text-xl font-black text-white shadow-lg shadow-blue-600/30 mb-4">
            R
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {mode === 'otp-email' && 'Connexion à Reflet'}
            {mode === 'otp-code' && 'Vérification sécurisée'}
            {mode === 'password' && 'Connexion par mot de passe'}
            {mode === 'register' && 'Créer un compte Reflet'}
            {mode === 'forgot' && 'Mot de passe oublié'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {mode === 'otp-email' && 'Accédez instantanément à vos métriques sans mot de passe'}
            {mode === 'otp-code' && `Entrez le code à 6 chiffres envoyé à ${email}`}
            {mode === 'password' && 'Entrez vos identifiants pour continuer'}
            {mode === 'register' && 'Lancez votre suivi de visibilité IA en 30 secondes'}
            {mode === 'forgot' && 'Entrez votre email pour recevoir les instructions'}
          </p>
        </div>

        {/* Auth Mode Switcher (OTP vs Password) */}
        {(mode === 'otp-email' || mode === 'password') && (
          <div className="mb-6 grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-900/80 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('otp-email')}
              className={cn(
                'rounded-lg py-2 transition-all',
                mode === 'otp-email'
                  ? 'bg-[#3758f9] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Code magique (OTP)
            </button>
            <button
              type="button"
              onClick={() => setMode('password')}
              className={cn(
                'rounded-lg py-2 transition-all',
                mode === 'password'
                  ? 'bg-[#3758f9] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Mot de passe
            </button>
          </div>
        )}

        {/* MODE: OTP EMAIL */}
        {mode === 'otp-email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-[#3758f9] focus:outline-none focus:ring-2 focus:ring-[#3758f9]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3758f9] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-[#2e49d6] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <span>Recevoir le code</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <span className="text-xs text-slate-400">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-medium text-[#3758f9] hover:underline"
                >
                  S'inscrire
                </button>
              </span>
            </div>
          </form>
        )}

        {/* MODE: OTP CODE VERIFICATION */}
        {mode === 'otp-code' && (
          <div className="space-y-6">
            <div className="py-2">
              <OtpInput
                length={6}
                onComplete={handleOtpComplete}
                error={otpError}
                success={otpSuccess}
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                disabled={resendTimer > 0 || isLoading}
                onClick={() => handleSendOtp()}
                className="text-xs text-slate-400 transition-colors hover:text-white disabled:opacity-50"
              >
                {resendTimer > 0
                  ? `Renvoyer le code dans ${resendTimer}s`
                  : 'Renvoyer un nouveau code'}
              </button>

              <button
                type="button"
                onClick={() => setMode('otp-email')}
                className="text-xs text-[#3758f9] hover:underline"
              >
                Changer d'adresse email
              </button>
            </div>
          </div>
        )}

        {/* MODE: PASSWORD LOGIN */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-[#3758f9] focus:outline-none focus:ring-2 focus:ring-[#3758f9]/20"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-[#3758f9] hover:underline"
                >
                  Oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-[#3758f9] focus:outline-none focus:ring-2 focus:ring-[#3758f9]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3758f9] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-[#2e49d6] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <span className="text-xs text-slate-400">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-medium text-[#3758f9] hover:underline"
                >
                  S'inscrire
                </button>
              </span>
            </div>
          </form>
        )}

        {/* MODE: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Nom complet
              </label>
              <input
                type="text"
                placeholder="Alex Martin"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-all focus:border-[#3758f9] focus:outline-none focus:ring-2 focus:ring-[#3758f9]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-[#3758f9] focus:outline-none focus:ring-2 focus:ring-[#3758f9]/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-[#3758f9] focus:outline-none focus:ring-2 focus:ring-[#3758f9]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3758f9] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-[#2e49d6] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <span>Créer mon compte</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <span className="text-xs text-slate-400">
                Déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('otp-email')}
                  className="font-medium text-[#3758f9] hover:underline"
                >
                  Se connecter
                </button>
              </span>
            </div>
          </form>
        )}

        {/* MODE: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Votre e-mail de récupération
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-[#3758f9] focus:outline-none focus:ring-2 focus:ring-[#3758f9]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3758f9] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-[#2e49d6] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <span>Envoyer le lien de réinitialisation</span>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setMode('password')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Retour à la connexion
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}
