import type { SessionEntry } from '../hooks/useTypewriter'

interface StatsBarProps {
  wpm: number
  accuracy: number
  errors: Set<number>  // Changed to Set<number> to match errorPositions
  sessionHistory: SessionEntry[]  // Changed to SessionEntry[]
  currentTextIndex: number
  isTransitioning: boolean
}

export default function StatsBar({ 
  wpm, 
  accuracy, 
  errors, 
  sessionHistory, 
  currentTextIndex, 
  isTransitioning 
}: StatsBarProps) {
  const errorCount = errors.size  // Get count from Set
  const lastSession = sessionHistory.length > 0 ? sessionHistory[sessionHistory.length - 1] : null
  const penultimateSession = sessionHistory.length > 1 ? sessionHistory[sessionHistory.length - 2] : null

  // Calculate best scores from all completed sessions
  const bestScores = sessionHistory.length > 0 ? {
    bestWpm: Math.max(...sessionHistory.map(s => s.wpm)),
    bestAccuracy: Math.max(...sessionHistory.map(s => s.accuracy)),
    fewestErrors: Math.min(...sessionHistory.map(s => s.errors)),
    fastestTime: Math.min(...sessionHistory.map(s => s.timeElapsed))
  } : null

  // Calculate changes from penultimate to last session
  const getChange = (current: number, previous: number) => {
    const change = current - previous
    return {
      value: Math.abs(change),
      isPositive: change > 0,
      isNegative: change < 0,
      sign: change > 0 ? '+' : change < 0 ? '-' : ''
    }
  }

  const wpmChange = penultimateSession ? getChange(lastSession!.wpm, penultimateSession.wpm) : null
  const accuracyChange = penultimateSession ? getChange(lastSession!.accuracy, penultimateSession.accuracy) : null
  const errorsChange = penultimateSession ? getChange(lastSession!.errors, penultimateSession.errors) : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      {/* Current Session Stats */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          Current Session (Text {currentTextIndex + 1})
          {isTransitioning && <span className="text-green-600 ml-2">✅ Completed!</span>}
        </h3>
        <div className="grid grid-cols-3 gap-6 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {wpm}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">WPM</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {accuracy}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {errorCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
          </div>
        </div>
      </div>

      {/* Last Session Stats */}
      {lastSession && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-4">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
            Last Completed (Text {lastSession.textIndex + 1}) - {lastSession.timeElapsed.toFixed(1)}s
          </h4>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-500 flex items-center justify-center gap-1">
                {lastSession.wpm}
                {wpmChange && wpmChange.sign && (
                  <span className={`text-xs ${wpmChange.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    ({wpmChange.sign}{wpmChange.value})
                  </span>
                )}
              </div>
              <div className="text-gray-500">WPM</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-500 flex items-center justify-center gap-1">
                {lastSession.accuracy}%
                {accuracyChange && accuracyChange.sign && (
                  <span className={`text-xs ${accuracyChange.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    ({accuracyChange.sign}{accuracyChange.value}%)
                  </span>
                )}
              </div>
              <div className="text-gray-500">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-500 flex items-center justify-center gap-1">
                {lastSession.errors}
                {errorsChange && errorsChange.sign && (
                  <span className={`text-xs ${errorsChange.isNegative ? 'text-green-500' : 'text-red-500'}`}>
                    ({errorsChange.sign}{errorsChange.value})
                  </span>
                )}
              </div>
              <div className="text-gray-500">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-600">
                {lastSession.textLength}
              </div>
              <div className="text-gray-500">Chars</div>
            </div>
          </div>
        </div>
      )}

      {/* Best Scores Section */}
      {bestScores && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-4">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            🏆 Personal Best Scores
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                {bestScores.bestWpm}
                {lastSession && lastSession.wpm === bestScores.bestWpm && (
                  <span className="text-xs text-yellow-500">🔥</span>
                )}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Best WPM</div>
            </div>
            <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                {bestScores.bestAccuracy}%
                {lastSession && lastSession.accuracy === bestScores.bestAccuracy && (
                  <span className="text-xs text-yellow-500">🔥</span>
                )}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Best Accuracy</div>
            </div>
            <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                {bestScores.fewestErrors}
                {lastSession && lastSession.errors === bestScores.fewestErrors && (
                  <span className="text-xs text-yellow-500">🔥</span>
                )}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Fewest Errors</div>
            </div>
            <div className="text-center bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1">
                {bestScores.fastestTime.toFixed(1)}s
                {lastSession && lastSession.timeElapsed === bestScores.fastestTime && (
                  <span className="text-xs text-yellow-500">🔥</span>
                )}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Fastest Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Session History Summary */}
      {sessionHistory.length > 0 && (
        <div className="text-center text-sm text-gray-500 border-t border-gray-200 dark:border-gray-600 pt-3">
          Total completed: {sessionHistory.length} • 
          Avg WPM: {Math.round(sessionHistory.reduce((sum, s) => sum + s.wpm, 0) / sessionHistory.length)} • 
          Avg Accuracy: {Math.round(sessionHistory.reduce((sum, s) => sum + s.accuracy, 0) / sessionHistory.length)}%
        </div>
      )}
    </div>
  )
}