import type { VoiceCue } from '../types'

// Keywords that indicate premium neural/cloud-based voices
const PREMIUM_KEYWORDS = ['google', 'neural', 'online', 'premium', 'enhanced', 'natural']

// Well-known soothing system voices on macOS/iOS (decent quality)
const SOOTHING_VOICES = ['samantha', 'karen', 'daniel', 'moira', 'fiona', 'alex', 'victoria']

/** Score a voice by estimated quality — higher is better. Exported for UI voice pickers. */
export function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase()

  // Premium cloud/neural voices (Google, Microsoft Neural, Apple Enhanced) — best quality
  for (const kw of PREMIUM_KEYWORDS) {
    if (name.includes(kw)) return 100
  }

  // Remote/cloud voices (localService === false) tend to be higher quality
  if (!voice.localService) return 80

  // Well-known macOS soothing voices
  for (const s of SOOTHING_VOICES) {
    if (name.includes(s)) return 70
  }

  return 50
}

export class VoiceCueEngine {
  private cues: VoiceCue[] = []
  private nextCueIndex = 0
  private voice: SpeechSynthesisVoice | null = null
  private rate = 0.85
  private pitch = 0.92
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
      pitch?: number
      volume?: number
      enabled?: boolean
    },
  ): void {
    this.cues = [...cues].sort((a, b) => a.time - b.time)
    this.nextCueIndex = 0
    this.rate = options?.rate ?? 0.85
    this.pitch = options?.pitch ?? 0.92
    this.volume = options?.volume ?? 0.71
    this.enabled = options?.enabled ?? true
    this.preferredVoiceName = options?.preferredVoiceName ?? null

    if (!this.isAvailable) return

    // Try to select voice immediately
    this.selectVoice()

    // Warm up the TTS engine with a silent utterance (avoids quality drop on first real cue)
    this.warmUp()

    // Handle async voice loading
    if (!this.voicesLoaded) {
      this.onVoicesChanged = () => {
        this.selectVoice()
        this.voicesLoaded = true
      }
      speechSynthesis.addEventListener('voiceschanged', this.onVoicesChanged)
    }
  }

  tick(elapsed: number): { shouldChime: boolean; cueText?: string } {
    if (this.nextCueIndex >= this.cues.length) {
      return { shouldChime: false }
    }

    let shouldChime = false
    let cueText: string | undefined

    while (this.nextCueIndex < this.cues.length && this.cues[this.nextCueIndex].time <= elapsed) {
      const cue = this.cues[this.nextCueIndex]
      this.nextCueIndex++

      if (cue.chime || cue.chimeOnly) {
        shouldChime = true
      }

      if (!cue.chimeOnly && cue.text) {
        cueText = cue.text
        if (this.enabled) {
          this.speak(cue.text)
        }
      }
    }

    return { shouldChime, cueText }
  }

  /** Get the most recent cue text at or before the given time (for seek/display) */
  getTextAtTime(time: number): string | undefined {
    let text: string | undefined
    for (const cue of this.cues) {
      if (cue.time > time) break
      if (!cue.chimeOnly && cue.text) {
        text = cue.text
      }
    }
    return text
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
    // Cancel any in-progress speech
    if (this.isAvailable) {
      try {
        speechSynthesis.cancel()
      } catch { /* */ }
    }

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
    utterance.pitch = this.pitch
    utterance.volume = this.volume
    utterance.lang = 'en-US'

    utterance.onend = () => { /* speech finished */ }
    utterance.onerror = () => { /* speech error */ }

    try {
      speechSynthesis.speak(utterance)
    } catch { /* */ }
  }

  private warmUp(): void {
    if (!this.isAvailable || !this.enabled) return
    try {
      const u = new SpeechSynthesisUtterance('')
      u.volume = 0
      speechSynthesis.speak(u)
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

      // Score and rank all English voices by quality, pick the best
      const englishVoices = voices.filter(v => v.lang.startsWith('en'))
      if (englishVoices.length === 0) {
        this.voice = voices[0]
        return
      }

      englishVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a))
      this.voice = englishVoices[0]
    } catch { /* */ }
  }
}
