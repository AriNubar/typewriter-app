/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface Settings {
  fontSize: number
  fontFamily: string
  colorTheme: string
  autoAdvance: boolean
  advanceDelay: number
  showStats: boolean
  soundEnabled: boolean
  soundVolume: number  // Add this property
  progressBarHeight: number
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
  resetSettings: () => void
}

const defaultSettings: Settings = {
  fontSize: 18,
  fontFamily: 'monospace',
  colorTheme: 'blue',
  autoAdvance: true,
  advanceDelay: 1500,
  showStats: true,
  soundEnabled: true,
  soundVolume: 0.5,  // Add default volume (50%)
  progressBarHeight: 1 // Changed default to thinnest option
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('typewriter-settings')
    if (saved) {
      const parsedSettings = JSON.parse(saved)
      // Merge with defaults to ensure new settings are included
      return { ...defaultSettings, ...parsedSettings }
    }
    return defaultSettings
  })

  useEffect(() => {
    localStorage.setItem('typewriter-settings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}