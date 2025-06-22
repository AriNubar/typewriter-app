import { useState } from 'react'
import TextDisplay from './components/TextDisplay'
import StatsBar from './components/StatsBar'
import SessionHistory from './components/SessionHistory'
import SettingsModal from './components/SettingsModal'
import FileUploader from './components/FileUploader'
import useTypewriter from './hooks/useTypewriter'
import { SAMPLE_TEXTS } from './data/sampleTexts'
import { SettingsProvider, useSettings } from './contexts/SettingsContext'

function TypewriterApp() {
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showFileUploader, setShowFileUploader] = useState(false)
  const [customTexts, setCustomTexts] = useState<string[]>([])
  const [isCustomMode, setIsCustomMode] = useState(false)
  const { settings } = useSettings()
  
  // Use custom texts if in custom mode, otherwise use sample texts
  const currentTexts = isCustomMode && customTexts.length > 0 ? customTexts : SAMPLE_TEXTS
  
  console.log('App state:', {
    isCustomMode,
    customTextsLength: customTexts.length,
    currentTextsLength: currentTexts.length,
    firstText: currentTexts[0]?.substring(0, 50) + '...'
  })
  
  const {
    typedText,
    currentIndex,
    currentTextIndex,
    currentText,
    wpm,
    accuracy,
    sessionHistory,
    isTransitioning,
    reset,
    skipToNext,
    stats,
    roundNumber,
    isRoundComplete,
    totalTexts,
  } = useTypewriter(currentTexts)

  const handleButtonClick = (action: () => void) => {
    action()
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  const handleCustomTextsLoaded = (texts: string[]) => {
    console.log('Custom texts loaded:', texts.length, 'texts')
    setCustomTexts(texts)
    setIsCustomMode(true)
  }

  const handleSwitchToSampleTexts = () => {
    console.log('Switching to sample texts')
    setIsCustomMode(false)
  }

  // Dynamic theme colors based on settings
  const getThemeColors = () => {
    switch (settings.colorTheme) {
      case 'green': return 'from-green-600 to-emerald-600'
      case 'red': return 'from-red-600 to-pink-600'
      case 'purple': return 'from-purple-600 to-indigo-600'
      case 'orange': return 'from-orange-600 to-red-600'
      case 'teal': return 'from-teal-600 to-cyan-600'
      default: return 'from-blue-600 to-purple-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-8">
          <h1 className={`text-5xl font-bold bg-gradient-to-r ${getThemeColors()} bg-clip-text text-transparent mb-4`}>
            ⌨️ Typewriter Pro
          </h1>
          
          {/* Mode Indicator and Switcher */}
          <div className="mt-4 flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Mode:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isCustomMode 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {isCustomMode ? `Custom (${customTexts.length} texts)` : 'Sample Texts'}
              </span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleButtonClick(() => setShowFileUploader(true))}
                className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                📄 Upload Text
              </button>
              
              {isCustomMode && (
                <button
                  onClick={() => handleButtonClick(handleSwitchToSampleTexts)}
                  className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Use Sample Texts
                </button>
              )}
            </div>
          </div>
        </header>


        <TextDisplay 
          text={currentText}
          typedText={typedText}
          currentIndex={currentIndex}
          errorPositions={stats.errorPositions}  // Changed from errors to errorPositions
          fontFamily={settings.fontFamily}
          fontSize={settings.fontSize}
        />

        {settings.showStats && (
          <StatsBar 
            wpm={wpm}
            accuracy={accuracy}
            errors={stats.errorPositions}  // Make sure StatsBar also uses errorPositions
            sessionHistory={sessionHistory}
            currentTextIndex={currentTextIndex}
            isTransitioning={isTransitioning}
          />
        )}

        <SessionHistory 
          sessionHistory={sessionHistory}
          isVisible={showHistory}
          onToggle={() => setShowHistory(!showHistory)}
        />

        <div className="fixed bottom-6 right-6 flex space-x-3">
          <button 
            onClick={() => handleButtonClick(() => setShowSettings(true))}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg transition-colors focus:outline-none"
            title="Settings"
          >
            ⚙️
          </button>
          <button 
            onClick={() => handleButtonClick(reset)}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow-lg transition-colors focus:outline-none"
          >
            🔄 Reset All
          </button>
          <button 
            onClick={() => handleButtonClick(skipToNext)}
            disabled={isTransitioning && settings.autoAdvance}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg shadow-lg transition-colors focus:outline-none"
          >
            ⏭️ Skip
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {isTransitioning 
            ? (settings.autoAdvance
                ? (isRoundComplete 
                    ? `Round ${roundNumber} completed! Starting round ${roundNumber + 1}...`
                    : "Moving to next text...")
                : "Text completed! Use Skip button to continue or enable auto-advance in settings.")
            : `Round ${roundNumber} • Text ${currentTextIndex + 1} of ${totalTexts} • ${isCustomMode ? 'Custom texts' : 'Random order, no repeats!'}`
          }
        </div>
      </div>

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      
      <FileUploader
        isOpen={showFileUploader}
        onClose={() => setShowFileUploader(false)}
        onTextsLoaded={handleCustomTextsLoaded}
      />
    </div>
  )
}

function App() {
  return (
    <SettingsProvider>
      <TypewriterApp />
    </SettingsProvider>
  )
}

export default App