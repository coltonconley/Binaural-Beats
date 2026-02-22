export type BrainwaveBand = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'

export type NoiseType = 'pink' | 'brown' | 'none'

export type AmbientSoundType = 'rain' | 'ocean' | 'forest' | 'fire' | 'wind' | 'stream' | 'rain-tin-roof' | 'rain-on-leaves' | 'none'

export type SessionPhase = 'idle' | 'induction' | 'main' | 'return' | 'complete'

export type PresetCategory = 'meditation' | 'focus' | 'sleep' | 'relaxation' | 'advanced' | 'custom'

export interface FrequencyPoint {
  /** Time offset in seconds from session start */
  time: number
  /** Beat frequency in Hz */
  beatFreq: number
}

export interface CarrierLayer {
  /** Base carrier frequency in Hz (left ear) */
  carrierFreq: number
  /** Relative volume in dB (0 = primary, negative = quieter) */
  gainDb: number
}

export interface SessionPreset {
  id: string
  name: string
  description: string
  category: PresetCategory
  targetBand: BrainwaveBand
  /** Total session duration in seconds */
  duration: number
  /** Carrier layers — supports frequency stacking */
  carriers: CarrierLayer[]
  /** Frequency envelope: beat frequency keyframes over time */
  frequencyEnvelope: FrequencyPoint[]
  noiseType: NoiseType
  /** Noise volume relative to tones (0-1) */
  noiseVolume: number
  /** Whether to include a return phase (false for sleep sessions) */
  hasReturnPhase: boolean
  /** Whether isochronic tones can be enabled (target >= 8 Hz) */
  isochronicAvailable: boolean
  icon: string
  /** Accent color (hex) */
  color: string
  /** Default ambient sound overlay */
  ambientSound: AmbientSoundType
  /** Default ambient volume (0-1) */
  ambientVolume: number
}

export interface SessionOptions {
  isochronicEnabled?: boolean
  breathingGuideEnabled?: boolean
  volume?: number
  ambientSound?: AmbientSoundType
  ambientVolume?: number
}

export interface EngineState {
  isPlaying: boolean
  isPaused: boolean
  phase: SessionPhase
  elapsed: number
  duration: number
  beatFreq: number
  volume: number
  activePreset: SessionPreset | null
  isochronicEnabled: boolean
  breathingGuideEnabled: boolean
}

// ── Session History & User Data ──────────────────────────

export type MoodRating = 'energized' | 'calm' | 'focused' | 'sleepy'

export interface CompletedSession {
  id: string
  presetId: string
  presetName: string
  category: PresetCategory
  durationSeconds: number
  completedAt: string
  mood?: MoodRating
  completedFull: boolean
}

export interface UserStats {
  totalSessions: number
  totalMinutes: number
  currentStreak: number
  longestStreak: number
  lastSessionDate: string | null
}

export interface UserPreferences {
  favorites: string[]
  hapticEnabled: boolean
  reducedMotion: boolean
}

// ── Journeys / Programs ──────────────────────────────────

export interface JourneyDay {
  day: number
  presetId: string
  title: string
  tip: string
}

export interface Journey {
  id: string
  name: string
  description: string
  category: PresetCategory
  days: JourneyDay[]
  icon: string
  color: string
}

export interface JourneyProgress {
  journeyId: string
  completedDays: number[]
  startedAt: string
  lastCompletedAt: string | null
}
