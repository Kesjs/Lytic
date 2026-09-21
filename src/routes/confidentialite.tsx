import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '~/components/landing/Navbar'
import { Footer } from '~/components/landing/Footer'

export const Route = createFileRoute('/confidentialite')({
  component: ConfidentialitePage,
})

function ConfidentialitePage() {
  return (
    <main className="theme-landing min-h-screen bg-canvas">
      <Navbar />

      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            Politique de confidentialité
          </h1>
          <div className="mt-8 space-y-8 text-sm text-ink-secondary leading-relaxed">
            <ol className="list-decimal list-inside space-y-4">
              <li>
                <strong>Responsable du traitement.</strong> Ken Babatoundé, contact : contact@reflet.app.
              </li>
              <li>
                <strong>Données collectées.</strong>
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Données de compte : email, nom de la marque suivie, mot de passe (haché, jamais stocké en clair)</li>
                  <li>Données d'usage du service : questions suivies, résultats de mesure de visibilité IA, historique des mesures</li>
                  <li>Données de paiement : traitées directement par notre prestataire de paiement (FedaPay) — nous ne stockons pas votre numéro de carte</li>
                  <li>Données techniques : adresse IP (utilisée pour la protection anti-abus lors de l'inscription), journaux techniques standards</li>
                </ul>
              </li>
              <li>
                <strong>Finalités.</strong> Ces données sont utilisées pour : fournir le service (mesures de visibilité IA), gérer votre compte et votre abonnement, vous contacter en cas de nécessité liée au service, et prévenir les abus (créations de comptes multiples frauduleuses).
              </li>
              <li>
                <strong>Sous-traitants.</strong> Vos données sont hébergées chez Supabase Inc. Les mesures de visibilité IA impliquent l'envoi de vos questions suivies à des fournisseurs d'IA tiers (OpenAI pour ChatGPT, et selon votre plan, Perplexity) pour obtenir les réponses mesurées.
              </li>
              <li>
                <strong>Durée de conservation.</strong> Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, vos données personnelles sont supprimées sous 30 jours, sauf obligation légale de conservation plus longue (données de facturation notamment).
              </li>
              <li>
                <strong>Vos droits.</strong> Vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Pour l'exercer, contactez contact@reflet.app. Nous répondons sous 30 jours.
              </li>
              <li>
                <strong>Cookies.</strong> Reflet utilise uniquement des cookies techniques nécessaires au fonctionnement du service (session de connexion). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
              </li>
              <li>
                <strong>Sécurité.</strong> Vos données sont protégées par chiffrement en transit (HTTPS) et par des règles d'accès strictes au niveau de la base de données (Row Level Security) garantissant que seul vous pouvez accéder à vos propres données.
              </li>
            </ol>

            <p className="text-xs text-ink-muted mt-12">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
