import type { VoiceCue } from '../types'

const SOOTHING_VOICES = ['samantha', 'karen', 'daniel', 'moira', 'fiona', 'alex', 'victoria']

export class VoiceCueEngine {
  private cues: VoiceCue[] = []
  private nextCueIndex = 0
  private voice: SpeechSynthesisVoice | null = null
  private rate = 0.85
  private volume = 0.71
  private enabled = true
  private voicesLoaded = false
  private onVoicesChanged: (() => void) | null = null
  private preferredVoiceName: string | null = null

  get isAvailable(): boolean {
    return typeof speechSynthesis !== 'undefined'
  }

  init(
    cues: VoiceCue[],
    options?: {
      preferredVoiceName?: string
      rate?: number
      volume?: number
      enabled?: boolean
    },
  ): void {
    this.cues = [...cues].sort((a, b) => a.time - b.time)
    this.nextCueIndex = 0
    this.rate = options?.rate ?? 0.85
    this.volume = options?.volume ?? 0.71
    this.enabled = options?.enabled ?? true
    this.preferredVoiceName = options?.preferredVoiceName ?? null

    if (!this.isAvailable) return

    // Try to select voice immediately
    this.selectVoice()

    // Handle async voice loading
    if (!this.voicesLoaded) {
      this.onVoicesChanged = () => {
        this.selectVoice()
        this.voicesLoaded = true
      }
      speechSynthesis.addEventListener('voiceschanged', this.onVoicesChanged)
    }
  }

  tick(elapsed: number): { shouldChime: boolean } {
    if (!this.enabled || !this.isAvailable || this.nextCueIndex >= this.cues.length) {
      return { shouldChime: false }
    }

    let shouldChime = false

    while (this.nextCueIndex < this.cues.length && this.cues[this.nextCueIndex].time <= elapsed) {
      const cue = this.cues[this.nextCueIndex]
      this.nextCueIndex++

      if (cue.chime || cue.chimeOnly) {
        shouldChime = true
      }

      if (!cue.chimeOnly && cue.text) {
        this.speak(cue.text)
      }
    }

    return { shouldChime }
  }

  pause(): void {
    if (!this.isAvailable) return
    try {
      speechSynthesis.pause()
    } catch { /* */ }
  }

  resume(): void {
    if (!this.isAvailable) return
    try {
      speechSynthesis.resume()
    } catch { /* */ }
  }

  seek(time: number): void {
    if (!this.isAvailable) return

    // Cancel any in-progress speech
    try {
      speechSynthesis.cancel()
    } catch { /* */ }
    // Binary search for the next cue at or after `time`
    let lo = 0
    let hi = this.cues.length
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (this.cues[mid].time < time) {
        lo = mid + 1
      } else {
        hi = mid
      }
    }
    this.nextCueIndex = lo
  }

  stop(): void {
    if (this.isAvailable) {
      try {
        speechSynthesis.cancel()
      } catch { /* */ }
    }

    if (this.onVoicesChanged) {
      try {
        speechSynthesis.removeEventListener('voiceschanged', this.onVoicesChanged)
      } catch { /* */ }
      this.onVoicesChanged = null
    }

    this.cues = []
    this.nextCueIndex = 0
    this.voice = null
    this.voicesLoaded = false
  }

  private speak(text: string): void {
    if (!this.isAvailable || !this.enabled) return

    const utterance = new SpeechSynthesisUtterance(text)
    if (this.voice) utterance.voice = this.voice
    utterance.rate = this.rate
    utterance.pitch = 1.0
    utterance.volume = this.volume
    utterance.lang = 'en-US'

    utterance.onend = () => { /* speech finished */ }
    utterance.onerror = () => { /* speech error */ }

    try {
      speechSynthesis.speak(utterance)
    } catch { /* */ }
  }

  private selectVoice(): void {
    if (!this.isAvailable) return

    try {
      const voices = speechSynthesis.getVoices()
      if (voices.length === 0) return

      // If user specified a preferred voice, try to find it
      if (this.preferredVoiceName) {
        const preferred = voices.find(v =>
          v.name.toLowerCase().includes(this.preferredVoiceName!.toLowerCase())
        )
        if (preferred) {
          this.voice = preferred
          return
        }
      }

      // Try soothing voices first
      const englishVoices = voices.filter(v => v.lang.startsWith('en'))
      for (const name of SOOTHING_VOICES) {
        const match = englishVoices.find(v => v.name.toLowerCase().includes(name))
        if (match) {
          this.voice = match
          return
        }
      }

      // Fall back to first en-US or en-GB voice
      const fallback = voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB')
        ?? englishVoices[0]
        ?? voices[0]
      this.voice = fallback
    } catch { /* */ }
  }
}
