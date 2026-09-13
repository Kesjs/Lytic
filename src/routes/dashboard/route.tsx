import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Sidebar } from '~/components/dashboard/Sidebar'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      if (typeof window !== 'undefined') {
        try {
          const supabase = getSupabaseBrowserClient()
          const { data } = await supabase.auth.getUser()
          if (data?.user) {
            return { user: { id: data.user.id, email: data.user.email ?? null } }
          }
        } catch {
          // ignore
        }
      }
      throw redirect({ to: '/login' })
    }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <main className="ml-60 min-h-screen p-6">
        <Outlet />
      </main>
    </div>
  )
}
