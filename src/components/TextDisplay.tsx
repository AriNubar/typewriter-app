/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import type { CharacterState } from '../types'

interface TextDisplayProps {
    text: string
    typedText: string
    currentIndex: number
    errorPositions: Set<number>  // Changed from errors to errorPositions for clarity
    fontFamily: string
    fontSize: number
}

export default function TextDisplay({ text, currentIndex, errorPositions, fontFamily, fontSize }: TextDisplayProps) {
    const { settings } = useSettings()
    const containerRef = useRef<HTMLDivElement>(null)
    const [lines, setLines] = useState<string[]>([])
    const [currentLineIndex, setCurrentLineIndex] = useState(0)
    const [charToLineMap, setCharToLineMap] = useState<number[]>([])
    // const [previousLineIndex, setPreviousLineIndex] = useState(0)
    const [, setPreviousLineIndex] = useState(0)

    // Calculate progress percentage
    const progress = text.length > 0 ? (currentIndex / text.length) * 100 : 0

    // Helper function to get height style (class or custom height)
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

    // Memoize the font family function to prevent unnecessary re-renders
    const getFontFamily = useCallback(() => {
        switch (fontFamily) {
            case 'courier':
                return '"Courier New", Courier, monospace'
            case 'consolas':
                return 'Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace'
            case 'fira':
                return '"Fira Code", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace'
            default:
                return 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        }
    }, [fontFamily])

    const getFontStyle = useCallback(() => {
        return { fontFamily: getFontFamily() }
    }, [getFontFamily])

    // Calculate line breaks based on container width and font size
    useEffect(() => {
        if (!containerRef.current || !text) return

        const container = containerRef.current
        const containerWidth = container.clientWidth - 64 // Account for padding (32px on each side)

        // Create a temporary span to measure character widths more accurately
        const measureSpan = document.createElement('span')
        measureSpan.style.position = 'absolute'
        measureSpan.style.visibility = 'hidden'
        measureSpan.style.fontSize = `${fontSize}px`
        measureSpan.style.fontFamily = getFontFamily()
        measureSpan.style.whiteSpace = 'nowrap'
        measureSpan.textContent = 'M' // Use 'M' as reference character for monospace
        document.body.appendChild(measureSpan) // Append to body for more accurate measurement
        
        const charWidth = measureSpan.offsetWidth
        document.body.removeChild(measureSpan)
        
        // Add some safety margin to prevent overflow
        const safetyMargin = charWidth * 0.5 // Half character width as safety margin
        const availableWidth = containerWidth - safetyMargin
        
        // Calculate characters per line with safety margin
        const charsPerLine = Math.floor(availableWidth / charWidth)
        
        // Ensure minimum line length
        const minCharsPerLine = Math.max(20, charsPerLine)
        
        // Split text into lines with improved algorithm that preserves ALL spaces
        const newLines: string[] = []
        const newCharToLineMap: number[] = []
        
        let currentLine = ''
        let charIndex = 0
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i]
            
            // Add character to current line
            currentLine += char
            newCharToLineMap[charIndex] = newLines.length
            charIndex++
            
            // Check if we need to break the line
            if (char === ' ' && currentLine.length >= minCharsPerLine) {
                // Break after space if line is long enough
                newLines.push(currentLine)
                currentLine = ''
            } else if (currentLine.length >= minCharsPerLine && char !== ' ') {
                // If line is too long and current char is not a space,
                // try to find the last space to break at
                const lastSpaceIndex = currentLine.lastIndexOf(' ')
                
                if (lastSpaceIndex > 0) {
                    // Break at the last space
                    const lineToAdd = currentLine.substring(0, lastSpaceIndex + 1) // Include the space
                    const remainder = currentLine.substring(lastSpaceIndex + 1)
                    
                    newLines.push(lineToAdd)
                    currentLine = remainder
                    
                    // Update char mapping for the moved characters
                    const moveStartIndex = charIndex - remainder.length
                    for (let j = 0; j < remainder.length; j++) {
                        newCharToLineMap[moveStartIndex + j] = newLines.length
                    }
                } else {
                    // No space found, force break
                    newLines.push(currentLine)
                    currentLine = ''
                }
            }
        }
        
        // Add the final line if there's remaining content
        if (currentLine.length > 0) {
            newLines.push(currentLine)
        }
        
        // Ensure all characters are mapped correctly
        for (let i = 0; i < text.length; i++) {
            if (newCharToLineMap[i] === undefined) {
                newCharToLineMap[i] = Math.max(0, newLines.length - 1)
            }
        }
        
        setLines(newLines)
        setCharToLineMap(newCharToLineMap)
    }, [text, fontSize, getFontFamily]) // Added getFontFamily to dependencies

    // Update current line index based on typing position
    useEffect(() => {
        if (charToLineMap.length > 0 && currentIndex < charToLineMap.length) {
            const newLineIndex = charToLineMap[currentIndex]
            if (newLineIndex !== currentLineIndex) {
                setPreviousLineIndex(currentLineIndex)
                setCurrentLineIndex(newLineIndex)
            }
        }
    }, [currentIndex, charToLineMap, currentLineIndex])

    const getCharacterState = (index: number): CharacterState => {
        const char = text[index]

        if (index < currentIndex) {
            if (errorPositions.has(index)) {  // Use errorPositions instead of errors
                return { char, status: 'incorrect', position: index }
            } else {
                return { char, status: 'correct', position: index }
            }
        } else if (index === currentIndex) {
            return { char, status: 'current', position: index }
        } else {
            return { char, status: 'pending', position: index }
        }
    }

    const getCharacterStyle = (state: CharacterState, isSpace: boolean) => {
        switch (state.status) {
            case 'correct':
                return 'text-green-600 font-semibold'
            case 'incorrect':
                return 'text-red-600 font-semibold animate-pulse'
            case 'current':
                return `bg-blue-500 text-white animate-pulse font-bold rounded ${isSpace ? 'inline-flex items-center justify-center' : 'px-1'}`
            case 'pending':
                return 'text-gray-400'
            default:
                return 'text-gray-400'
        }
    }

    const renderCharacter = (char: string, index: number) => {
        const state = getCharacterState(index)
        const isSpace = char === ' '
        const style = getCharacterStyle(state, isSpace)

        let displayChar = char
        let wrapperStyle: React.CSSProperties = {}

        if (isSpace) {
            displayChar = '·'

            if (state.status === 'current') {
                wrapperStyle = {
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '1em',
                    height: '1.2em',
                    lineHeight: '1.2em'
                }
            } else {
                wrapperStyle = {
                    paddingLeft: '2px',
                    paddingRight: '2px',
                    display: 'inline-block',
                    minWidth: '0.5rem'
                }
            }
        }

        return (
            <span
                key={index}
                className={style}
                style={wrapperStyle}
            >
                {displayChar}
            </span>
        )
    }

    const renderLine = (lineText: string, lineStartIndex: number) => {
        const characters = []
        let charIndex = lineStartIndex

        // Render every character in the line, including trailing spaces
        for (let i = 0; i < lineText.length; i++) {
            if (charIndex < text.length) {
                characters.push(renderCharacter(text[charIndex], charIndex))
                charIndex++
            }
        }

        return (
            <div className="whitespace-nowrap overflow-hidden" style={{ minHeight: '1.2em' }}>
                {characters}
            </div>
        )
    }

    // Calculate line start indices more accurately
    const getLineStartIndex = (lineIndex: number) => {
        let startIndex = 0
        for (let i = 0; i < lineIndex; i++) {
            startIndex += lines[i].length
        }
        return startIndex
    }

    // Get all lines that need to be rendered for smooth transitions
    const getAllRenderLines = () => {
        if (lines.length === 0) return []

        const renderLines = []

        // Always render lines around current position for smooth transitions
        const startLine = Math.max(0, currentLineIndex - 1)
        const endLine = Math.min(lines.length - 1, currentLineIndex + 2)

        for (let i = startLine; i <= endLine; i++) {
            renderLines.push({
                text: lines[i],
                startIndex: getLineStartIndex(i),
                lineIndex: i
            })
        }

        return renderLines
    }

    const allLines = getAllRenderLines()
    const lineHeight = fontSize * 1.5 // 1.5x line height
    const isLastLine = currentLineIndex >= lines.length - 1

    // Calculate the offset for smooth scrolling
    const getScrollOffset = () => {
        if (isLastLine && currentLineIndex > 0) {
            // On last line, show previous line at top and current at bottom
            return -(currentLineIndex - 1) * lineHeight
        } else {
            // Normal scrolling - current line at top
            return -currentLineIndex * lineHeight
        }
    }

    const progressBarHeight = settings.progressBarHeight || 1
    const heightConfig = getHeightStyle(progressBarHeight)

    // Show fallback if no text
    if (!text) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    Loading text...
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            {/* Progress Bar with embedded percentage */}
            <div className="mb-6">
                <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative ${heightConfig.className || ''}`}
                     style={heightConfig.style}>
                    <div
                        className="h-full bg-blue-500 dark:bg-blue-600 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                    {/* Progress percentage overlay - only show if bar is thick enough */}
                    {progressBarHeight >= 4 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                {Math.round(progress)}%
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Text Display */}
            <div
                ref={containerRef}
                className="leading-relaxed text-left select-none relative overflow-hidden"
                style={{
                    fontSize: `${fontSize}px`,
                    height: `${lineHeight * 2}px`, // Fixed height for exactly 2 lines
                    ...getFontStyle()
                }}
            >
                {/* Container for all lines with smooth transform animation */}
                <div
                    className="relative w-full transition-transform duration-500 ease-out"
                    style={{
                        transform: `translateY(${getScrollOffset()}px)`,
                        transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // Custom easing for smoothness
                    }}
                >
                    {allLines.map((line) => (
                        <div
                            key={line.lineIndex}
                            className="w-full"
                            style={{
                                lineHeight: `${lineHeight}px`,
                                height: `${lineHeight}px`,
                                transform: `translateY(${line.lineIndex * lineHeight}px)`,
                                position: 'absolute',
                                top: 0,
                                left: 0
                            }}
                        >
                            {renderLine(line.text, line.startIndex)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}