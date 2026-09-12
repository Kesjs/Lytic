'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  BarChart3,
  DollarSign,
  Users,
  Megaphone,
  FileText,
  Settings,
  CreditCard,
  Layers,
  ChevronRight,
  LogOut,
  Sparkles,
} from 'lucide-react'

const navItems = [
  { name: 'Overview', href: '#', icon: LayoutDashboard, current: true },
  { name: 'Analytics', href: '#', icon: BarChart3, current: false },
  { name: 'Revenue', href: '#', icon: DollarSign, current: false },
  { name: 'Users', href: '#', icon: Users, current: false },
  { name: 'Campaigns', href: '#', icon: Megaphone, current: false },
  { name: 'Reports', href: '#', icon: FileText, current: false },
]

const settingsItems = [
  { name: 'Integrations', href: '#', icon: Layers, current: false },
  { name: 'Billing', href: '#', icon: CreditCard, current: false },
  { name: 'Settings', href: '#', icon: Settings, current: false },
]

export function Sidebar() {
  const [activeItem, setActiveItem] = useState('Overview')

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0d1322] border-r border-[#1e293b] flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[#1e293b]">
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-tr from-[#3758f9] to-[#5e84fc] text-white font-black text-lg shadow-md shadow-[#3758f9]/25">
            L
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-white tracking-tight">Lytic</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#3758f9]/20 text-[#5e84fc] uppercase">
                Pro
              </span>
            </div>
            <span className="text-[11px] text-gray-400">TailGrids Analytics</span>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="px-4 py-6 space-y-6">
          <div className="space-y-1">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Main Menu
            </span>
            <div className="mt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeItem === item.name
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setActiveItem(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#3758f9] text-white shadow-sm shadow-[#3758f9]/30 font-semibold'
                        : 'text-gray-400 hover:bg-[#151f32] hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`size-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <span className="size-1.5 rounded-full bg-white animate-pulse" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1 pt-4 border-t border-[#1e293b]/80">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Preferences
            </span>
            <div className="mt-2 space-y-1">
              {settingsItems.map((item) => {
                const Icon = item.icon
                const isActive = activeItem === item.name
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setActiveItem(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#3758f9] text-white font-semibold'
                        : 'text-gray-400 hover:bg-[#151f32] hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`size-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span>{item.name}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* User Workspace Profile */}
      <div className="p-4 border-t border-[#1e293b] bg-[#090e1a]/60">
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#151f32] border border-[#1e293b]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
              TG
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">TailGrids Team</span>
              <span className="text-[10px] text-gray-400 truncate">admin@lytic.dev</span>
            </div>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
