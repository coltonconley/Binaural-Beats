export type BrainwaveBand = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'

export type NoiseType = 'pink' | 'brown' | 'none'

export type SessionPhase = 'idle' | 'induction' | 'main' | 'return' | 'complete'

export type PresetCategory = 'meditation' | 'focus' | 'sleep' | 'relaxation' | 'advanced'

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
}

export interface SessionOptions {
  isochronicEnabled?: boolean
  breathingGuideEnabled?: boolean
  volume?: number
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
