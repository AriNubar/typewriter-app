export interface TypingStats {
  wpm: number
  accuracy: number
  errors: number
  startTime: number | null
  endTime: number | null
  errorPositions: Set<number>
}

export interface CharacterState {
  char: string
  status: 'correct' | 'incorrect' | 'current' | 'pending'
  position: number
}

export interface SessionStats {
  wpm: number
  accuracy: number
  errors: number
  timeElapsed: number
  textLength: number
  textIndex: number
}