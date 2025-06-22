import type { SessionStats } from '../types'

interface SessionHistoryProps {
  sessionHistory: SessionStats[]
  isVisible: boolean
  onToggle: () => void
}

export default function SessionHistory({ sessionHistory, isVisible, onToggle }: SessionHistoryProps) {
  if (sessionHistory.length === 0) return null

  const averageWPM = Math.round(sessionHistory.reduce((sum, s) => sum + s.wpm, 0) / sessionHistory.length)
  const averageAccuracy = Math.round(sessionHistory.reduce((sum, s) => sum + s.accuracy, 0) / sessionHistory.length)
  const totalErrors = sessionHistory.reduce((sum, s) => sum + s.errors, 0)
  const totalTime = sessionHistory.reduce((sum, s) => sum + s.timeElapsed, 0)

  const handleToggle = () => {
    onToggle()
    // Remove focus from the button after clicking to allow typing to continue
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-8 overflow-hidden">
      {/* Header with toggle */}
      <button 
        onClick={handleToggle}
        className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left flex items-center justify-between focus:outline-none"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Session History ({sessionHistory.length} completed)
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Avg: {averageWPM} WPM • {averageAccuracy}% accuracy • {totalErrors} total errors • {Math.round(totalTime)}s total time
          </div>
        </div>
        <div className="text-gray-500">
          {isVisible ? '▼' : '▶'}
        </div>
      </button>

      {/* Expandable content */}
      {isVisible && (
        <div className="p-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{averageWPM}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg WPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{averageAccuracy}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalErrors}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{sessionHistory.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
          </div>

          {/* Individual sessions */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {sessionHistory.map((session, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    #{index + 1}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Text {session.textIndex + 1}
                  </div>
                  <div className="text-sm text-gray-500">
                    {session.timeElapsed.toFixed(1)}s
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-blue-600 font-medium">
                    {session.wpm} WPM
                  </div>
                  <div className="text-green-600 font-medium">
                    {session.accuracy}%
                  </div>
                  {session.errors > 0 && (
                    <div className="text-red-600 font-medium">
                      {session.errors} errors
                    </div>
                  )}
                  {session.errors === 0 && (
                    <div className="text-green-600 font-medium">
                      Perfect!
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Progress visualization */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">WPM Progress</h4>
            <div className="flex items-end space-x-1 h-16">
              {sessionHistory.slice(-20).map((session, index) => {
                const maxWPM = Math.max(...sessionHistory.map(s => s.wpm))
                const height = (session.wpm / maxWPM) * 100
                return (
                  <div
                    key={index}
                    className="bg-blue-500 rounded-t flex-1 min-w-0 relative group"
                    style={{ height: `${height}%` }}
                    title={`Session ${sessionHistory.length - 20 + index + 1}: ${session.wpm} WPM`}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {session.wpm} WPM
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {sessionHistory.length > 20 ? 'Last 20 sessions' : 'All sessions'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}