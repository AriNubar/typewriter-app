/* eslint-disable @typescript-eslint/no-unused-vars */
import { Howl } from 'howler'

// Extend the Window interface to include webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

class SoundManager {
  private typeSounds: Howl[]
  private dingSound: Howl
  private initialized: boolean = false

  constructor() {
    // Initialize multiple typewriter sounds for variation
    this.typeSounds = [
      new Howl({
        src: ['/sounds/tw2.mp3'],
        format: ['mp3'],
        volume: 1,
        preload: true
      }),
    ]

    this.dingSound = new Howl({
      src: ['/sounds/ding.mp3'],
      format: ['mp3'],
      volume: 8,
      preload: true
    })
  }

  private async initializeAudioContext() {
    if (this.initialized) return
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        const ctx = new AudioContext()
        if (ctx.state === 'suspended') {
          await ctx.resume()
        }
      }
      this.initialized = true
    } catch (error) {
      console.warn('Could not initialize audio context:', error)
    }
  }

  updateVolume(volume: number) {
    this.typeSounds.forEach(sound => sound.volume(volume))
    this.dingSound.volume(volume)
  }

  async playTypeSound(enabled: boolean, volume: number) {
    if (!enabled) return
    
    try {
      await this.initializeAudioContext()
      this.updateVolume(volume)
      if (this.typeSounds.length > 0) {
        // Randomly select one of the typewriter sounds for variation
        const randomIndex = Math.floor(Math.random() * this.typeSounds.length)
        this.typeSounds[randomIndex].play()
      }
    } catch (error) {
      // Silent fail
    }
  }

  async playErrorSound(enabled: boolean, volume: number) {
    if (!enabled) return
    
    try {
      await this.initializeAudioContext()
      this.updateVolume(volume)
      // Use ding sound for errors
      this.dingSound.play()
    } catch (error) {
      // Silent fail
    }
  }
}

export const soundManager = new SoundManager()