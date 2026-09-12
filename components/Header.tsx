'use client'

import React, { useState } from 'react'
import {
  Search,
  Bell,
  Calendar,
  ChevronDown,
  Download,
  Filter,
} from 'lucide-react'

export function Header() {
  const [period, setPeriod] = useState('Last 30 days')

  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-[#0d1322]/90 backdrop-blur-md border-b border-[#1e293b] px-6 flex items-center justify-between select-none">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-72 md:w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search metrics, campaigns, users..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#151f32] border border-[#1e293b] text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#3758f9] transition-all"
          />
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Date Period Filter Button */}
        <div className="relative hidden sm:flex items-center">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151f32] border border-[#1e293b] text-xs font-medium text-gray-200 hover:border-gray-600 transition-all cursor-pointer"
          >
            <Calendar className="size-3.5 text-[#5e84fc]" />
            <span>{period}</span>
            <ChevronDown className="size-3 text-gray-400" />
          </button>
        </div>

        {/* Export Button */}
        <button
          type="button"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151f32] border border-[#1e293b] text-xs font-medium text-gray-200 hover:text-white transition-all cursor-pointer"
        >
          <Download className="size-3.5 text-gray-400" />
          <span>Export CSV</span>
        </button>

        {/* Notifications Icon */}
        <button
          type="button"
          className="relative p-2 rounded-lg bg-[#151f32] border border-[#1e293b] text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#ef4444] animate-ping" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#ef4444]" />
        </button>

        {/* User avatar / Login Button */}
        <a
          href="/login"
          title="Se connecter"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#3758f9] hover:bg-[#2e49d6] text-xs font-semibold text-white transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
        >
          <span>Connexion</span>
        </a>
      </div>
    </header>
  )
}
