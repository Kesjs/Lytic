import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'
import { signUpWithGuard } from '~/lib/queries/auth'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { GrainGradientShader } from '~/components/shared/grain-gradient-shader'
import { OtpInput } from '~/components/auth/otp-input'
import { toast } from 'sonner'
import { cn } from '~/lib/utils'
import logoUrl from '~/assets/reflet-horizontal-dark.svg'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { mode?: AuthMode; tab?: AuthMode } => ({
    mode: (search.mode || search.tab) as AuthMode | undefined,
  }),
  component: LoginPage,
})

// Modes du formulaire
type AuthMode = 'otp-email' | 'otp-code' | 'password' | 'register' | 'forgot'

function LoginPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const initialMode = (search.mode || search.tab || 'otp-email') as AuthMode
  const [mode, setMode] = useState<AuthMode>(initialMode)

  useEffect(() => {
    if (search.mode) setMode(search.mode)
  }, [search.mode])

  // Si l'utilisateur est déjà connecté dans ce navigateur, aller directement au dashboard
  const [checkingSession, setCheckingSession] = useState(true)
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        window.location.href = '/dashboard'
      } else {
        setCheckingSession(false)
      }
    }).catch(() => {
      setCheckingSession(false)
    })
  }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpError, setOtpError] = useState(false)
  const [otpSuccess, setOtpSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [isBackHovered, setIsBackHovered] = useState(false)

  // Timer renvoi OTP
  useEffect(() => {
    if (resendTimer <= 0) return
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

  const handleSendOtp = async () => {
    if (!email) {
      toast.error('Veuillez entrer votre adresse email')
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
      setResendTimer(30)
      toast.success('Code envoyé à ' + email)
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
      toast.success('Connexion réussie')
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 500)
    } catch (err: any) {
      setOtpError(true)
      setTimeout(() => setOtpError(false), 1000)
      toast.error(err?.message || 'Code incorrect')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('Connexion réussie')
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 300)
    } catch (err: any) {
      if (err?.message === 'Invalid login credentials') {
        toast.error('Email ou mot de passe incorrect')
      } else {
        toast.error(err?.message || 'Email ou mot de passe incorrect')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!email) {
      toast.error('Veuillez renseigner votre adresse email')
      return
    }
    setIsLoading(true)
    try {
      await signUpWithGuard({ data: { email, password: password || '' } })
      toast.success('Compte créé ! Vérifiez vos emails pour valider votre inscription.')
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Veuillez entrer votre adresse email')
      return
    }
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      })
      if (error) throw error
      toast.success('Email de réinitialisation envoyé')
      setMode('otp-email')
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'envoi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard' },
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err?.message || 'Connexion Google indisponible')
    }
  }

  const handleResend = () => {
    if (resendTimer > 0) return
    handleSendOtp()
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="size-7 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-xs text-ink-muted">Accès à votre espace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Layout split-screen */}
      <div className="grid lg:grid-cols-[1.02fr_0.98fr] min-h-screen">

        {/* Panneau gauche — Shader + contenu */}
        <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
          {/* Shader GrainGradient */}
          <GrainGradientShader />

          {/* Overlay lisibilité */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/60"
            aria-hidden="true"
          />

          {/* Bouton retour / Logo morphing */}
          <div className="relative z-10">
            <Link to="/"
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
              onMouseEnter={() => setIsBackHovered(true)}
              onMouseLeave={() => setIsBackHovered(false)}
            >
              <motion.div
                animate={{ x: isBackHovered ? -3 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <ArrowLeft className="w-4 h-4" />
              </motion.div>

              <AnimatePresence mode="wait" initial={false}>
                {!isBackHovered ? (
                  <motion.span
                    key="text"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                  >
                    Retour
                  </motion.span>
                ) : (
                  <motion.div
                    key="logo"
                    initial={{ opacity: 0, scale: 0.85, y: 3 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -3 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  >
                    <img src={logoUrl} alt="Reflet" className="h-8" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* Contenu bas panneau gauche */}
          <div className="relative z-10 space-y-4">
            <h1 className="text-4xl font-semibold text-white leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Mesurez votre<br />visibilité dans ChatGPT.
            </h1>
            <p className="text-zinc-400 text-base max-w-sm leading-relaxed">
              Reflet analyse comment votre marque apparaît dans les réponses générées par l'IA —&nbsp;et vous montre pourquoi.
            </p>
          </div>
        </div>

        {/* Panneau droit — Formulaire */}
        <div className="flex items-center justify-center p-8 bg-zinc-950 min-h-screen">
          <div className="w-full max-w-sm space-y-8">

            {/* Mobile : bouton retour */}
            <div className="lg:hidden">
              <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>
            </div>

            <AnimatePresence mode="wait">
              {mode === 'otp-email' && (
                <FormPanel key="otp-email">
                  <FormHeader
                    title="Se connecter"
                    subtitle="Entrez votre email pour recevoir un code de connexion"
                  />
                  <GoogleButton onClick={handleGoogleAuth} />
                  <Divider />
                  <div className="space-y-4">
                    <InputField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="vous@exemple.fr"
                      onEnter={handleSendOtp}
                    />
                    <PrimaryButton onClick={handleSendOtp} loading={isLoading}>
                      Se connecter
                    </PrimaryButton>
                  </div>
                  <div className="space-y-2 text-center">
                    <button
                      onClick={() => setMode('password')}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Vous préférez un mot de passe ? → Utiliser mot de passe
                    </button>
                    <br />
                    <button
                      onClick={() => setMode('register')}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Pas encore de compte ? → Créer un compte
                    </button>
                  </div>
                </FormPanel>
              )}

              {mode === 'otp-code' && (
                <FormPanel key="otp-code">
                  <FormHeader
                    title="Vérification"
                    subtitle={
                      <>
                        Code envoyé à{' '}
                        <button
                          className="text-white underline underline-offset-2"
                          onClick={() => setMode('otp-email')}
                        >
                          {email}
                        </button>
                        {' '}—{' '}
                        <button
                          className="text-zinc-500 hover:text-zinc-300 transition-colors"
                          onClick={() => setMode('otp-email')}
                        >
                          Modifier
                        </button>
                      </>
                    }
                  />
                  <OtpInput
                    onComplete={handleOtpComplete}
                    error={otpError}
                    success={otpSuccess}
                    disabled={isLoading || otpSuccess}
                  />
                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <span className="text-sm text-zinc-500">
                        Renvoyer dans 00:{String(resendTimer).padStart(2, '0')}
                      </span>
                    ) : (
                      <button
                        onClick={handleResend}
                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                      >
                        Renvoyer le code
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setMode('password')}
                    className="w-full text-sm text-zinc-500 hover:text-zinc-300 text-center transition-colors"
                  >
                    ← Retour à la connexion par mot de passe
                  </button>
                </FormPanel>
              )}

              {mode === 'password' && (
                <FormPanel key="password">
                  <FormHeader
                    title="Se connecter"
                    subtitle="Connexion avec votre mot de passe"
                  />
                  <GoogleButton onClick={handleGoogleAuth} />
                  <Divider />
                  <div className="space-y-4">
                    <InputField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="vous@exemple.fr"
                    />
                    <InputField
                      label="Mot de passe"
                      type="password"
                      value={password}
                      onChange={setPassword}
                      placeholder="••••••••"
                      onEnter={handlePasswordLogin}
                    />
                    <div className="text-right">
                      <button
                        onClick={() => setMode('forgot')}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <PrimaryButton onClick={handlePasswordLogin} loading={isLoading}>
                      Se connecter
                    </PrimaryButton>
                  </div>
                  <div className="space-y-2 text-center">
                    <button
                      onClick={() => setMode('otp-email')}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Préférez un code par email ? → Utiliser OTP
                    </button>
                    <br />
                    <button
                      onClick={() => setMode('register')}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Pas encore de compte ? → Créer un compte
                    </button>
                  </div>
                </FormPanel>
              )}

              {mode === 'register' && (
                <FormPanel key="register">
                  <FormHeader
                    title="Créer un compte"
                    subtitle="Commencez à mesurer votre visibilité dans ChatGPT"
                  />
                  <GoogleButton onClick={handleGoogleAuth} />
                  <Divider />
                  <div className="space-y-4">
                    <InputField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="vous@exemple.fr"
                      onEnter={handleRegister}
                    />
                    <PrimaryButton onClick={handleRegister} loading={isLoading}>
                      Créer mon compte
                    </PrimaryButton>
                  </div>
                  <p className="text-xs text-zinc-600 text-center">
                    Un code de confirmation vous sera envoyé par email
                  </p>
                  <button
                    onClick={() => setMode('otp-email')}
                    className="w-full text-sm text-zinc-500 hover:text-zinc-300 text-center transition-colors"
                  >
                    Déjà un compte ? → Se connecter
                  </button>
                </FormPanel>
              )}

              {mode === 'forgot' && (
                <FormPanel key="forgot">
                  <FormHeader
                    title="Mot de passe oublié"
                    subtitle="Entrez votre email pour recevoir un lien de réinitialisation"
                  />
                  <div className="space-y-4">
                    <InputField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="vous@exemple.fr"
                      onEnter={handleForgotPassword}
                    />
                    <PrimaryButton onClick={handleForgotPassword} loading={isLoading}>
                      Envoyer le lien
                    </PrimaryButton>
                  </div>
                  <button
                    onClick={() => setMode('otp-email')}
                    className="w-full text-sm text-zinc-500 hover:text-zinc-300 text-center transition-colors"
                  >
                    ← Retour à la connexion
                  </button>
                </FormPanel>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sous-composants ───────────────────────────────────────────────────────────

function FormPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  )
}

function FormHeader({ title, subtitle }: { title: string; subtitle: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <p className="text-sm text-zinc-500 leading-relaxed">{subtitle}</p>
    </div>
  )
}

function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-white/10 bg-white/5 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Continuer avec Google
    </button>
  )
}

function Divider() {
  return (
    <div className="relative flex items-center gap-3">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-xs text-zinc-600">ou</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  )
}

function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  onEnter,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  onEnter?: () => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter() }}
          className="w-full h-11 px-4 pr-10 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/25 transition-colors"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand hover:opacity-80 transition-opacity"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

function PrimaryButton({
  children,
  onClick,
  loading,
}: {
  children: React.ReactNode
  onClick: () => void
  loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'w-full h-11 rounded-lg text-sm font-semibold transition-colors',
        'bg-[#c9ab1e] text-[#0b0b0b] hover:bg-[#b89a18]',
        loading && 'opacity-60 cursor-not-allowed',
      )}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Chargement…
        </span>
      ) : children}
    </button>
  )
}
