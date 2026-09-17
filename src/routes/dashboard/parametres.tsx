import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { SectionCard } from '~/components/ui/section-card'
import { toast } from 'sonner'
import { Pencil, Plus, Check, X as XIcon, Globe, Trash2, Clock } from 'lucide-react'
import { BrandSetupDrawer } from '~/components/dashboard/BrandSetupDrawer'
import { cn, isValidWebsiteUrl, normalizeWebsiteUrl, QUESTION_MAX_LENGTH, MAX_TRACKED_QUESTIONS } from '~/lib/utils'
import { DashboardStateView } from '~/components/dashboard/DashboardState'
import { ThemeToggle } from '~/components/ui/theme-toggle'
import {
  fetchSettings,
  updateProfileName,
  updatePassword,
  updateBrandSite,
  addQuestion,
  updateQuestionText,
  toggleQuestionActive,
  deleteQuestion,
  deleteBrand,
  updateNotificationPreferences,
  type SettingsData,
} from '~/lib/queries/settings'
import { triggerSiteCrawl, processNextPage } from '~/lib/crawler/orchestrate'
import { isFreePlan, FREE_MAX_QUESTIONS, FREE_MAX_COMPETITORS_VISIBLE, FREE_SITE_SCAN_COOLDOWN_DAYS } from '~/lib/plan'

export const Route = createFileRoute('/dashboard/parametres')({
  component: ParametresPage,
})

const PLAN_LABEL: Record<string, string> = {
  trial: 'Essai',
  active: 'Actif',
  past_due: 'Paiement en retard',
  canceled: 'Résilié',
  free: 'Free',
}

const PLAN_CLASS: Record<string, string> = {
  trial: 'bg-info/10 text-info border-info/30',
  active: 'bg-success/10 text-success border-success/30',
  past_due: 'bg-warning/10 text-warning border-warning/30',
  canceled: 'bg-danger/10 text-danger border-danger/30',
  free: 'bg-brand/10 text-brand-text border-brand/30',
}

function ParametresPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetchSettings(),
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['settings'] })
  }

  if (isLoading) {
    return <DashboardStateView state="loading" />
  }

  if (!data) {
    return (
      <DashboardStateView state="no_data" title="Non authentifié" description="Connectez-vous pour accéder à vos paramètres." />
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <AccountSection profile={data.profile} onSaved={invalidate} />
      <AppearanceSection />
      <SiteSection brand={data.brand} onSaved={invalidate} />
      {data.brand && <CrawlSection brand={data.brand} />}
      <QuestionsSection brand={data.brand} questions={data.questions} onSaved={invalidate} />
      <NotificationsSection brand={data.brand} notifications={data.notifications} onSaved={invalidate} />
      <SubscriptionSection brand={data.brand} />
      {data.brand && <DangerZoneSection brand={data.brand} onDeleted={invalidate} />}
      <SecuritySection />
    </div>
  )
}



function TextField({
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  type?: string
  placeholder?: string
  error?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-secondary">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(
          'mt-1 w-full rounded-md border bg-elevated px-3 py-2 text-sm text-ink-primary outline-none',
          error ? 'border-danger/60 focus:border-danger' : 'border-border focus:border-brand/50',
        )}
      />
      {error && <p className="mt-1 text-[11px] text-danger">{error}</p>}
    </label>
  )
}

function SaveButton({
  onClick,
  saving,
  label = 'Enregistrer',
  disabled = false,
}: {
  onClick: () => void
  saving: boolean
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving || disabled}
      className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-brand-hover disabled:opacity-50"
    >
      {saving ? 'Enregistrement…' : label}
    </button>
  )
}

// L'ancien composant Toggle a été supprimé à la demande de l'utilisateur pour utiliser un checkbox standard
// partout (Questions ET Notifications — la section Notifications avait été oubliée lors du remplacement).

// --- Compte ---

