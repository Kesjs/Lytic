import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchSignupAttempts } from '~/lib/queries/admin-abuse'
import { SectionCard } from '~/components/ui/section-card'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export const Route = createFileRoute('/admin/abus')({
  component: AdminAbuse,
})

function AdminAbuse() {
  const { data: attempts, isLoading } = useQuery({
    queryKey: ['admin-abuse'],
    queryFn: () => fetchSignupAttempts(),
  })

  if (isLoading || !attempts) {
    return <div className="p-4 text-ink-muted">Chargement...</div>
  }

  // Filtrer pour ne montrer que les IPs ayant plus de 1 essai pour alléger la vue
  const suspiciousAttempts = attempts.filter(a => a.attempts > 1)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink-primary">Détection d'abus</h1>

      <SectionCard title="Tentatives d'inscription suspectes">
        {suspiciousAttempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink-secondary">
              <thead className="border-b border-border text-xs text-ink-muted">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Adresse IP</th>
                  <th className="pb-3 px-4 font-medium">Nombre d'essais</th>
                  <th className="pb-3 pl-4 font-medium">Dernier essai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {suspiciousAttempts.map((a) => (
                  <tr key={a.ip_address} className="hover:bg-surface/50">
                    <td className="py-3 pr-4 font-mono text-ink-primary">{a.ip_address}</td>
                    <td className="py-3 px-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.attempts > 5 ? 'bg-danger/15 text-danger' : 'bg-warning/15 text-warning'
                      }`}>
                        {a.attempts} tentatives
                      </span>
                    </td>
                    <td className="py-3 pl-4">
                      {formatDistanceToNow(new Date(a.last_attempt), { addSuffix: true, locale: fr })}
                      <div className="text-xs text-ink-muted mt-0.5">
                        {format(new Date(a.last_attempt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-ink-muted">Aucune activité suspecte détectée récemment.</div>
        )}
      </SectionCard>
    </div>
  )
}
