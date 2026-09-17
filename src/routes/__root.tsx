/// <reference types="vite/client" />
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { TooltipProvider } from '~/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { getSupabaseServerClient } from '~/lib/supabase/server'
import { ThemeProvider, THEME_STORAGE_KEY, useTheme } from '~/components/theme-provider'
import { LanguageProvider } from '~/lib/i18n/LanguageContext'
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
      { name: 'theme-color', content: '#c9ab1e' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const [toastPosition, setToastPosition] = useState<'top-center' | 'bottom-right'>('bottom-right')

  useEffect(() => {
    const handlePreloadError = () => {
      window.location.reload()
    }
    window.addEventListener('vite:preloadError', handlePreloadError)

    const checkMobile = () => {
      setToastPosition(window.innerWidth < 768 ? 'top-center' : 'bottom-right')
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('vite:preloadError', handlePreloadError)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return (
    <RootDocument>
      <LanguageProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Outlet />
              <ThemedToaster toastPosition={toastPosition} />
            </TooltipProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </LanguageProvider>
    </RootDocument>
  )
}

// Isolé pour pouvoir appeler useTheme() — le Toaster suit désormais le thème
// actif au lieu d'être figé en theme="dark".
function ThemedToaster({ toastPosition }: { toastPosition: 'top-center' | 'bottom-right' }) {
  const { theme } = useTheme()
  return (
    <Toaster
      theme={theme}
      position={toastPosition}
      toastOptions={{
        classNames: {
          toast: 'bg-surface border border-border text-ink-primary shadow-xl font-medium',
        },
      }}
    />
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning : le script ci-dessous peut corriger la classe
    // avant l'hydratation React si le thème stocké diffère du rendu serveur
    // (toujours "dark" côté serveur, faute de connaître le localStorage).
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Anti-flash : applique le thème stocké AVANT le premier paint,
            pour ne pas voir un flash sombre puis clair (ou l'inverse) au
            chargement. Doit utiliser la même clé que THEME_STORAGE_KEY. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var isLight=t==='light';document.documentElement.classList.toggle('light',isLight);document.documentElement.classList.toggle('dark',!isLight);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-canvas text-ink-primary antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
