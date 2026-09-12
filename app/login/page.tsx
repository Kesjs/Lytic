'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Mail, Lock, Sparkles, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react'
import { GrainGradientShader } from '@/components/auth/grain-gradient-shader'
import { OtpInput } from '@/components/auth/otp-input'
import { Toaster, toast } from 'sonner'
import { cn } from '@/lib/utils'

type AuthMode = 'otp-email' | 'otp-code' | 'password' | 'register' | 'forgot'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('otp-email')
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
      await new Promise((r) => setTimeout(r, 600))
      setMode('otp-code')
      setResendTimer(30)
      toast.success(`Code envoyé à ${email}`)
    } catch {
      toast.error("Erreur lors de l'envoi du code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpComplete = async (code: string) => {
    setIsLoading(true)
    setOtpError(false)
    try {
      await new Promise((r) => setTimeout(r, 600))
      setOtpSuccess(true)
      toast.success('Connexion réussie ! Redirection vers le tableau de bord...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 700)
    } catch {
      setOtpError(true)
      setTimeout(() => setOtpError(false), 1000)
      toast.error('Code incorrect')
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
      await new Promise((r) => setTimeout(r, 600))
      toast.success('Connexion réussie !')
      router.push('/dashboard')
    } catch {
      toast.error('Email ou mot de passe incorrect')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Veuillez renseigner votre email')
      return
    }
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      setMode('otp-code')
      setResendTimer(30)
      toast.success('Code de vérification envoyé à votre email')
    } catch {
      toast.error("Erreur lors de l'inscription")
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
      await new Promise((r) => setTimeout(r, 600))
      toast.success('Un lien de réinitialisation vous a été envoyé par email')
      setMode('password')
    } catch {
      toast.error("Erreur lors de l'envoi de la réinitialisation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 bg-[#090e1a] text-white overflow-hidden select-none">
      <Toaster theme="dark" position="top-center" richColors />

      {/* Dynamic Background Shader & Meshes */}
      <GrainGradientShader className="opacity-70" />
      <div className="absolute inset-0 bg-[#090e1a]/80 backdrop-blur-[60px]" />

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-700/60 bg-slate-900/60 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tableau de bord</span>
        </Link>
      </div>

      {/* Main Auth Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[440px] rounded-2xl border border-slate-800/80 bg-[#0d1322]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-blue-950/20"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#3758f9] to-blue-700 text-white font-black text-xl mb-4 shadow-lg shadow-blue-600/30">
            L
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {mode === 'otp-email' && 'Connexion à Lytic'}
            {mode === 'otp-code' && 'Vérification sécurisée'}
            {mode === 'password' && 'Connexion par mot de passe'}
            {mode === 'register' && 'Créer un compte Lytic'}
            {mode === 'forgot' && 'Mot de passe oublié'}
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            {mode === 'otp-email' && 'Accédez instantanément à vos métriques sans mot de passe'}
            {mode === 'otp-code' && `Entrez le code à 6 chiffres envoyé à ${email}`}
            {mode === 'password' && 'Entrez vos identifiants pour continuer'}
            {mode === 'register' && 'Lancez votre suivi analytique en 30 secondes'}
            {mode === 'forgot' && 'Entrez votre email pour recevoir les instructions'}
          </p>
        </div>

        {/* Auth Mode Switcher (OTP vs Password) */}
        {(mode === 'otp-email' || mode === 'password') && (
          <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('otp-email')}
              className={cn(
                'py-2 rounded-lg transition-all',
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
                'py-2 rounded-lg transition-all',
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#3758f9] focus:ring-2 focus:ring-[#3758f9]/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#3758f9] hover:bg-[#2e49d6] text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Recevoir le code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <span className="text-xs text-slate-400">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-[#3758f9] font-medium hover:underline"
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
                className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#3758f9] focus:ring-2 focus:ring-[#3758f9]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
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
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#3758f9] focus:ring-2 focus:ring-[#3758f9]/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#3758f9] hover:bg-[#2e49d6] text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <span className="text-xs text-slate-400">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-[#3758f9] font-medium hover:underline"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                placeholder="Alex Martin"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#3758f9] focus:ring-2 focus:ring-[#3758f9]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#3758f9] focus:ring-2 focus:ring-[#3758f9]/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#3758f9] hover:bg-[#2e49d6] text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Créer mon compte</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <span className="text-xs text-slate-400">
                Déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('otp-email')}
                  className="text-[#3758f9] font-medium hover:underline"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Votre e-mail de récupération
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#3758f9] focus:ring-2 focus:ring-[#3758f9]/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#3758f9] hover:bg-[#2e49d6] text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
