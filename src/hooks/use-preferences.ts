import { useState, useEffect } from 'react'

export type SidebarState = 'expanded' | 'collapsed' | 'hidden'
export type DashboardDensity = 'compact' | 'spacious'

interface Preferences {
  sidebarState: SidebarState
  dashboardDensity: DashboardDensity
}

const DEFAULT_PREFERENCES: Preferences = {
  sidebarState: 'expanded',
  dashboardDensity: 'compact'
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem('lytic-preferences')
        if (item) {
          return JSON.parse(item) as Preferences
        }
      }
    } catch (error) {
      console.warn('Error reading preferences from localStorage', error)
    }
    return DEFAULT_PREFERENCES
  })

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('lytic-preferences', JSON.stringify(preferences))
      }
    } catch (error) {
      console.warn('Error saving preferences to localStorage', error)
    }
  }, [preferences])

  const setSidebarState = (state: SidebarState) => {
    setPreferences((prev) => ({ ...prev, sidebarState: state }))
  }

  const setDashboardDensity = (density: DashboardDensity) => {
    setPreferences((prev) => ({ ...prev, dashboardDensity: density }))
  }

  return {
    ...preferences,
    setSidebarState,
    setDashboardDensity,
    setPreferences
  }
}
