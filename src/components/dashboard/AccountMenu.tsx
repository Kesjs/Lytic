import { useState, useEffect, useRef } from 'react'
import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { Settings, LogOut, ChevronsUpDown } from 'lucide-react'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'

// Menu profil partagé — utilisé dans le pied de la Sidebar (variant "sidebar")
// et dans le Header sur mobile (variant "header") pour raccourcir l'accès au
// compte sans avoir à ouvrir le tiroir puis scroller jusqu'en bas.
interface AccountMenuProps {
  variant: 'sidebar' | 'header'
  isCollapsed?: boolean
  onNavigate?: () => void
}

export function AccountMenu({ variant, isCollapsed = false, onNavigate }: AccountMenuProps) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserEmail(data.user.email)
    })
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    navigate({ to: '/login' })
  }

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U'

  const dropdown = isDropdownOpen && (
    <div
      className={`absolute rounded-lg border border-border bg-elevated p-1.5 shadow-2xl z-50 w-56 ${
        variant === 'header'
          ? 'right-0 top-full mt-2'
          : `bottom-full mb-2 ${isCollapsed ? 'left-2' : 'left-2 right-2 w-auto'}`
      }`}
    >
      <div className="px-2.5 py-2 border-b border-border/60">
        <p className="text-[11px] font-medium text-ink-muted">Connecté en tant que</p>
        <p className="truncate text-xs font-semibold text-ink-primary mt-0.5">
          {userEmail || 'Utilisateur'}
        </p>
      </div>

      <div className="mt-1 space-y-0.5">
        <Link
          to="/dashboard/parametres"
          onClick={() => {
            setIsDropdownOpen(false)
            onNavigate?.()
          }}
          className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
            pathname.startsWith('/dashboard/parametres')
              ? 'bg-elevated text-ink-primary'
              : 'text-ink-secondary hover:bg-elevated/80 hover:text-ink-primary'
          }`}
        >
          <Settings className="size-4 text-ink-muted" />
          Paramètres
        </Link>

        <div className="my-1 border-t border-border/60" />

        <button
          type="button"
          onClick={() => {
            setIsDropdownOpen(false)
            handleLogout()
          }}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="size-4 text-red-400" />
          Déconnexion
        </button>
      </div>
    </div>
  )

  const avatar = (
    <div className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-ink-primary border border-border">
      {userInitial}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-success ring-2 ring-black" />
        </TooltipTrigger>
        <TooltipContent>En ligne</TooltipContent>
      </Tooltip>
    </div>
  )

  if (variant === 'header') {
    return (
      <div className="relative" ref={dropdownRef}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center justify-center rounded-full transition-colors hover:opacity-80"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              aria-label="Mon compte"
            >
              {avatar}
            </button>
          </TooltipTrigger>
          <TooltipContent>{userEmail || 'Mon compte'}</TooltipContent>
        </Tooltip>
        {dropdown}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {dropdown}
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex w-full items-center rounded-lg transition-colors justify-center p-2 hover:bg-elevated/60 text-ink-secondary hover:text-ink-primary"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              {avatar}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{userEmail || 'Mon compte'}</TooltipContent>
        </Tooltip>
      ) : (
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className={`flex w-full items-center rounded-lg transition-colors gap-2.5 px-2.5 py-2 text-left ${
            isDropdownOpen
              ? 'bg-elevated text-ink-primary'
              : 'hover:bg-elevated/60 text-ink-secondary hover:text-ink-primary'
          }`}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          {avatar}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-ink-primary">
              {userEmail || 'Mon compte'}
            </p>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-ink-muted" />
        </button>
      )}
    </div>
  )
}
