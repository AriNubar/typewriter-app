import { useState, useEffect, useRef } from 'react'
import { useSettings } from '../contexts/SettingsContext'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings } = useSettings()
  const [localSettings, setLocalSettings] = useState(settings)
  const isResetting = useRef(false)

  // Update local settings when modal opens or when global settings change (but not during reset)
  useEffect(() => {
    if (!isResetting.current) {
      setLocalSettings(settings)
    }
  }, [settings])

  // Reset the resetting flag when modal opens
  useEffect(() => {
    if (isOpen) {
      isResetting.current = false
    }
  }, [isOpen])

  // Auto-save when modal closes (but not during reset)
  useEffect(() => {
    if (!isOpen && !isResetting.current) {
      updateSettings(localSettings)
    }
  }, [isOpen])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleResetToDefaults = () => {
    isResetting.current = true
    resetSettings()
    
    // Set local settings to default values immediately
    const defaultSettings = {
      fontSize: 18,
      fontFamily: 'monospace' as const,
      colorTheme: 'blue' as const,
      autoAdvance: true,
      advanceDelay: 1500,
      showStats: true,
      soundEnabled: true,
      soundVolume: 0.5,  // Add default sound volume
      progressBarHeight: 1
    }
    
    setLocalSettings(defaultSettings)
    
    // Reset the flag after a short delay to allow the reset to complete
    setTimeout(() => {
      isResetting.current = false
    }, 100)
  }

  // Helper function to get height class or custom height
  const getHeightStyle = (height: number) => {
    const styleMap: { [key: number]: { className?: string, style?: React.CSSProperties } } = {
      0.5: { style: { height: '1px' } }, // Ultra thin line
      1: { style: { height: '2px' } },   // Thin line
      1.5: { style: { height: '3px' } }, // Very thin
      2: { className: 'h-2' },           // Tailwind h-2
      3: { className: 'h-3' },           // Tailwind h-3
      4: { className: 'h-4' },           // Tailwind h-4
      5: { className: 'h-5' },           // Tailwind h-5
      6: { className: 'h-6' }            // Tailwind h-6
    }
    return styleMap[height] || { className: 'h-4' }
  }

  const getHeightLabel = (height: number) => {
    const labelMap: { [key: number]: string } = {
      0.5: 'Ultra thin line',
      1: 'Thin line',
      1.5: 'Very thin',
      2: 'Thin',
      3: 'Medium thin',
      4: 'Medium',
      5: 'Medium thick',
      6: 'Thick'
    }
    return labelMap[height] || 'Medium'
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Font Size: {localSettings.fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="32"
                step="2"
                value={localSettings.fontSize || 18}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>12px</span>
                <span>32px</span>
              </div>
            </div>

            {/* Progress Bar Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Progress Bar Thickness: {getHeightLabel(localSettings.progressBarHeight || 1)}
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0.5"
                  max="6"
                  step="0.5"
                  value={localSettings.progressBarHeight || 1}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, progressBarHeight: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Line</span>
                  <span>Thick</span>
                </div>
                {/* Preview */}
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Preview:</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                    <div
                      className={`w-1/2 bg-blue-500 dark:bg-blue-600 transition-all duration-300 ease-out ${getHeightStyle(localSettings.progressBarHeight || 1).className || ''}`}
                      style={getHeightStyle(localSettings.progressBarHeight || 1).style}
                    />
                    {localSettings.progressBarHeight >= 4 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                          50%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Font Family
              </label>
              <select
                value={localSettings.fontFamily || 'monospace'}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="monospace">Default Monospace</option>
                <option value="courier">Courier New</option>
                <option value="consolas">Consolas</option>
                <option value="fira">Fira Code</option>
              </select>
            </div>

            {/* Color Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
                  { value: 'green', label: 'Green', color: 'bg-green-500' },
                  { value: 'red', label: 'Red', color: 'bg-red-500' },
                  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
                  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
                  { value: 'teal', label: 'Teal', color: 'bg-teal-500' },
                ].map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => setLocalSettings(prev => ({ ...prev, colorTheme: theme.value }))}
                    className={`p-2 rounded-md border-2 flex items-center space-x-2 ${
                      localSettings.colorTheme === theme.value
                        ? 'border-gray-800 dark:border-gray-200'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${theme.color}`}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Advance */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto Advance
              </label>
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, autoAdvance: !prev.autoAdvance }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.autoAdvance ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.autoAdvance ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Advance Delay */}
            {localSettings.autoAdvance && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auto Advance Delay: {((localSettings.advanceDelay || 1500) / 1000).toFixed(1)}s
                </label>
                <input
                  type="range"
                  min="1000"
                  max="5000"
                  step="250"
                  value={localSettings.advanceDelay || 1500}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, advanceDelay: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1.0s</span>
                  <span>5.0s</span>
                </div>
              </div>
            )}

            {/* Show Stats */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show Statistics
              </label>
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, showStats: !prev.showStats }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.showStats ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.showStats ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Sound Effects */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sound Effects
              </label>
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.soundEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Sound Volume */}
            {localSettings.soundEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sound Volume: {Math.round((localSettings.soundVolume || 0.5) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localSettings.soundVolume || 0.5}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, soundVolume: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>

          {/* Reset to Defaults Button */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleResetToDefaults}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
          </div>

          {/* Auto-save notice */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Settings are automatically saved when you close this modal
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}