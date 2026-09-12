'use client'

import React, { useState, useEffect } from 'react'
import {
  Search,
  Bell,
  Calendar,
  ChevronDown,
  Download,
  Filter,
  Menu,
  LogOut,
  User as UserIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface HeaderProps {
  isCollapsed?: boolean
  onToggleSidebar?: () => void
}

export function Header({ isCollapsed = false, onToggleSidebar }: HeaderProps) {
  const [period, setPeriod] = useState('Last 30 days')
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setUserEmail(data.user.email)
      }
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserEmail(null)
    window.location.href = '/login'
  }


  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-black/90 backdrop-blur-md border-b border-white/[0.06] px-6 flex items-center justify-between select-none">
      {/* Left: Sidebar Toggle Button + Search Input */}
      <div className="flex items-center gap-3 w-72 md:w-[420px]">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg bg-neutral-900/80 border border-white/[0.06] text-neutral-400 hover:text-white transition-all cursor-pointer shrink-0"
            title={isCollapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'}
          >
            <Menu className="size-4" />
          </button>
        )}

        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search metrics, campaigns, users..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-neutral-900/80 border border-white/[0.06] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-all"
          />
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Date Period Filter Button */}
        <div className="relative hidden sm:flex items-center">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/80 border border-white/[0.06] text-xs font-medium text-neutral-300 hover:border-neutral-600 transition-all cursor-pointer"
          >
            <Calendar className="size-3.5 text-[#5e84fc]" />
            <span>{period}</span>
            <ChevronDown className="size-3 text-neutral-500" />
          </button>
        </div>

        {/* Export Button */}
        <button
          type="button"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900/80 border border-white/[0.06] text-xs font-medium text-neutral-300 hover:text-white transition-all cursor-pointer"
        >
          <Download className="size-3.5 text-neutral-400" />
          <span>Export CSV</span>
        </button>

        {/* Notifications Icon */}
        <button
          type="button"
          className="relative p-2 rounded-lg bg-neutral-900/80 border border-white/[0.06] text-neutral-400 hover:text-white transition-all cursor-pointer"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#ef4444] animate-ping" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#ef4444]" />
        </button>

        {/* User avatar / Login / Logout */}
        {userEmail ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-white/[0.08] text-xs text-neutral-300">
              <UserIcon className="size-3.5 text-[#F5C518]" />
              <span className="max-w-[120px] truncate">{userEmail}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Se déconnecter"
              className="p-1.5 rounded-lg bg-neutral-900/80 border border-white/[0.06] text-neutral-400 hover:text-[#ef4444] transition-all cursor-pointer"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <a
            href="/login"
            title="Se connecter"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#3758f9] hover:bg-[#2e49d6] text-xs font-semibold text-white transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <span>Connexion</span>
          </a>
        )}
      </div>
    </header>
  )
}
