import { useState, useEffect, useCallback, useRef } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { soundManager } from '../utils/sounds'

export interface SessionEntry {
  textIndex: number
  wpm: number
  accuracy: number
  errors: number
  completedAt: Date
  text: string
  timeElapsed: number  // Add this property
  textLength: number   // Add this property
}

export interface TypewriterStats {
  totalCharacters: number
  correctCharacters: number
  errorPositions: Set<number>
  startTime: Date | null
  endTime: Date | null
}

const useTypewriter = (texts: string[]) => {
  const { settings } = useSettings()
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionHistory, setSessionHistory] = useState<SessionEntry[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [errors, setErrors] = useState<Set<number>>(new Set())
  const [stats, setStats] = useState<TypewriterStats>({
    totalCharacters: 0,
    correctCharacters: 0,
    errorPositions: new Set(),
    startTime: null,
    endTime: null
  })
  const [textOrder, setTextOrder] = useState<number[]>([])
  const [roundNumber, setRoundNumber] = useState(1)
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  
  const transitionTimeoutRef = useRef<number | null>(null)

  // Create shuffled order
  const createShuffledOrder = useCallback(() => {
    if (texts.length === 0) return []
    
    const shuffled = [...Array(texts.length)].map((_, i) => i)
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [texts.length])

  // Initialize or reinitialize when texts change
  useEffect(() => {
    console.log('Texts changed:', texts.length, 'texts')
    
    if (texts.length > 0) {
      const shuffled = createShuffledOrder()
      console.log('New text order:', shuffled)
      
      setTextOrder(shuffled)
      setCurrentTextIndex(shuffled[0])
      setCurrentRoundIndex(0)
      setRoundNumber(1)
      
      // Reset all states
      setTypedText('')
      setCurrentIndex(0)
      setErrors(new Set())
      setStats({
        totalCharacters: 0,
        correctCharacters: 0,
        errorPositions: new Set(),
        startTime: null,
        endTime: null
      })
      setIsTransitioning(false)
      setSessionHistory([])
      
      // Clear any pending transition
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
        transitionTimeoutRef.current = null
      }
      
      console.log('Initialized with text:', texts[shuffled[0]]?.substring(0, 50) + '...')
    } else {
      console.log('No texts available')
      // Reset to empty state
      setTextOrder([])
      setCurrentTextIndex(0)
      setCurrentRoundIndex(0)
      setTypedText('')
      setCurrentIndex(0)
      setErrors(new Set())
      setIsTransitioning(false)
    }
  }, [texts, createShuffledOrder])

  // Get current text safely
  const currentText = texts[currentTextIndex] || ''

  const shuffleForNewRound = useCallback(() => {
    return createShuffledOrder()
  }, [createShuffledOrder])

  const moveToNextText = useCallback(() => {
    if (texts.length === 0) return

    setIsTransitioning(true)
    
    const delay = settings.autoAdvance ? settings.advanceDelay : 0
    
    transitionTimeoutRef.current = window.setTimeout(() => {
      setCurrentRoundIndex(prev => {
        const nextIndex = prev + 1
        
        if (nextIndex >= textOrder.length) {
          // Round completed, start new round
          const newOrder = shuffleForNewRound()
          setTextOrder(newOrder)
          setCurrentTextIndex(newOrder[0])
          setRoundNumber(prev => prev + 1)
          return 0
        } else {
          // Move to next text in current round
          setCurrentTextIndex(textOrder[nextIndex])
          return nextIndex
        }
      })
      
      // Reset states for new text
      setTypedText('')
      setCurrentIndex(0)
      setErrors(new Set())
      setStats(prev => ({
        ...prev,
        errorPositions: new Set(),
        startTime: null,
        endTime: null
      }))
      setIsTransitioning(false)
    }, delay)
  }, [textOrder, settings.autoAdvance, settings.advanceDelay, shuffleForNewRound, texts.length])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  const handleKeyPress = useCallback((key: string) => {
    if (isTransitioning || texts.length === 0 || !currentText) return

    const targetChar = currentText[currentIndex]
    if (!targetChar) return

    // Start timing on first keystroke
    if (currentIndex === 0 && !stats.startTime) {
      setStats(prev => ({ ...prev, startTime: new Date() }))
    }

    if (key === targetChar) {
      // Correct character - play typing sound
      soundManager.playTypeSound(settings.soundEnabled, settings.soundVolume)
      
      setTypedText(prev => prev + key)
      setCurrentIndex(prev => prev + 1)
      setStats(prev => ({
        ...prev,
        totalCharacters: prev.totalCharacters + 1,
        correctCharacters: prev.correctCharacters + 1
      }))

      // Check if text is completed
      if (currentIndex + 1 >= currentText.length) {
        const endTime = new Date()
        const startTime = stats.startTime || endTime
        const timeElapsed = (endTime.getTime() - startTime.getTime()) / 1000 // in seconds
        const wordsTyped = currentText.split(' ').length
        const wpm = Math.round((wordsTyped / timeElapsed) * 60) || 0
        const accuracy = Math.round((stats.correctCharacters + 1) / (stats.totalCharacters + 1) * 100)

        setStats(prev => ({ ...prev, endTime }))
        
        // Add to session history with all required properties
        const sessionEntry: SessionEntry = {
          textIndex: currentTextIndex,
          wpm,
          accuracy,
          errors: stats.errorPositions.size,
          completedAt: endTime,
          text: currentText,
          timeElapsed,           // Add time elapsed in seconds
          textLength: currentText.length  // Add text length
        }
        setSessionHistory(prev => [...prev, sessionEntry])

        // Move to next text
        moveToNextText()
      }
    } else {
      // Incorrect character - play error sound
      soundManager.playErrorSound(settings.soundEnabled, settings.soundVolume)
      
      setErrors(prev => new Set([...prev, currentIndex]))
      setStats(prev => ({
        ...prev,
        totalCharacters: prev.totalCharacters + 1,
        errorPositions: new Set([...prev.errorPositions, currentIndex])
      }))
    }
  }, [currentIndex, currentText, stats.startTime, stats.correctCharacters, stats.totalCharacters, stats.errorPositions, currentTextIndex, isTransitioning, moveToNextText, texts.length, settings.soundEnabled, settings.soundVolume])

  // Set up keyboard event listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore modifier keys and special keys
      if (event.ctrlKey || event.altKey || event.metaKey || event.key.length > 1) {
        return
      }
      
      event.preventDefault()
      handleKeyPress(event.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyPress])

  // Calculate current stats
  const timeElapsed = stats.startTime ? (Date.now() - stats.startTime.getTime()) / 60000 : 0
  const wordsTyped = typedText.split(' ').length - (typedText.endsWith(' ') ? 0 : 1)
  const wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0
  const accuracy = stats.totalCharacters > 0 ? Math.round((stats.correctCharacters / stats.totalCharacters) * 100) : 100

  const reset = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }

    if (texts.length > 0) {
      const shuffled = shuffleForNewRound()
      setTextOrder(shuffled)
      setCurrentTextIndex(shuffled[0])
      setCurrentRoundIndex(0)
      setRoundNumber(1)
    }
    
    setTypedText('')
    setCurrentIndex(0)
    setErrors(new Set())
    setStats({
      totalCharacters: 0,
      correctCharacters: 0,
      errorPositions: new Set(),
      startTime: null,
      endTime: null
    })
    setSessionHistory([])
    setIsTransitioning(false)
  }, [shuffleForNewRound, texts.length])

  const skipToNext = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }
    
    if (!isTransitioning) {
      moveToNextText()
    } else {
      // If already transitioning, skip the delay
      setIsTransitioning(false)
      setCurrentRoundIndex(prev => {
        const nextIndex = prev + 1
        
        if (nextIndex >= textOrder.length) {
          const newOrder = shuffleForNewRound()
          setTextOrder(newOrder)
          setCurrentTextIndex(newOrder[0])
          setRoundNumber(prev => prev + 1)
          return 0
        } else {
          setCurrentTextIndex(textOrder[nextIndex])
          return nextIndex
        }
      })
      
      setTypedText('')
      setCurrentIndex(0)
      setErrors(new Set())
      setStats(prev => ({
        ...prev,
        errorPositions: new Set(),
        startTime: null,
        endTime: null
      }))
    }
  }, [isTransitioning, moveToNextText, textOrder, shuffleForNewRound])

  const isRoundComplete = currentRoundIndex >= textOrder.length - 1
  const totalTexts = texts.length
  const isComplete = false // Continuous mode, never truly complete

  console.log('Hook state:', {
    textsLength: texts.length,
    currentTextIndex,
    currentTextLength: currentText.length,
    textOrderLength: textOrder.length
  })

  return {
    typedText,
    currentIndex,
    currentTextIndex,
    currentText,
    errors,
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
    isComplete
  }
}

export default useTypewriter