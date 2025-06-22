/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useRef } from 'react'

interface FileUploaderProps {
  onTextsLoaded: (texts: string[]) => void
  onClose: () => void
  isOpen: boolean
}

export default function FileUploader({ onTextsLoaded, onClose, isOpen }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewTexts, setPreviewTexts] = useState<string[]>([])
  const [randomizeOrder, setRandomizeOrder] = useState(false)
  const [removeQuotationMarks, setRemoveQuotationMarks] = useState(false)
  const [detectedLanguages, setDetectedLanguages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detect if text contains Armenian characters
  const detectArmenian = (text: string): boolean => {
    // Armenian Unicode range: U+0530–U+058F
    const armenianRegex = /[\u0530-\u058F]/
    return armenianRegex.test(text)
  }

  // Detect other languages for display purposes
  const detectLanguages = (text: string): string[] => {
    const languages = []
    
    // Armenian
    if (/[\u0530-\u058F]/.test(text)) {
      languages.push('Armenian')
    }
    
    // Cyrillic (Russian, Ukrainian, Bulgarian, etc.)
    if (/[\u0400-\u04FF]/.test(text)) {
      languages.push('Cyrillic')
    }
    
    // Greek
    if (/[\u0370-\u03FF]/.test(text)) {
      languages.push('Greek')
    }
    
    // Arabic
    if (/[\u0600-\u06FF]/.test(text)) {
      languages.push('Arabic')
    }
    
    // Hebrew
    if (/[\u0590-\u05FF]/.test(text)) {
      languages.push('Hebrew')
    }
    
    // CJK (Chinese, Japanese, Korean)
    if (/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(text)) {
      languages.push('CJK (Chinese/Japanese/Korean)')
    }
    
    // Always include Latin if there are Latin characters
    if (/[A-Za-z]/.test(text)) {
      languages.push('Latin')
    }
    
    return languages
  }

  const processTextFile = (content: string): string[] => {
    // Detect languages first
    const detectedLangs = detectLanguages(content)
    setDetectedLanguages(detectedLangs)
    
    // Process content
    let processedContent = content
    
    // Remove all quotation marks except single quotes if option is enabled
    if (removeQuotationMarks) {
      processedContent = processedContent
        .replace(/"/g, '')      // Remove double quotes
        .replace(/“/g, '')      // Remove left double quotation mark
        .replace(/”/g, '')      // Remove right double quotation mark
        .replace(/«/g, '')      // Remove left-pointing double angle quotation mark
        .replace(/»/g, '')      // Remove right-pointing double angle quotation mark
        .replace(/„/g, '')      // Remove double low-9 quotation mark
        .replace(/‚/g, '')      // Remove single low-9 quotation mark
        .replace(/‹/g, '')      // Remove single left-pointing angle quotation mark
        .replace(/›/g, '')      // Remove single right-pointing angle quotation mark
        .replace(/「/g, '')      // Remove left corner bracket (CJK)
        .replace(/」/g, '')      // Remove right corner bracket (CJK)
        .replace(/『/g, '')      // Remove left white corner bracket (CJK)
        .replace(/』/g, '')      // Remove right white corner bracket (CJK)
        .replace(/〝/g, '')      // Remove reversed double prime quotation mark
        .replace(/〞/g, '')      // Remove double prime quotation mark
        .replace(/〟/g, '')      // Remove low double prime quotation mark
        // Keep single quotes: ' (U+0027) and ' (U+2019) and ՚ (Armenian)
    }
    
    // If Armenian is detected, replace punctuation with Armenian equivalents
    if (detectArmenian(processedContent)) {
      processedContent = processedContent
        .replace(/:/g, '։')      // Regular colon → Armenian full stop
        .replace(/：/g, '։')     // Fullwidth colon → Armenian full stop
        .replace(/︰/g, '։')     // Presentation form colon → Armenian full stop
        .replace(/\./g, '․')     // Full stop → One dot leader (Armenian period)
        .replace(/՚/g, '\'')     // Armenian apostrophe → Smart apostrophe
    }

    // Split by double newlines (empty lines between paragraphs)
    let paragraphs = processedContent
      .split(/\n\s*\n/)
      .map(paragraph => 
        // Clean up each paragraph: remove extra whitespace, normalize line breaks
        paragraph
          .replace(/\r\n/g, '\n') // Normalize Windows line endings
          .replace(/\r/g, '\n')   // Normalize old Mac line endings
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join(' ')
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim()
      )
      .filter(paragraph => paragraph.length > 10) // Filter out very short paragraphs
    
    // Randomize order if option is enabled
    if (randomizeOrder && paragraphs.length > 1) {
      const shuffled = [...paragraphs]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      paragraphs = shuffled
    }
    
    return paragraphs
  }

  const handleFile = async (file: File) => {
    if (!file.type.includes('text') && !file.name.endsWith('.txt')) {
      setError('Please upload a text file (.txt)')
      return
    }

    if (file.size > 1024 * 1024) { // 1MB limit
      setError('File is too large. Please upload a file smaller than 1MB.')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const content = await file.text()
      const processedTexts = processTextFile(content)
      
      if (processedTexts.length === 0) {
        setError('No valid paragraphs found in the file. Make sure paragraphs are separated by empty lines.')
        return
      }

      setPreviewTexts(processedTexts)
    } catch (err) {
      setError('Failed to read the file. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleUseTexts = () => {
    onTextsLoaded(previewTexts)
    onClose()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Re-process texts when options change
  const handleOptionsChange = () => {
    if (previewTexts.length > 0) {
      // We need to re-read the file content, but since we don't store it,
      // we'll just show a message to re-upload
      setPreviewTexts([])
      setDetectedLanguages([])
      setError('Options changed. Please re-upload your file to apply the new settings.')
    }
  }

  const hasArmenian = detectedLanguages.includes('Armenian')

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Upload Custom Text</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>

          {!previewTexts.length ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <p className="mb-2">Upload a text file (.txt) with paragraphs separated by empty lines.</p>
                <p className="text-xs">Example format:</p>
                <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs mt-1">
{`This is the first paragraph.
It can span multiple lines.

This is the second paragraph.
After an empty line.

This is the third paragraph.`}
                </pre>
              </div>

              {/* Processing Options */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-2">Processing Options</h3>
                
                {/* Randomize Order Option */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Randomize paragraph order
                  </label>
                  <button
                    onClick={() => {
                      setRandomizeOrder(!randomizeOrder)
                      handleOptionsChange()
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      randomizeOrder ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        randomizeOrder ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Remove Quotation Marks Option */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Remove all quotation marks (except single quotes)
                    <span className="text-xs text-gray-500 block">
                      Removes ", ", «, », „, ‚, ‹, ›, 「, 」, etc. (keeps ' and ')
                    </span>
                  </label>
                  <button
                    onClick={() => {
                      setRemoveQuotationMarks(!removeQuotationMarks)
                      handleOptionsChange()
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      removeQuotationMarks ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        removeQuotationMarks ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* File Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragOver(true)
                }}
                onDragLeave={() => setIsDragOver(false)}
              >
                <div className="space-y-4">
                  <div className="text-4xl">📄</div>
                  <div>
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      Drop your text file here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      or click to browse
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {isProcessing ? 'Processing...' : 'Choose File'}
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,text/plain"
                onChange={handleFileInput}
                className="hidden"
              />

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-green-700 dark:text-green-400 text-sm">
                  ✅ Successfully processed {previewTexts.length} paragraphs
                  {detectedLanguages.length > 0 && (
                    <span className="block text-xs mt-1">
                      • Detected languages: {detectedLanguages.join(', ')}
                    </span>
                  )}
                  {randomizeOrder && <span className="block text-xs mt-1">• Order randomized</span>}
                  {removeQuotationMarks && <span className="block text-xs mt-1">• All quotation marks removed (except single quotes)</span>}
                  {hasArmenian && <span className="block text-xs mt-1">• Armenian punctuation (: → ։, . → ․, ՚ → ') automatically replaced</span>}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-800 dark:text-white">Preview:</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {previewTexts.slice(0, 5).map((text, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-sm"
                    >
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Paragraph {index + 1} ({text.length} characters)
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">
                        {text.length > 200 ? `${text.substring(0, 200)}...` : text}
                      </div>
                    </div>
                  ))}
                  {previewTexts.length > 5 && (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                      ... and {previewTexts.length - 5} more paragraphs
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleUseTexts}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Use These Texts ({previewTexts.length} paragraphs)
                </button>
                <button
                  onClick={() => {
                    setPreviewTexts([])
                    setDetectedLanguages([])
                    setError(null)
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Choose Different File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}