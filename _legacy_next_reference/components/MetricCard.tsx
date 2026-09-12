'use client'

import React from 'react'
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string
  change: string
  isPositive: boolean
  description: string
  icon: LucideIcon
  sparklinePoints: string
}

export function MetricCard({
  title,
  value,
  change,
  isPositive,
  description,
  icon: Icon,
  sparklinePoints,
}: MetricCardProps) {
  return (
    <div className="p-5 rounded-xl bg-[#0a0a0a] border border-white/[0.07] hover:border-white/20 transition-all space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-900 text-neutral-200 border border-white/[0.08]">
            <Icon className="size-4" />
          </div>
          <span className="text-xs font-medium text-gray-400">{title}</span>
        </div>
        <div
          className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono ${
            isPositive
              ? 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30'
              : 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30'
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="size-3" />
          ) : (
            <ArrowDownRight className="size-3" />
          )}
          <span>{change}</span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {value}
          </div>
          <p className="text-[11.5px] text-gray-400 mt-1">{description}</p>
        </div>

        {/* Mini Sparkline Chart */}
        <div className="w-20 h-9 shrink-0">
          <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
            <polyline
              points={sparklinePoints}
              fill="none"
              stroke={isPositive ? '#22c55e' : '#ef4444'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
