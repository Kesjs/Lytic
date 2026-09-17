import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchAdminUsers } from '~/lib/queries/admin-users'
import { SectionCard } from '~/components/ui/section-card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const Route = createFileRoute('/admin/utilisateurs')({
  component: AdminUsers,
})

function AdminUsers() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetchAdminUsers(),
  })

  if (isLoading || !users) {
    return <div className="p-4 text-ink-muted">Chargement...</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink-primary">Utilisateurs</h1>

      <SectionCard title="Liste des comptes inscrits">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ink-secondary">
            <thead className="border-b border-border text-xs text-ink-muted">
              <tr>
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 px-4 font-medium">Inscription</th>
                <th className="pb-3 px-4 font-medium">Role</th>
                <th className="pb-3 pl-4 font-medium">Marque & Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface/50">
                  <td className="py-3 pr-4 font-medium text-ink-primary">{u.email}</td>
                  <td className="py-3 px-4">
                    {format(new Date(u.created_at), 'dd MMM yyyy', { locale: fr })}
                  </td>
                  <td className="py-3 px-4">
                    {u.is_admin ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Admin</span>
                    ) : (
                      <span className="rounded-full bg-surface px-2 py-0.5 text-xs">Utilisateur</span>
                    )}
                  </td>
                  <td className="py-3 pl-4">
                    {u.brands.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {u.brands.map((b) => (
                          <div key={b.id} className="flex items-center gap-2">
                            <span className="font-medium text-ink-primary">{b.name}</span>
                            <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] uppercase text-ink-muted">
                              {b.plan}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-ink-muted italic">Aucune</span>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-ink-muted">Aucun utilisateur.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
