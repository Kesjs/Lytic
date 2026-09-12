'use client'

import React from 'react'

const recentUsers = [
  {
    name: 'Sarah Jenkins',
    email: 'sarah@hypergrowth.co',
    plan: 'Enterprise',
    status: 'Active',
    mrr: '+$299/mo',
    date: '2 hours ago',
    initials: 'SJ',
  },
  {
    name: 'David Larsson',
    email: 'david@nordictech.io',
    plan: 'Pro Plan',
    status: 'Active',
    mrr: '+$99/mo',
    date: '5 hours ago',
    initials: 'DL',
  },
  {
    name: 'Elena Rostova',
    email: 'elena@solostudio.design',
    plan: 'Pro Plan',
    status: 'Active',
    mrr: '+$99/mo',
    date: '1 day ago',
    initials: 'ER',
  },
  {
    name: 'Marcus Brody',
    email: 'marcus@brodyanalytics.com',
    plan: 'Starter',
    status: 'Trial',
    mrr: '+$29/mo',
    date: '1 day ago',
    initials: 'MB',
  },
]

export function RecentUsers() {
  return (
    <div className="p-6 rounded-xl bg-[#0a0a0a] border border-white/[0.07] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Recent Subscriber Signups
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            New customers onboarded in the last 24 hours.
          </p>
        </div>
        <span className="text-xs font-mono text-[#5e84fc] font-semibold">
          +18 today
        </span>
      </div>

      <div className="space-y-3">
        {recentUsers.map((user) => (
          <div
            key={user.email}
            className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/50 border border-white/[0.05] hover:border-white/15 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user.initials}
              </div>
              <div>
                <div className="text-xs font-semibold text-white">{user.name}</div>
                <div className="text-[11px] text-gray-400">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="text-xs font-bold font-mono text-[#22c55e] block">
                  {user.mrr}
                </span>
                <span className="text-[10.5px] text-gray-400 font-mono block">
                  {user.plan}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