function AccountSection({
  profile,
  onSaved,
}: {
  profile: SettingsData['profile']
  onSaved: () => void
}) {
  const [fullName, setFullName] = useState(profile.fullName ?? '')

  const mutation = useMutation({
    mutationFn: (name: string) => updateProfileName({ data: name }),
    onSuccess: () => {
      toast.success('Profil mis à jour.')
      onSaved()
    },
    onError: (err: Error) => toast.error(err.message || 'Impossible de mettre à jour le profil.'),
  })

  return (
    <SectionCard title="Compte" description="Vos informations personnelles.">
      <div className="space-y-3">
        <TextField label="Nom complet" value={fullName} onChange={setFullName} placeholder="Votre nom" />
        <label className="block">
          <span className="text-xs font-medium text-ink-secondary">Email</span>
          <input
            type="email"
            value={profile.email}
            disabled
            className="mt-1 w-full cursor-not-allowed rounded-md border border-border bg-canvas px-3 py-2 text-sm text-ink-muted"
          />
        </label>
        <div className="flex justify-end">
          <SaveButton onClick={() => mutation.mutate(fullName)} saving={mutation.isPending} />
        </div>
      </div>
    </SectionCard>
  )
}

// --- Apparence ---

function AppearanceSection() {
  return (
    <SectionCard title="Apparence" description="Thème clair ou sombre de l'interface.">
      <ThemeToggle />
    </SectionCard>
  )
}

// --- Site ---

function SiteSection({
  brand,
  onSaved,
}: {
  brand: SettingsData['brand']
  onSaved: () => void
}) {
  const [name, setName] = useState(brand?.name ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(brand?.websiteUrl ?? '')
  const [setupOpen, setSetupOpen] = useState(false)

  useEffect(() => {
    setName(brand?.name ?? '')
    setWebsiteUrl(brand?.websiteUrl ?? '')
  }, [brand?.id])

  const mutation = useMutation({
    mutationFn: () => updateBrandSite({ data: { brandId: brand!.id, name, websiteUrl } }),
    onSuccess: () => {
      toast.success('Marque mise à jour.')
      onSaved()
    },
    onError: (err: Error) => toast.error(err.message || 'Impossible de mettre à jour la marque.'),
  })

  const urlTouched = websiteUrl.trim().length > 0
  const urlValid = useMemo(() => isValidWebsiteUrl(websiteUrl), [websiteUrl])

  if (!brand) {
    return (
      <SectionCard
        title="Site"
        description="Configurez votre marque pour commencer à suivre votre visibilité IA."
      >
        <p className="text-xs text-ink-muted">Aucune marque configurée pour le moment.</p>
        <button
          type="button"
          onClick={() => setSetupOpen(true)}
          className="mt-3 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-brand-hover"
        >
          + Configurer ma marque
        </button>
        <BrandSetupDrawer open={setupOpen} onClose={() => setSetupOpen(false)} />
      </SectionCard>
    )
  }

  return (
    <SectionCard title="Site" description="Le nom et l'URL suivis par Reflet.">
      <div className="space-y-3">
        <TextField label="Nom de la marque" value={name} onChange={setName} />
        <TextField
          label="Site web"
          value={websiteUrl}
          onChange={setWebsiteUrl}
          onBlur={() => setWebsiteUrl((v) => normalizeWebsiteUrl(v))}
          placeholder="votre-site.fr"
          error={
            urlTouched && !urlValid
              ? 'URL invalide — utilisez un format du type https://votre-site.fr'
              : undefined
          }
        />
        <div className="flex justify-end">
          <SaveButton
            onClick={() => mutation.mutate()}
            saving={mutation.isPending}
            disabled={!name.trim() || !urlValid}
          />
        </div>
      </div>
    </SectionCard>
  )
}

// --- Zone de danger : recommencer l'onboarding ---

// Débloque un cas jusqu'ici sans issue : une marque créée puis dont la
// première mesure automatique échoue (ou qu'on veut simplement reconfigurer
// avec d'autres questions/plan de test) restait bloquée pour toujours —
// createBrandWithQuestions refuse une deuxième marque pour le même compte,
// et rien ne permettait de supprimer la première.
function DangerZoneSection({
  brand,
  onDeleted,
}: {
  brand: SettingsData['brand']
  onDeleted: () => void
}) {
  const [confirmText, setConfirmText] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteBrand({ data: { brandId: brand!.id } }),
    onSuccess: () => {
      toast.success('Marque supprimée — vous pouvez recommencer la configuration.')
      setConfirmText('')
      // Le brand vit aussi dans le cache d'Accueil (dashboard-home) et du
      // bouton de mesure — sans ça l'utilisateur revoit l'ancienne marque
      // en quittant Paramètres tant que ces queries ne sont pas rechargées.
      queryClient.invalidateQueries({ queryKey: ['dashboard-home'] })
      queryClient.invalidateQueries({ queryKey: ['bot-access'] })
      onDeleted()
    },
    onError: (err: Error) => toast.error(err.message || 'Impossible de supprimer cette marque.'),
  })

  if (!brand) return null

  return (
    <SectionCard
      title="Zone de danger"
      description="Supprime définitivement cette marque, ses questions, mesures et opportunités — pour repartir de zéro sur l'onboarding."
    >
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-ink-secondary">
            Tapez <span className="font-mono text-danger">{brand.name}</span> pour confirmer
          </span>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={brand.name}
            className="mt-1 w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-ink-primary outline-none focus:border-danger/50"
          />
        </label>
        <div className="flex justify-end">
          <button
            type="button"
            disabled={confirmText !== brand.name || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="rounded-md border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mutation.isPending ? 'Suppression…' : 'Supprimer ma marque et recommencer'}
          </button>
        </div>
      </div>
    </SectionCard>
  )
}

