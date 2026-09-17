import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchAdminEvents } from '~/lib/queries/admin-logs'
import { SectionCard } from '~/components/ui/section-card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const Route = createFileRoute('/admin/logs')({
  component: AdminLogs,
})

function AdminLogs() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => fetchAdminEvents(),
  })

  if (isLoading || !events) {
    return <div className="p-4 text-ink-muted">Chargement...</div>
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-danger'
      case 'warning': return 'text-warning'
      case 'success': return 'text-primary'
      default: return 'text-ink-secondary'
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-ink-primary">Logs Système</h1>

      <SectionCard title="Journal des événements (200 derniers)">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ink-secondary">
            <thead className="border-b border-border text-xs text-ink-muted">
              <tr>
                <th className="pb-3 pr-4 font-medium">Date</th>
                <th className="pb-3 px-4 font-medium">Type</th>
                <th className="pb-3 px-4 font-medium">Source</th>
                <th className="pb-3 px-4 font-medium">Marque</th>
                <th className="pb-3 pl-4 font-medium">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-surface/50">
                  <td className="py-3 pr-4 whitespace-nowrap text-xs">
                    {format(new Date(e.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${getEventColor(e.type)}`}>
                      {e.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-ink-muted">
                    {e.source_type}
                  </td>
                  <td className="py-3 px-4 font-medium text-ink-primary">
                    {e.brand_name || <span className="italic text-ink-muted">Système</span>}
                  </td>
                  <td className="py-3 pl-4">
                    <div className="font-medium text-ink-primary">{e.title}</div>
                    {e.message && <div className="text-xs text-ink-muted mt-0.5 line-clamp-1" title={e.message}>{e.message}</div>}
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-ink-muted">Aucun log trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
