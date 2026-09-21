import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '~/components/landing/Navbar'
import { Footer } from '~/components/landing/Footer'

export const Route = createFileRoute('/mentions-legales')({
  component: MentionsLegalesPage,
})

function MentionsLegalesPage() {
  return (
    <main className="theme-landing min-h-screen bg-canvas">
      <Navbar />

      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            Mentions légales
          </h1>
          <div className="mt-8 space-y-8 text-sm text-ink-secondary leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-ink-primary mb-4">Éditeur du site</h2>
              <p className="mb-2">
                Le site <strong>reflet.app</strong> (ci-après "Reflet") est édité par :
              </p>
              <p className="mb-2">
                <strong>Ken Babatoundé</strong>, entrepreneur individuel, basé à Abomey-Calavi, Bénin. Contact : contact@reflet.app
              </p>
              <p>
                Reflet est actuellement édité en tant que personne physique, sans structure juridique enregistrée. Cette information est mise à jour si l'éditeur enregistre une structure juridique.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-primary mb-4">Hébergement</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Hébergement du site : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA</li>
                <li>Hébergement des données : Supabase Inc.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink-primary mb-4">Conditions générales d'utilisation</h2>
              <p className="mb-4">
                En accédant à Reflet et en créant un compte, vous acceptez les présentes conditions.
              </p>
              <ol className="list-decimal list-inside space-y-3">
                <li>
                  <strong>Objet du service.</strong> Reflet mesure la visibilité d'une marque dans les réponses générées par des intelligences artificielles conversationnelles (ChatGPT et, selon le plan, d'autres moteurs), et propose des recommandations pour l'améliorer.
                </li>
                <li>
                  <strong>Compte utilisateur.</strong> Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte. Vous devez fournir des informations exactes lors de l'inscription.
                </li>
                <li>
                  <strong>Usage autorisé.</strong> Vous vous engagez à ne pas utiliser Reflet pour contourner ses limites techniques (scripts automatisés, extraction massive de données, tentative d'accès aux comptes d'autres utilisateurs), ni à des fins illégales.
                </li>
                <li>
                  <strong>Disponibilité du service.</strong> Reflet est fourni "en l'état". Des interruptions ponctuelles pour maintenance ou liées à la disponibilité de services tiers (fournisseurs d'IA, hébergeur) peuvent survenir. Nous nous efforçons de maintenir un service disponible mais ne garantissons pas une disponibilité continue à 100 %.
                </li>
                <li>
                  <strong>Propriété intellectuelle.</strong> Le contenu du site Reflet (marque, design, code, textes) est la propriété de son éditeur. Les données que vous renseignez (nom de marque, questions suivies) restent les vôtres ; vous pouvez demander leur suppression à tout moment.
                </li>
                <li>
                  <strong>Résiliation.</strong> Vous pouvez résilier votre abonnement à tout moment depuis les paramètres de votre compte ou en nous contactant à contact@reflet.app. En cas de manquement grave à ces conditions, nous nous réservons le droit de suspendre ou clôturer un compte.
                </li>
                <li>
                  <strong>Modification des conditions.</strong> Ces conditions peuvent être mises à jour ; la date de dernière modification est indiquée en bas de page. Un changement substantiel vous sera notifié par email.
                </li>
                <li>
                  <strong>Droit applicable.</strong> Les présentes conditions sont soumises au droit béninois. Tout litige sera porté devant les juridictions compétentes du Bénin, sauf disposition impérative contraire applicable à votre lieu de résidence.
                </li>
              </ol>
            </section>

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
