'use client'

import React, { useState } from 'react'
import { TrendingUp, ArrowUpRight } from 'lucide-react'

export function RevenueChart() {
  const [selectedRange, setSelectedRange] = useState<'7D' | '1M' | '1Y'>('1M')

  return (
    <div className="p-6 rounded-xl bg-[#0d1322] border border-[#1e293b] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Revenue Performance
            </h3>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#3758f9]/15 text-[#5e84fc] text-xs font-mono font-semibold">
              <TrendingUp className="size-3" />
              +14.2% Growth
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Comparing current gross revenue ($124,854) against previous cycle forecast.
          </p>
        </div>

        {/* Period Switcher */}
        <div className="flex items-center p-1 rounded-lg bg-[#151f32] border border-[#1e293b] text-xs font-mono">
          {(['7D', '1M', '1Y'] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setSelectedRange(range)}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                selectedRange === range
                  ? 'bg-[#3758f9] text-white font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Multi-curve Area Chart */}
      <div className="h-64 w-full pt-4">
        <svg viewBox="0 0 700 220" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="lyticBlueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3758f9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3758f9" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lyticPurpleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          <line x1="0" y1="30" x2="700" y2="30" stroke="#1e293b" strokeDasharray="4 4" />
          <line x1="0" y1="80" x2="700" y2="80" stroke="#1e293b" strokeDasharray="4 4" />
          <line x1="0" y1="130" x2="700" y2="130" stroke="#1e293b" strokeDasharray="4 4" />
          <line x1="0" y1="180" x2="700" y2="180" stroke="#1e293b" strokeDasharray="4 4" />

          {/* Area 2: Forecast baseline */}
          <polygon
            points="0,200 0,160 100,150 200,135 300,140 400,110 500,95 600,85 700,70 700,200"
            fill="url(#lyticPurpleGrad)"
          />
          <polyline
            points="0,160 100,150 200,135 300,140 400,110 500,95 600,85 700,70"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />

          {/* Area 1: Actual Revenue */}
          <polygon
            points="0,200 0,140 100,120 200,105 300,115 400,75 500,60 600,45 700,25 700,200"
            fill="url(#lyticBlueGrad)"
          />
          <polyline
            points="0,140 100,120 200,105 300,115 400,75 500,60 600,45 700,25"
            fill="none"
            stroke="#3758f9"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Floating Data Point */}
          <circle cx="700" cy="25" r="5" fill="#ffffff" stroke="#3758f9" strokeWidth="3" />
          <circle cx="500" cy="60" r="4" fill="#3758f9" />
        </svg>
      </div>

      {/* Footer Stats & Legend */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#1e293b] text-xs">
        <div>
          <span className="text-gray-400 block font-medium">Actual Revenue</span>
          <span className="text-sm font-bold font-mono text-white mt-0.5 block">
            $124,854.00
          </span>
        </div>
        <div>
          <span className="text-gray-400 block font-medium">Target Forecast</span>
          <span className="text-sm font-bold font-mono text-gray-300 mt-0.5 block">
            $110,000.00
          </span>
        </div>
        <div>
          <span className="text-gray-400 block font-medium">Net Profit Margin</span>
          <span className="text-sm font-bold font-mono text-[#22c55e] mt-0.5 block">
            34.8%
          </span>
        </div>
      </div>
    </div>
  )
}
