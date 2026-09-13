/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { getSupabaseServerClient } from '~/lib/supabase/server'
import appCss from '~/styles/app.css?url'

const queryClient = new QueryClient()

// Une seule vérification de session à la racine, partagée par toutes les
// routes enfants via le contexte du router — pas un fetch par route.
const fetchSession = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = getSupabaseServerClient()
    const { data } = await supabase.auth.getUser()

    if (!data.user) return null

    return { id: data.user.id, email: data.user.email ?? null }
  } catch {
    return null
  }
})

export const Route = createRootRoute({
  beforeLoad: async () => {
    const user = await fetchSession()
    return { user }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Reflet — Visibilité de marque dans les réponses IA' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster theme="dark" position="top-center" richColors />
      </QueryClientProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-canvas text-ink-primary antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
