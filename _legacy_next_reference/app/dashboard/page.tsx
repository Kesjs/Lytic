'use client'

import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { MetricCard } from '@/components/MetricCard'
import { RevenueChart } from '@/components/RevenueChart'
import { TrafficSourceCard } from '@/components/TrafficSourceCard'
import { CampaignsTable } from '@/components/CampaignsTable'
import { RecentUsers } from '@/components/RecentUsers'

export default function LyticDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [supabaseData, setSupabaseData] = useState<{
    connected: boolean
    tablesAccessible: boolean
    brands: any[]
    runs: any[]
    opportunities: any[]
    competitors: any[]
    error?: string | null
  } | null>(null)
  const [copiedSql, setCopiedSql] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((data) => setSupabaseData(data))
      .catch((err) => console.error('Dashboard fetch error:', err))
  }, [])

  const grantSql = `GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`

  const handleCopySql = () => {
    navigator.clipboard.writeText(grantSql)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 flex">
      {/* 1. Left Sidebar */}
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

      {/* 2. Main Content Container */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Header */}
        <Header isCollapsed={isCollapsed} onToggleSidebar={() => setIsCollapsed(!isCollapsed)} />

        {/* Dashboard Body */}
        <main className="p-8 space-y-8 flex-1">
          {/* Supabase Status & SQL Permission Notice (if tables need grant) */}
          {supabaseData && !supabaseData.tablesAccessible && (
            <div className="rounded-xl border border-[#F5C518]/30 bg-[#F5C518]/5 p-4 text-xs text-neutral-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-4 text-[#F5C518] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">
                    Supabase connecté (nmzpskxclwcqnkmkpqkh) — Privilèges tables requis
                  </span>
                  <p className="text-neutral-400 mt-0.5">
                    PostgreSQL requiert d&apos;accorder les droits SELECT/ALL au rôle{' '}
                    <code className="text-[#F5C518]">service_role</code> dans l&apos;éditeur SQL Supabase pour charger vos tables en direct.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5C518] hover:bg-[#d9ac0e] text-black font-semibold text-xs shrink-0 transition-all cursor-pointer shadow-sm"
              >
                {copiedSql ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                <span>{copiedSql ? 'Copié !' : 'Copier SQL Grant'}</span>
              </button>
            </div>
          )}

          {/* Welcome Banner / Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  SaaS Analytics Overview
                </h1>
                {supabaseData?.connected && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30">
                    Supabase Live
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {supabaseData?.brands?.[0]?.name
                  ? `Marque active : ${supabaseData.brands[0].name} — ${supabaseData.brands[0].website_url || ''}`
                  : 'Real-time tracking of AI visibility, revenue, subscribers and conversion rates.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 font-mono text-xs font-semibold">
                <span className="size-2 rounded-full bg-[#22c55e] animate-ping" />
                Live Telemetry: 99.98%
              </span>
            </div>
          </div>

          {/* 3. 4 Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <MetricCard
              title="Total Revenue"
              value="$124,854.00"
              change="+14.2%"
              isPositive={true}
              description="vs. $109,320 last month"
              icon={DollarSign}
              sparklinePoints="0,35 20,30 40,25 60,18 80,12 100,5"
            />
            <MetricCard
              title="Monthly Recurring Revenue"
              value="$28,450.00"
              change="+8.1%"
              isPositive={true}
              description="+$2,130 new active subs"
              icon={TrendingUp}
              sparklinePoints="0,30 20,28 40,20 60,22 80,14 100,8"
            />
            <MetricCard
              title="Total Active Users"
              value="48,290"
              change="+22.4%"
              isPositive={true}
              description="3,120 signups this week"
              icon={Users}
              sparklinePoints="0,38 20,32 40,22 60,15 80,8 100,2"
            />
            <MetricCard
              title="Avg. Conversion Rate"
              value="4.82%"
              change="-0.4%"
              isPositive={false}
              description="Bounce rate down to 32%"
              icon={Activity}
              sparklinePoints="0,10 20,15 40,12 60,25 80,22 100,28"
            />
          </div>

          {/* 4. Middle Analytics Grid: Revenue Performance & Traffic Sources */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-8">
              <RevenueChart />
            </div>
            <div className="xl:col-span-4">
              <TrafficSourceCard />
            </div>
          </div>

          {/* 5. Bottom Analytics Grid: Top Campaigns & Recent Users */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-7">
              <CampaignsTable />
            </div>
            <div className="xl:col-span-5">
              <RecentUsers />
            </div>
          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="h-14 border-t border-white/[0.06] px-8 flex items-center justify-between text-xs text-neutral-400 bg-black">
          <span>Lytic React SaaS Template © 2026 TailGrids</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-gray-300 cursor-pointer">Documentation</span>
            <span className="hover:text-gray-300 cursor-pointer">API Status</span>
            <span className="hover:text-gray-300 cursor-pointer">Support</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
