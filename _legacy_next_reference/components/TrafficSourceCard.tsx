'use client'

import React from 'react'

const sources = [
  { name: 'Direct Traffic', share: 45, value: '$56,184', color: '#3758f9' },
  { name: 'Organic Search', share: 30, value: '$37,456', color: '#5e84fc' },
  { name: 'Social & Referral', share: 15, value: '$18,728', color: '#8b5cf6' },
  { name: 'Paid Campaigns', share: 10, value: '$12,485', color: '#22c55e' },
]

export function TrafficSourceCard() {
  return (
    <div className="p-6 rounded-xl bg-[#0a0a0a] border border-white/[0.07] flex flex-col justify-between space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white tracking-tight">
            Traffic Acquisition
          </h3>
          <span className="text-xs font-mono text-gray-400">Total 100%</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Revenue contribution by visitor origin channel.
        </p>
      </div>

      {/* Donut Visualization */}
      <div className="flex items-center justify-center py-2">
        <div className="relative size-36">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            {/* Base circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#171717"
              strokeWidth="12"
            />
            {/* Segment 1: Direct (45%) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#3758f9"
              strokeWidth="12"
              strokeDasharray="251.2"
              strokeDashoffset="138.16"
              strokeLinecap="round"
            />
            {/* Segment 2: Organic (30%) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#8b5cf6"
              strokeWidth="12"
              strokeDasharray="251.2"
              strokeDashoffset="175.84"
              className="rotate-162 origin-center"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
            <span className="text-2xl font-black text-white">45%</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Direct</span>
          </div>
        </div>
      </div>

      {/* Breakdown list */}
      <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
        {sources.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-gray-300 font-medium">{s.name}</span>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-white font-bold">{s.value}</span>
              <span className="text-gray-400 text-[11px] w-8 text-right">{s.share}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
