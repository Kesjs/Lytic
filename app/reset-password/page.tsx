'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { GrainGradientShader } from '@/components/auth/grain-gradient-shader'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [linkExpired, setLinkExpired] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || password !== confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 700))
      setIsSuccess(true)
      toast.success('Mot de passe mis à jour avec succès !')
      setTimeout(() => router.push('/login'), 1200)
    } catch {
      toast.error('Erreur lors de la mise à jour du mot de passe')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 bg-[#090e1a] text-white overflow-hidden select-none">
      <Toaster theme="dark" position="top-center" richColors />
      <GrainGradientShader className="opacity-70" />
      <div className="absolute inset-0 bg-[#090e1a]/80 backdrop-blur-[60px]" />

      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-700/60 bg-slate-900/60 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Connexion</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[420px] rounded-2xl border border-slate-800/80 bg-[#0d1322]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-blue-950/20"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#3758f9] to-blue-700 text-white font-black text-xl mb-4 shadow-lg shadow-blue-600/30">
            L
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Réinitialiser votre mot de passe
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Choisissez un nouveau mot de passe sécurisé pour votre compte Lytic
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-300">Votre mot de passe a été réinitialisé.</p>
            <p className="text-xs text-slate-500">Redirection vers la page de connexion...</p>
          </div>
        ) : linkExpired ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-300">Ce lien de réinitialisation a expiré ou est invalide.</p>
            <Link
              href="/login"
              className="inline-block mt-2 text-xs font-semibold text-[#3758f9] hover:underline"
            >
              Demander un nouveau lien
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#3758f9] focus:ring-2 focus:ring-[#3758f9]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Confirmez le mot de passe"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                <span>Mettre à jour le mot de passe</span>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
