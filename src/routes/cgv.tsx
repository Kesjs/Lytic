import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '~/components/landing/Navbar'
import { Footer } from '~/components/landing/Footer'

export const Route = createFileRoute('/cgv')({
  component: CgvPage,
})

function CgvPage() {
  return (
    <main className="theme-landing min-h-screen bg-canvas">
      <Navbar />

      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            Conditions Générales de Vente
          </h1>
          <div className="mt-8 space-y-8 text-sm text-ink-secondary leading-relaxed">
            <ol className="list-decimal list-inside space-y-4">
              <li>
                <strong>Offre.</strong> Reflet propose un abonnement mensuel payant donnant accès au suivi de visibilité IA de votre marque, aux détails décrits sur la page tarifs.
              </li>
              <li>
                <strong>Essai gratuit.</strong> Un essai de 7 jours est proposé, nécessitant une carte bancaire. Un montant de 1,50 € est prélevé à l'inscription à titre de vérification. Si vous ne résiliez pas avant la fin des 7 jours, l'abonnement payant démarre automatiquement et le tarif en vigueur est prélevé.
              </li>
              <li>
                <strong>Prix.</strong> Les prix sont indiqués en euros, toutes taxes comprises lorsque applicable. Le prix en vigueur au moment de la souscription vous est communiqué avant tout paiement.
              </li>
              <li>
                <strong>Paiement.</strong> Les paiements sont traités par un prestataire de paiement tiers (FedaPay). Reflet ne stocke pas les données de votre carte bancaire.
              </li>
              <li>
                <strong>Facturation récurrente.</strong> L'abonnement se renouvelle automatiquement chaque mois jusqu'à résiliation de votre part. Vous pouvez résilier à tout moment ; la résiliation prend effet à la fin de la période déjà payée.
              </li>
              <li>
                <strong>Droit de rétractation.</strong> Conformément aux règles applicables aux services numériques fournis immédiatement, le droit de rétractation de 14 jours ne s'applique pas une fois que vous avez expressément demandé l'accès au service et reconnu que cet accès démarre l'exécution du contrat avant la fin du délai de rétractation. Vous pouvez néanmoins résilier à tout moment pour l'avenir, sans frais.
              </li>
              <li>
                <strong>Remboursement.</strong> En dehors des cas prévus par la loi, les paiements déjà effectués ne sont pas remboursables, y compris en cas de résiliation en cours de période payée.
              </li>
              <li>
                <strong>Réclamations.</strong> Pour toute question relative à la facturation, contactez contact@reflet.app.
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
