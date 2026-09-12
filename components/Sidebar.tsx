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
  ChevronLeft,
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

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const [activeItem, setActiveItem] = useState('Overview')

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 bg-black border-r border-white/[0.06] flex flex-col justify-between select-none transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Floating Toggle Button on Border */}
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute -right-3 top-20 z-50 size-6 rounded-full bg-neutral-900 border border-white/20 text-neutral-400 hover:text-white hover:scale-110 flex items-center justify-center shadow-lg cursor-pointer transition-all"
          title={isCollapsed ? 'Agrandir le menu' : 'Réduire le menu'}
        >
          {isCollapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <ChevronLeft className="size-3.5" />
          )}
        </button>
      )}

      <div>
        {/* Brand Header */}
        <div
          className={`h-16 flex items-center border-b border-white/[0.06] transition-all ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#3758f9] to-[#5e84fc] text-white font-black text-lg shadow-md shadow-[#3758f9]/25">
              L
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-white tracking-tight">Lytic</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#3758f9]/20 text-[#5e84fc] uppercase">
                    Pro
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 truncate">TailGrids Analytics</span>
              </div>
            )}
          </div>

          {!isCollapsed && onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
              title="Réduire la sidebar"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <div className={`py-6 space-y-6 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Main Menu
              </span>
            )}
            <div className="mt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeItem === item.name
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setActiveItem(item.name)}
                    title={isCollapsed ? item.name : undefined}
                    className={`w-full flex items-center rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isCollapsed
                        ? 'justify-center py-2.5 px-2'
                        : 'justify-between px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-[#3758f9] text-white shadow-sm shadow-[#3758f9]/30 font-semibold'
                        : 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`size-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-gray-400'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>
                    {!isCollapsed && isActive && (
                      <span className="size-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div
            className={`space-y-1 pt-4 border-t border-white/[0.06] ${
              isCollapsed ? 'border-none' : ''
            }`}
          >
            {!isCollapsed ? (
              <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Preferences
              </span>
            ) : (
              <div className="w-8 mx-auto my-2 border-t border-white/[0.06]" />
            )}
            <div className="mt-2 space-y-1">
              {settingsItems.map((item) => {
                const Icon = item.icon
                const isActive = activeItem === item.name
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setActiveItem(item.name)}
                    title={isCollapsed ? item.name : undefined}
                    className={`w-full flex items-center rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isCollapsed
                        ? 'justify-center py-2.5 px-2'
                        : 'justify-between px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-[#3758f9] text-white font-semibold'
                        : 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`size-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-gray-400'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* User Workspace Profile */}
      <div className="p-3 border-t border-white/[0.06] bg-black">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <div
              className="size-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white text-xs shrink-0 cursor-pointer"
              title="TailGrids Team (admin@lytic.dev)"
            >
              TG
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/60 border border-white/[0.06]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
                TG
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">
                  TailGrids Team
                </span>
                <span className="text-[10px] text-gray-400 truncate">
                  admin@lytic.dev
                </span>
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
        )}
      </div>
    </aside>
  )
}
