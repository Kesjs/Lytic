import { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { X, Trash2, Globe, Plus, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  createBrandWithQuestions,
  createBrandDraft,
  addInitialQuestions,
  getBrandPlan,
  generateQuestionsWithAI,
} from '~/lib/queries/settings'
import { createCheckoutSession } from '~/lib/billing'
import { useFedaPayScript } from '~/lib/use-fedapay-script'
import { cn, isValidWebsiteUrl, normalizeWebsiteUrl, QUESTION_MAX_LENGTH, MAX_TRACKED_QUESTIONS } from '~/lib/utils'
import { FREE_MAX_QUESTIONS } from '~/lib/plan'
import { runFullMeasurement } from '~/lib/measurement-client'

// Point d'entrée unique pour sortir de l'état "compte sans marque" — ouvert
// depuis l'Accueil (État A) et depuis Paramètres → Site.
//
// Deux parcours distincts selon l'intention mémorisée depuis la page tarifs
// (Pricing.tsx → localStorage 'reflet_intended_plan') :
//
//  - Intention Free (cas par défaut) : formulaire en une page (nom + site +
//    questions, plafonnées à FREE_MAX_QUESTIONS), inchangé par rapport à la
//    version précédente — createBrandWithQuestions crée tout en un appel.
//
//  - Intention Pro : createCheckoutSession (billing.ts) exige un brandId
//    existant (FedaPay + webhook en dépendent), donc impossible de payer
//    avant qu'une marque existe. Le parcours se déroule en 3 étapes :
//      1. 'details'   — nom + site uniquement, PAS de questions à ce stade
//      2. 'payment'   — création de la marque (plan 'free', 0 question) puis
//                        ouverture immédiate du widget FedaPay avec ce
//                        brandId (même logique que UpgradeButton.tsx)
//      3. 'questions' — une fois le paiement terminé côté client, on ne fait
//                        PAS confiance au seul callback FedaPay (le webhook
//                        est asynchrone) : on poll getBrandPlan() pendant
//                        quelques secondes avant de débloquer le plafond Pro
//                        (MAX_TRACKED_QUESTIONS). Si le paiement est annulé/
//                        a échoué, ou si la confirmation n'arrive pas à temps,
//                        on bascule sur le flux Free classique (3 questions) —
//                        rien n'est bloqué, et addInitialQuestions revérifie
//                        de toute façon le plan réel en base côté serveur.
export function BrandSetupDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [questions, setQuestions] = useState<string[]>([''])
  const [isMeasuring, setIsMeasuring] = useState(false)
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null)

  // ── Orchestration du parcours Pro à l'inscription ──────────────────────
  const [proIntent, setProIntent] = useState(false)
  const [proPhase, setProPhase] = useState<'details' | 'payment' | 'questions' | null>(null)
  const [proBrandId, setProBrandId] = useState<string | null>(null)
  const [proConfirmed, setProConfirmed] = useState(false)
  const [polling, setPolling] = useState(false)
  const pollAbort = useRef(false)
  const scriptLoaded = useFedaPayScript()

  useEffect(() => {
    if (open) {
      const wantsPro = localStorage.getItem('reflet_intended_plan') === 'pro'
      setProIntent(wantsPro)
      setProPhase(wantsPro ? 'details' : null)
      setProBrandId(null)
      setProConfirmed(false)
      pollAbort.current = false
    }
  }, [open])

  async function pollBrandPlan(brandId: string) {
    setPolling(true)
    pollAbort.current = false
    const maxAttempts = 15 // ~30s à 2s d'intervalle — le webhook FedaPay est quasi toujours plus rapide
    for (let i = 0; i < maxAttempts; i++) {
      if (pollAbort.current) return
      await new Promise((resolve) => setTimeout(resolve, 2000))
      if (pollAbort.current) return
      try {
        const { plan } = await getBrandPlan({ data: { brandId } })
        if (plan !== 'free') {
          setProConfirmed(true)
          setPolling(false)
          setProPhase('questions')
          toast.success('Paiement confirmé — plan Pro activé !')
          return
        }
      } catch {
        // Erreur transitoire (réseau, etc.) — on continue de poller plutôt
        // que d'abandonner sur un seul appel raté.
      }
    }
    // Timeout sans confirmation en base : on ne bloque pas l'utilisateur avec
    // un spinner indéfini. Il continue avec le plafond Free pour l'instant —
    // addInitialQuestions revérifie le plan réel côté serveur de toute façon,
    // donc pas de risque de cap Pro accordé à tort.
    setPolling(false)
    setProConfirmed(false)
    setProPhase('questions')
    toast.info(
      "Paiement reçu, activation en cours — tu peux continuer, le plan Pro sera actif sous peu (vérifie Paramètres dans une minute).",
    )
  }

  async function openFedaPayForDraft(brandId: string) {
    if (!scriptLoaded || !window.FedaPay) {
      toast.error('Le module de paiement est en cours de chargement — réessaie dans un instant.')
      return
    }
    try {
      const { token } = await createCheckoutSession({
        data: { brandId, returnUrl: window.location.href },
      })
      const publicKey = import.meta.env.VITE_FEDAPAY_PUBLIC_KEY
      if (!publicKey) throw new Error('Clé publique FedaPay non configurée')

      window.FedaPay.init({
        public_key: publicKey,
        transaction: { token },
        onComplete: (resp: any) => {
          const reason = resp.reason
          if (reason === 'FedaPay checkout is closed.') {
            // Abandon volontaire — la marque existe déjà en Free, rien à
            // défaire : on bascule simplement sur l'étape questions avec le
            // plafond Free (point 6 du plan).
            setProConfirmed(false)
            setProPhase('questions')
            toast.info('Paiement annulé — tu peux continuer avec le plan Free, et repasser Pro depuis Paramètres quand tu veux.')
            return
          }
          // Le callback client n'est pas la source de vérité (webhook
          // asynchrone) — on attend la confirmation réelle en base.
          pollBrandPlan(brandId)
        },
      })
    } catch (err: any) {
      toast.error(err.message || 'Impossible de démarrer le paiement.')
      // On ne laisse pas l'utilisateur coincé sur un état "payment" mort :
      // il peut continuer en Free et retenter l'upgrade plus tard.
      setProConfirmed(false)
      setProPhase('questions')
    }
  }

  const draftMutation = useMutation({
    mutationFn: () =>
      createBrandDraft({ data: { name: name.trim(), websiteUrl: normalizeWebsiteUrl(websiteUrl) } }),
    onSuccess: (data) => {
      setProBrandId(data.brandId)
      setProPhase('payment')
      openFedaPayForDraft(data.brandId)
    },
    onError: (err: Error) => toast.error(err.message || 'Impossible de créer la marque.'),
  })

  const questionsMutation = useMutation({
    mutationFn: () => {
      if (!proBrandId) throw new Error('Marque introuvable — réessaie depuis le début.')
      return addInitialQuestions({ data: { brandId: proBrandId, questions: questions.filter((q) => q.trim()) } })
    },
    onSuccess: async () => {
      if (!proBrandId) return
      setIsMeasuring(true)
      localStorage.removeItem('reflet_onboarding_domain')
      localStorage.removeItem('reflet_intended_plan')
      toast.info('Marque configurée. Lancement de la première mesure...')
      try {
        await runFullMeasurement(proBrandId, queryClient, (p) => setProgress(p))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        toast.error(`Erreur lors de la mesure : ${message}`)
      } finally {
        setIsMeasuring(false)
        setProgress(null)
        queryClient.invalidateQueries({ queryKey: ['dashboard-home'] })
        queryClient.invalidateQueries({ queryKey: ['settings'] })
        resetForm()
        onClose()
      }
    },
    onError: (err: Error) => toast.error(err.message || 'Impossible d\'enregistrer les questions.'),
  })

  const mutation = useMutation({
    mutationFn: () =>
      createBrandWithQuestions({
        data: { name, websiteUrl: normalizeWebsiteUrl(websiteUrl), questions: questions.filter((q) => q.trim()) },
      }),
    onSuccess: async (data) => {
      if (data && data.brandId) {
        setIsMeasuring(true)
        localStorage.removeItem('reflet_onboarding_domain')
        toast.info('Marque configurée. Lancement de la première mesure...')
        try {
          // runFullMeasurement affiche déjà le toast correspondant au vrai
          // statut du run (success / partial / failed) — on ne rajoute pas
          // ici de toast de succès inconditionnel, sinon l'utilisateur voit
          // "Première mesure terminée !" même quand la mesure a échoué.
          await runFullMeasurement(data.brandId, queryClient, (p) => setProgress(p))
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Erreur inconnue'
          toast.error(`Erreur lors de la mesure : ${message}`)
        } finally {
          setIsMeasuring(false)
          setProgress(null)
          queryClient.invalidateQueries({ queryKey: ['dashboard-home'] })
          queryClient.invalidateQueries({ queryKey: ['settings'] })
          resetForm()
          onClose()

          // Intention "Pro" mémorisée mais jamais concrétisée dans ce tiroir
          // (ne devrait plus arriver maintenant que le parcours Pro est
          // intégré ci-dessus, mais on garde ce filet de sécurité : si le
          // flag traîne encore pour une raison quelconque, on renvoie vers
          // la carte Abonnement plutôt que de laisser l'utilisateur en Free
          // silencieusement).
          if (localStorage.getItem('reflet_intended_plan') === 'pro') {
            localStorage.removeItem('reflet_intended_plan')
            sessionStorage.setItem('reflet_scroll_to_abonnement', '1')
            navigate({ to: '/dashboard/parametres' })
          }
        }
      }
    },
    onError: (err: Error) => toast.error(err.message || 'Impossible de configurer la marque.'),
  })

  function resetForm() {
    setName('')
    setWebsiteUrl('')
    setQuestions(['', '', ''])
    setProPhase(null)
    setProBrandId(null)
    setProConfirmed(false)
  }

  // Génération IA disponible pour tous les comptes (pas de restriction de plan) —
  // seul le NOMBRE de questions ajoutables reste limité par plan. Le plafond
  // affiché suit la phase courante : FREE_MAX_QUESTIONS partout, sauf à
  // l'étape questions du parcours Pro une fois le paiement confirmé.
  const questionCap =
    proIntent && proPhase === 'questions' && proConfirmed ? MAX_TRACKED_QUESTIONS : FREE_MAX_QUESTIONS

  const generateMutation = useMutation({
    mutationFn: () =>
      generateQuestionsWithAI({ data: { name: name.trim(), websiteUrl: normalizeWebsiteUrl(websiteUrl) } }),
    onSuccess: (suggestions) => {
      setQuestions((qs) => {
        const filled = qs.filter((q) => q.trim())
        const remaining = questionCap - filled.length
        if (remaining <= 0) {
          toast.info('Limite de questions déjà atteinte — supprime-en une pour en ajouter une générée.')
          return qs
        }
        return [...filled, ...suggestions.slice(0, remaining)]
      })
    },
    onError: (err: Error) => toast.error(err.message || 'Impossible de générer des suggestions.'),
  })

  // urlValid doit être calculé avant tout early-return : sinon le nombre de
  // hooks appelés change entre le rendu fermé (open=false) et le rendu
  // ouvert (open=true), ce qui viole les Rules of Hooks et déclenche
  // React error #310 dès l'ouverture du tiroir.
  const urlValid = useMemo(() => isValidWebsiteUrl(normalizeWebsiteUrl(websiteUrl)), [websiteUrl])

  useEffect(() => {
    if (open) {
      const storedDomain = localStorage.getItem('reflet_onboarding_domain')
      if (storedDomain && !websiteUrl) {
        setWebsiteUrl(storedDomain)
      }
    }
  }, [open, websiteUrl])

  if (!open) return null

  function updateQuestion(i: number, value: string) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? value : q)))
  }

  function removeQuestion(i: number) {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i))
  }

  function addQuestionSlot() {
    setQuestions((qs) => (qs.length < questionCap ? [...qs, ''] : qs))
  }

  const filledQuestions = questions.filter((q) => q.trim()).length
  const urlTouched = websiteUrl.trim().length > 0
  const hasOverlongQuestion = questions.some((q) => q.length > QUESTION_MAX_LENGTH)
  const canSubmitDetails = name.trim() && urlValid && !draftMutation.isPending
  const canSubmitQuestions =
    filledQuestions > 0 && !hasOverlongQuestion && !questionsMutation.isPending && !isMeasuring
  const canSubmit =
    name.trim() &&
    urlValid &&
    filledQuestions > 0 &&
    !hasOverlongQuestion &&
    !mutation.isPending

  // Rendu via un portail vers document.body : ce tiroir est ouvert depuis
  // <Sidebar>, qui porte une classe translate-x-0 (transform CSS actif en
  // permanence). Un descendant `fixed` d'un ancêtre transformé se positionne
  // par rapport à cet ancêtre et non par rapport à l'écran — même bug racine
  // que la modale de déconnexion dans AccountMenu.tsx.
  if (typeof document === 'undefined') return null

  function handleClose() {
    // Ne pas fermer en pleine attente de confirmation de paiement : l'usager
    // perdrait le fil (le brandId reste valide, mais il n'y a plus d'UI pour
    // suivre où ça en est). Le run de paiement continue de toute façon côté
    // FedaPay/webhook ; on bloque juste la fermeture ici, pas le paiement.
    if (proPhase === 'payment' && polling) return
    pollAbort.current = true
    onClose()
  }

  const questionsStepTitle =
    proIntent && proPhase === 'questions'
      ? proConfirmed
        ? 'Questions à suivre (plan Pro)'
        : 'Questions à suivre (plan Free pour l\'instant)'
      : 'Questions à suivre'

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-canvas shadow-2xl animate-in slide-in-from-right duration-300 ease-out">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-display text-sm font-semibold text-ink-primary">
              Configurer ma marque
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Reflet mesure la visibilité d'une seule marque par compte.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-elevated hover:text-ink-primary"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {proIntent && proPhase === 'details' && (
            <div className="space-y-4">
              <div className="rounded-md border border-brand/30 bg-brand/5 p-3">
                <p className="text-xs text-ink-secondary">
                  Tu as choisi le plan <span className="font-semibold text-ink-primary">Pro</span> depuis les
                  tarifs. Renseigne d'abord ta marque, le paiement s'ouvre juste après.
                </p>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-ink-secondary">Nom de la marque</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ma Marque"
                  className="mt-1 w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand/50"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-ink-secondary">Site web</span>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Globe className="size-4 text-ink-muted" />
                  </div>
                  <input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    onBlur={() => setWebsiteUrl((v) => normalizeWebsiteUrl(v))}
                    placeholder="tondomaine.com"
                    className={cn(
                      'w-full rounded-md border bg-elevated py-2 pl-9 pr-3 text-sm text-ink-primary outline-none',
                      urlTouched && !urlValid
                        ? 'border-danger/60 focus:border-danger'
                        : 'border-border focus:border-brand/50',
                    )}
                  />
                </div>
                {urlTouched && !urlValid && (
                  <p className="mt-1 text-[11px] text-danger">
                    URL invalide — utilisez un format du type https://votre-site.fr
                  </p>
                )}
              </label>
            </div>
          )}

          {proIntent && proPhase === 'payment' && (
            <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-elevated px-4 py-10 text-center">
              <Loader2 className="size-6 animate-spin text-brand" />
              <p className="text-sm font-medium text-ink-primary">
                {polling ? 'Vérification du paiement…' : 'Ouverture du paiement…'}
              </p>
              <p className="max-w-xs text-[11px] text-ink-muted">
                {polling
                  ? 'On attend la confirmation en base avant de débloquer le plan Pro — quelques secondes.'
                  : 'La fenêtre de paiement FedaPay va s\'ouvrir. Si rien ne se passe, vérifie que les popups ne sont pas bloquées.'}
              </p>
              {!polling && (
                <button
                  type="button"
                  onClick={() => {
                    setProConfirmed(false)
                    setProPhase('questions')
                  }}
                  className="mt-2 text-[11px] font-medium text-ink-muted underline hover:text-ink-primary"
                >
                  Continuer en Free pour l'instant
                </button>
              )}
            </div>
          )}

          {(!proIntent || proPhase === null || proPhase === 'questions') && (
            <div className="space-y-4">
              {!(proIntent && proPhase === 'questions') && (
                <>
                  <label className="block">
                    <span className="text-xs font-medium text-ink-secondary">Nom de la marque</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ma Marque"
                      className="mt-1 w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand/50"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-ink-secondary">Site web</span>
                    <div className="relative mt-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Globe className="size-4 text-ink-muted" />
                      </div>
                      <input
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        onBlur={() => setWebsiteUrl((v) => normalizeWebsiteUrl(v))}
                        placeholder="tondomaine.com"
                        className={cn(
                          'w-full rounded-md border bg-elevated py-2 pl-9 pr-3 text-sm text-ink-primary outline-none',
                          urlTouched && !urlValid
                            ? 'border-danger/60 focus:border-danger'
                            : 'border-border focus:border-brand/50',
                        )}
                      />
                    </div>
                    {urlTouched && !urlValid && (
                      <p className="mt-1 text-[11px] text-danger">
                        URL invalide — utilisez un format du type https://votre-site.fr
                      </p>
                    )}
                  </label>
                </>
              )}

              {proIntent && proPhase === 'questions' && (
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-md border p-3 text-xs',
                    proConfirmed
                      ? 'border-success/30 bg-success/5 text-success'
                      : 'border-border bg-elevated text-ink-muted',
                  )}
                >
                  {proConfirmed ? <CheckCircle2 className="size-4 shrink-0" /> : <Loader2 className="size-4 shrink-0" />}
                  {proConfirmed
                    ? 'Paiement confirmé — plan Pro actif, jusqu\'à 50 questions.'
                    : 'Paiement en cours de confirmation — 3 questions pour l\'instant, le plafond Pro se débloquera automatiquement.'}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-secondary">{questionsStepTitle}</span>
                  <span className="text-[11px] text-ink-muted">{filledQuestions}/{questionCap}</span>
                </div>
                <p className="mt-1 text-[11px] text-ink-muted">
                  Ce que vos prospects pourraient demander à ChatGPT.
                </p>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => generateMutation.mutate()}
                      disabled={
                        generateMutation.isPending ||
                        !name.trim() ||
                        !urlValid ||
                        filledQuestions >= questionCap
                      }
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-brand/40 bg-brand/10 px-3 py-2 text-xs font-medium text-brand-text transition-colors hover:bg-brand/20 disabled:opacity-50"
                    >
                      <Sparkles className="size-3.5" />
                      {generateMutation.isPending ? 'Génération…' : 'Générer avec l\'IA'}
                    </button>
                  </TooltipTrigger>
                  {(!name.trim() || !urlValid) && (
                    <TooltipContent>Renseigne le nom et un site web valide d'abord</TooltipContent>
                  )}
                </Tooltip>

                <div className="mt-4 flex flex-col gap-5">
                  <AnimatePresence initial={false}>
                    {questions.map((q, i) => {
                      const overlong = q.length > QUESTION_MAX_LENGTH
                      const nearLimit = !overlong && q.length > QUESTION_MAX_LENGTH * 0.9
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, height: 0, scale: 0.95 }}
                          animate={{ opacity: 1, height: 'auto', scale: 1 }}
                          exit={{ opacity: 0, height: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex gap-2">
                            <textarea
                              value={q}
                              rows={2}
                              onChange={(e) => updateQuestion(i, e.target.value)}
                              placeholder={`Question ${i + 1}…`}
                              className={cn(
                                'flex-1 resize-none rounded-md border bg-elevated px-3 py-2 text-sm text-ink-primary outline-none overflow-y-auto',
                                overlong
                                  ? 'border-danger/60 focus:border-danger'
                                  : 'border-border focus:border-brand/50',
                              )}
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => removeQuestion(i)}
                                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-danger/10 hover:text-danger"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Retirer</TooltipContent>
                            </Tooltip>
                          </div>
                          {(overlong || nearLimit) && (
                            <p
                              className={cn(
                                'mt-1 text-right text-[11px]',
                                overlong ? 'text-danger' : 'text-warning',
                              )}
                            >
                              {q.length}/{QUESTION_MAX_LENGTH}
                              {overlong ? ' — trop long' : ''}
                            </p>
                          )}
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>

                {questions.length < questionCap && (
                  <button
                    type="button"
                    onClick={addQuestionSlot}
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-ink-primary"
                  >
                    <Plus className="size-3.5" /> Ajouter une question
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-5">
          {proIntent && proPhase === 'details' && (
            <button
              type="button"
              onClick={() => draftMutation.mutate()}
              disabled={!canSubmitDetails}
              className="w-full rounded-md bg-brand px-3 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              {draftMutation.isPending ? 'Préparation du paiement…' : 'Continuer vers le paiement'}
            </button>
          )}

          {proIntent && proPhase === 'payment' && (
            <button
              type="button"
              disabled
              className="w-full rounded-md bg-brand px-3 py-2.5 text-sm font-semibold text-black opacity-50"
            >
              En attente du paiement…
            </button>
          )}

          {proIntent && proPhase === 'questions' && (
            <button
              type="button"
              onClick={() => questionsMutation.mutate()}
              disabled={!canSubmitQuestions}
              className="w-full rounded-md bg-brand px-3 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              {isMeasuring
                ? `Mesure en cours (${progress ? `${progress.completed}/${progress.total}` : '...'})`
                : questionsMutation.isPending
                  ? 'Configuration…'
                  : 'Configurer et lancer la mesure'}
            </button>
          )}

          {(!proIntent || proPhase === null) && (
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={!canSubmit || isMeasuring}
              className="w-full rounded-md bg-brand px-3 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              {isMeasuring
                ? `Mesure en cours (${progress ? `${progress.completed}/${progress.total}` : '...'})`
                : mutation.isPending
                  ? 'Configuration…'
                  : 'Configurer et lancer la mesure'}
            </button>
          )}
        </div>
      </aside>
    </>,
    document.body,
  )
}