// --- Questions ---

function QuestionsSection({
  brand,
  questions,
  onSaved,
}: {
  brand: SettingsData['brand']
  questions: SettingsData['questions']
  onSaved: () => void
}) {
  const [newText, setNewText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const addMutation = useMutation({
    mutationFn: () => addQuestion({ data: { brandId: brand!.id, text: newText } }),
    onSuccess: () => {
      setNewText('')
      toast.success('Question ajoutée.')
      onSaved()
    },
    onError: (err: Error) => toast.error(err.message || "Impossible d'ajouter cette question."),
  })

  const editMutation = useMutation({
    mutationFn: (data: { questionId: string; text: string }) => updateQuestionText({ data }),
    onSuccess: () => {
      setEditingId(null)
      toast.success('Question modifiée.')
      onSaved()
    },
    onError: (err: Error) => toast.error(err.message || 'Impossible de modifier cette question.'),
  })

  const toggleMutation = useMutation({
    mutationFn: (data: { questionId: string; active: boolean }) => toggleQuestionActive({ data }),
    onSuccess: () => onSaved(),
    onError: (err: Error) => toast.error(err.message || 'Impossible de mettre à jour cette question.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (data: { questionId: string }) => deleteQuestion({ data }),
    onSuccess: () => {
      toast.success('Question supprimée.')
      onSaved()
    },
    onError: (err: Error) => toast.error(err.message || 'Impossible de supprimer cette question.'),
  })

  if (!brand) {
    return (
      <SectionCard title="Questions" description="Les questions suivies pour mesurer votre visibilité.">
        <p className="text-xs text-ink-muted">Configurez votre marque avant d'ajouter des questions.</p>
      </SectionCard>
    )
  }

  const maxQuestions = isFreePlan(brand.plan) ? FREE_MAX_QUESTIONS : MAX_TRACKED_QUESTIONS

  return (
    <SectionCard
      title="Questions"
      description={`${questions.length}/${maxQuestions} questions suivies. Une question désactivée n'est plus mesurée mais reste visible.`}
    >
      <div className="space-y-2">
        {questions.length === 0 && (
          <p className="text-xs text-ink-muted">Aucune question pour le moment.</p>
        )}
        {questions.map((q) => {
          const editingOverlong = editingId === q.id && editingText.length > QUESTION_MAX_LENGTH
          const editingNearLimit =
            editingId === q.id &&
            !editingOverlong &&
            editingText.length > QUESTION_MAX_LENGTH * 0.9
          return (
            <div
              key={q.id}
              className={`rounded-md border border-border bg-elevated px-3 py-2 ${
                !q.active ? 'opacity-60' : ''
              }`}
            >
              {editingId === q.id ? (
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className={cn(
                        'flex-1 rounded-sm border bg-canvas px-2 py-1 text-xs text-ink-primary outline-none',
                        editingOverlong
                          ? 'border-danger/60 focus:border-danger'
                          : 'border-border focus:border-brand/50',
                      )}
                      autoFocus
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => editMutation.mutate({ questionId: q.id, text: editingText })}
                          disabled={editMutation.isPending || editingOverlong || !editingText.trim()}
                          className="flex size-6 items-center justify-center rounded-sm text-success hover:bg-success/10 disabled:opacity-40"
                        >
                          <Check className="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Valider</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="flex size-6 items-center justify-center rounded-sm text-ink-muted hover:bg-danger/10 hover:text-danger"
                        >
                          <XIcon className="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Annuler</TooltipContent>
                    </Tooltip>
                  </div>
                  {(editingOverlong || editingNearLimit) && (
                    <p
                      className={cn(
                        'mt-1 text-right text-[10px]',
                        editingOverlong ? 'text-danger' : 'text-warning',
                      )}
                    >
                      {editingText.length}/{QUESTION_MAX_LENGTH}
                      {editingOverlong ? ' — trop long' : ''}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={q.active}
                    onChange={(e) => toggleMutation.mutate({ questionId: q.id, active: e.target.checked })}
                    className="size-4 cursor-pointer rounded border-border bg-canvas text-brand focus:ring-brand"
                    title={q.active ? "Désactiver la question" : "Activer la question"}
                  />
                  <p className="flex-1 text-xs text-ink-secondary">« {q.text} »</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(q.id)
                          setEditingText(q.text)
                        }}
                        className="flex size-6 items-center justify-center rounded-sm text-ink-muted hover:bg-elevated hover:text-ink-primary"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Modifier</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Voulez-vous vraiment supprimer cette question ? L\'historique associé sera perdu.')) {
                            deleteMutation.mutate({ questionId: q.id })
                          }
                        }}
                        className="flex size-6 items-center justify-center rounded-sm text-ink-muted hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Supprimer</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-2">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Nouvelle question à suivre…"
            className={cn(
              'flex-1 rounded-md border bg-elevated px-3 py-2 text-sm text-ink-primary outline-none',
              newText.length > QUESTION_MAX_LENGTH
                ? 'border-danger/60 focus:border-danger'
                : 'border-border focus:border-brand/50',
            )}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => newText.trim() && addMutation.mutate()}
                disabled={
                  addMutation.isPending ||
                  questions.length >= maxQuestions ||
                  !newText.trim() ||
                  newText.length > QUESTION_MAX_LENGTH
                }
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-elevated text-ink-secondary hover:text-ink-primary disabled:opacity-50"
              >
                <Plus className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Ajouter</TooltipContent>
          </Tooltip>
        </div>
        {newText.length > QUESTION_MAX_LENGTH * 0.9 && (
          <p
            className={cn(
              'mt-1 text-right text-[11px]',
              newText.length > QUESTION_MAX_LENGTH ? 'text-danger' : 'text-warning',
            )}
          >
            {newText.length}/{QUESTION_MAX_LENGTH}
            {newText.length > QUESTION_MAX_LENGTH ? ' — trop long' : ''}
          </p>
        )}
      </div>
    </SectionCard>
  )
}

// --- Notifications ---

function NotificationsSection({
  brand,
  notifications,
  onSaved,
}: {
  brand: SettingsData['brand']
  notifications: SettingsData['notifications']
  onSaved: () => void
}) {
  const [prefs, setPrefs] = useState(
    notifications ?? {
      emailEnabled: true,
      notifyMeasurementRun: true,
      notifySiteChange: true,
      notifyOpportunity: true,
      notifyBilling: true,
    },
  )

  useEffect(() => {
    if (notifications) setPrefs(notifications)
  }, [notifications])

  const mutation = useMutation({
    mutationFn: () => updateNotificationPreferences({ data: { brandId: brand!.id, ...prefs } }),
    onSuccess: () => {
      toast.success('Préférences de notification enregistrées.')
      onSaved()
    },
    onError: (err: Error) => toast.error(err.message || 'Impossible de mettre à jour les notifications.'),
  })

  if (!brand) {
    return (
      <SectionCard title="Notifications" description="Alertes envoyées par email.">
        <p className="text-xs text-ink-muted">Configurez votre marque avant de régler les notifications.</p>
      </SectionCard>
    )
  }

  const rows: { key: keyof typeof prefs; label: string }[] = [
    { key: 'emailEnabled', label: 'Notifications par email (interrupteur général)' },
    { key: 'notifyMeasurementRun', label: 'Nouvelle mesure terminée' },
    { key: 'notifySiteChange', label: 'Changement détecté sur le site' },
    { key: 'notifyOpportunity', label: 'Nouvelle opportunité identifiée' },
    { key: 'notifyBilling', label: 'Facturation et abonnement' },
  ]

  return (
    <SectionCard title="Notifications" description="Choisissez ce qui déclenche un email.">
      <div className="space-y-2.5">
        {rows.map((r) => {
          // Les sous-options n'ont plus d'effet si l'interrupteur général est
          // désactivé — grisées pour ne pas laisser croire qu'elles sont actives.
          const isSubOption = r.key !== 'emailEnabled'
          const disabled = isSubOption && !prefs.emailEnabled
          return (
            <label
              key={r.key}
              className={cn(
                'flex items-center justify-between gap-3',
                disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
              )}
            >
              <span className="text-xs text-ink-secondary">{r.label}</span>
              <input
                type="checkbox"
                checked={prefs[r.key]}
                disabled={disabled}
                onChange={(e) => setPrefs((p) => ({ ...p, [r.key]: e.target.checked }))}
                className="size-4 cursor-pointer rounded border-border bg-canvas text-brand focus:ring-brand disabled:cursor-not-allowed"
              />
            </label>
          )
        })}
        <div className="flex justify-end pt-1">
          <SaveButton onClick={() => mutation.mutate()} saving={mutation.isPending} />
        </div>
      </div>
    </SectionCard>
  )
}

// --- Abonnement ---
// Lecture seule : aucun système de facturation réel n'existe encore, donc pas
// de bouton "changer de plan" qui prétendrait déclencher une vraie action de
// facturation. Le lien "Passer Pro" ci-dessous n'en est pas un : il renvoie
// simplement vers la page tarifs, comme n'importe quel lien marketing.

function SubscriptionSection({ brand }: { brand: SettingsData['brand'] }) {
  if (!brand) {
    return (
      <SectionCard title="Abonnement">
        <p className="text-xs text-ink-muted">Configurez votre marque pour voir votre abonnement.</p>
      </SectionCard>
    )
  }

  const free = isFreePlan(brand.plan)

  return (
    <SectionCard title="Abonnement">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-primary">Plan actuel</p>
          <p className="mt-0.5 text-xs text-ink-muted">
            Marque créée le{' '}
            {new Date(brand.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <span className={`rounded-sm border px-2 py-1 text-[11px] font-medium ${PLAN_CLASS[brand.plan]}`}>
          {PLAN_LABEL[brand.plan]}
        </span>
      </div>

      {free ? (
        <div className="mt-4 rounded-md border border-border bg-elevated p-3">
          <p className="text-xs font-medium text-ink-primary">Limites du plan Free</p>
          <ul className="mt-2 space-y-1 text-xs text-ink-muted">
            <li>• {FREE_MAX_QUESTIONS} question suivie</li>
            <li>• 1 mesure (aperçu) + 1 remesure si changement du site détecté</li>
            <li>• {FREE_MAX_COMPETITORS_VISIBLE} concurrent visible</li>
          </ul>
          <a
            href="/#tarifs"
            className="mt-3 inline-flex items-center rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-black hover:bg-brand-hover"
          >
            Passer Pro
          </a>
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink-muted">
          La gestion de la facturation n'est pas encore disponible dans cette version.
        </p>
      )}
    </SectionCard>
  )
}

// --- Sécurité ---

function SecuritySection() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const mutation = useMutation({
    mutationFn: (password: string) => updatePassword({ data: password }),
    onSuccess: () => {
      toast.success('Mot de passe mis à jour.')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err: Error) => toast.error(err.message || 'Impossible de mettre à jour le mot de passe.'),
  })

  function handleSubmit() {
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.')
      return
    }
    mutation.mutate(newPassword)
  }

  return (
    <SectionCard title="Sécurité" description="Changer votre mot de passe.">
      <div className="space-y-3">
        <TextField
          label="Nouveau mot de passe"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="8 caractères minimum"
        />
        <TextField
          label="Confirmer le mot de passe"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
        <div className="flex justify-end">
          <SaveButton onClick={handleSubmit} saving={mutation.isPending} label="Mettre à jour le mot de passe" />
        </div>
      </div>
    </SectionCard>
  )
}

// --- Crawl (Change Detection) ---

function daysRemainingForScan(lastCompletedAt: string | null): number {
  if (!lastCompletedAt) return 0
  const elapsedMs = Date.now() - new Date(lastCompletedAt).getTime()
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.ceil(FREE_SITE_SCAN_COOLDOWN_DAYS - elapsedDays))
}

function CrawlSection({ brand }: { brand: SettingsData['brand'] }) {
  const [isCrawling, setIsCrawling] = useState(false)
  const queryClient = useQueryClient()

  const free = isFreePlan(brand?.plan)
  const remaining = free ? daysRemainingForScan(brand?.lastCrawlCompletedAt ?? null) : 0
  const cooldownActive = free && remaining > 0

  const triggerMutation = useMutation({
    mutationFn: () => triggerSiteCrawl({ data: { brandId: brand!.id } }),
    onSuccess: async (data) => {
      setIsCrawling(true)
      toast.info('Analyse du site démarrée')
      
      let done = false
      let runId = data.runId

      while (!done) {
        try {
          const res = await processNextPage({ data: { runId } })
          done = res.done
        } catch (err) {
          console.error(err)
          break
        }
      }

      setIsCrawling(false)
      toast.success('Analyse du site terminée')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (err: Error) => {
      setIsCrawling(false)
      toast.error(err.message || 'Erreur lors du crawl')
    }
  })

  const buttonDisabled = isCrawling || triggerMutation.isPending || cooldownActive

  const buttonLabel = isCrawling || triggerMutation.isPending
    ? 'Analyse en cours...'
    : cooldownActive
      ? `Disponible dans ${remaining} jour${remaining > 1 ? 's' : ''}`
      : 'Vérifier les modifications'

  return (
    <SectionCard title="Mémoire du Site (Change Detection)" description="Reflet analyse votre site pour détecter les modifications et prouver l'impact de vos optimisations.">
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-ink-secondary">
          {isCrawling
            ? 'Analyse en cours...'
            : cooldownActive
              ? `Prochaine vérification disponible dans ${remaining} jour${remaining > 1 ? 's' : ''}.`
              : 'Le site est analysé régulièrement pour détecter les changements de structure et de contenu.'}
        </p>
        <button
          type="button"
          onClick={() => triggerMutation.mutate()}
          disabled={buttonDisabled}
          className="flex items-center gap-1.5 rounded-md bg-brand/10 border border-brand/30 px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/20 disabled:opacity-50 disabled:hover:bg-brand/10"
        >
          {cooldownActive && !isCrawling && !triggerMutation.isPending && <Clock className="size-3.5" />}
          {buttonLabel}
        </button>
      </div>
    </SectionCard>
  )
}

