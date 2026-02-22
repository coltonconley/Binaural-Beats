import type { SessionPreset } from './types'
import { guidedPresets } from './guidedPresets'

export const presets: SessionPreset[] = [
  // ── Relaxation ──────────────────────────────────────────────
  {
    id: 'quick-calm',
    name: 'Quick Calm',
    description: 'A 15-minute alpha session for fast stress relief. Gently lowers from high alpha to low alpha and back.',
    category: 'relaxation',
    targetBand: 'alpha',
    duration: 900,
    carriers: [{ carrierFreq: 200, gainDb: 0 }],
    frequencyEnvelope: [
      { time: 0, beatFreq: 12 },
      { time: 120, beatFreq: 12 },    // hold 2 min
      { time: 360, beatFreq: 8 },     // ramp down 4 min (1 Hz/min)
      { time: 780, beatFreq: 8 },     // hold 7 min
      { time: 900, beatFreq: 12 },    // ramp up 2 min (2 Hz/min)
    ],
    noiseType: 'pink',
    noiseVolume: 0.4,
    hasReturnPhase: true,
    isochronicAvailable: true,
    icon: '🌊',
    color: '#3b82f6',
    ambientSound: 'rain',
    ambientVolume: 0.4,
  },
  {
    id: 'deep-relax',
    name: 'Deep Relaxation',
    description: '25-minute session ramping from alpha down to the alpha-theta border. Extended hold for profound calm.',
    category: 'relaxation',
    targetBand: 'alpha',
    duration: 1500,
    carriers: [{ carrierFreq: 200, gainDb: 0 }],
    frequencyEnvelope: [
      { time: 0, beatFreq: 12 },
      { time: 180, beatFreq: 12 },    // hold 3 min
      { time: 480, beatFreq: 8 },     // ramp down 5 min (0.8 Hz/min)
      { time: 1200, beatFreq: 8 },    // hold 12 min
      { time: 1380, beatFreq: 10 },   // ramp up 3 min (0.7 Hz/min)
      { time: 1500, beatFreq: 12 },   // ramp up 2 min (1 Hz/min)
    ],
    noiseType: 'pink',
    noiseVolume: 0.45,
    hasReturnPhase: true,
    isochronicAvailable: true,
    icon: '🍃',
    color: '#22c55e',
    ambientSound: 'forest',
    ambientVolume: 0.4,
  },

  {
    id: 'anxiety-relief',
    name: 'Anxiety Relief',
    description: 'Evidence-based alpha-theta protocol for anxiety reduction. Gentle U-shaped curve with a brief theta dip for emotional processing, then safe return to alpha.',
    category: 'relaxation',
    targetBand: 'alpha',
    duration: 1800,
    carriers: [
      { carrierFreq: 180, gainDb: 0 },
      { carrierFreq: 360, gainDb: -6 },
    ],
    frequencyEnvelope: [
      { time: 0, beatFreq: 12 },
      { time: 180, beatFreq: 10 },      // ramp 3 min
      { time: 480, beatFreq: 8 },       // ramp 5 min
      { time: 960, beatFreq: 8 },       // hold 8 min
      { time: 1200, beatFreq: 6 },      // theta dip 4 min
      { time: 1500, beatFreq: 8 },      // return to alpha 5 min
      { time: 1800, beatFreq: 10 },     // return 5 min
    ],
    noiseType: 'pink',
    noiseVolume: 0.45,
    hasReturnPhase: true,
    isochronicAvailable: true,
    icon: '🫧',
    color: '#06b6d4',
    ambientSound: 'ocean',
    ambientVolume: 0.45,
  },

  // ── Meditation ──────────────────────────────────────────────
  {
    id: 'theta-meditation',
    name: 'Theta Meditation',
    description: '35-minute theta session for deep meditation. Slow descent through alpha into sustained 6 Hz theta with gentle return.',
    category: 'meditation',
    targetBand: 'theta',
    duration: 2100,
    carriers: [{ carrierFreq: 150, gainDb: 0 }],
    frequencyEnvelope: [
      { time: 0, beatFreq: 10 },
      { time: 180, beatFreq: 10 },    // hold 3 min
      { time: 660, beatFreq: 6 },     // ramp down 8 min (0.5 Hz/min)
      { time: 1620, beatFreq: 6 },    // hold 16 min (with ±0.3 Hz oscillation)
      { time: 1980, beatFreq: 10 },   // ramp up 6 min (0.67 Hz/min)
      { time: 2100, beatFreq: 10 },   // hold 2 min
    ],
    noiseType: 'brown',
    noiseVolume: 0.35,
    hasReturnPhase: true,
    isochronicAvailable: false,
    icon: '🧘',
    color: '#a855f7',
    ambientSound: 'stream',
    ambientVolume: 0.3,
  },
  {
    id: 'creative-theta',
    name: 'Creative Flow',
    description: '30-minute session targeting high theta (7 Hz) for creative ideation, insight, and internally-directed attention.',
    category: 'meditation',
    targetBand: 'theta',
    duration: 1800,
    carriers: [{ carrierFreq: 180, gainDb: 0 }],
    frequencyEnvelope: [
      { time: 0, beatFreq: 10 },
      { time: 180, beatFreq: 10 },    // hold 3 min
      { time: 480, beatFreq: 7 },     // ramp down 5 min (0.6 Hz/min)
      { time: 1380, beatFreq: 7 },    // hold 15 min
      { time: 1680, beatFreq: 10 },   // ramp up 5 min (0.6 Hz/min)
      { time: 1800, beatFreq: 10 },   // hold 2 min
    ],
    noiseType: 'pink',
    noiseVolume: 0.3,
    hasReturnPhase: true,
    isochronicAvailable: false,
    icon: '💡',
    color: '#f59e0b',
    ambientSound: 'forest',
    ambientVolume: 0.35,
  },

  {
    id: 'schumann-resonance',
    name: 'Schumann Resonance',
    description: 'Earth\'s natural 7.83 Hz electromagnetic frequency for grounding and stress reduction. Brown noise and forest ambient for an organic, earthy feel.',
    category: 'meditation',
    targetBand: 'alpha',
    duration: 1800,
    carriers: [
      { carrierFreq: 200, gainDb: 0 },
      { carrierFreq: 400, gainDb: -6 },
    ],
    frequencyEnvelope: [
      { time: 0, beatFreq: 10 },
      { time: 180, beatFreq: 7.83 },    // ramp 3 min
      { time: 1500, beatFreq: 7.83 },   // hold 22 min
      { time: 1800, beatFreq: 10 },     // return 5 min
    ],
    noiseType: 'brown',
    noiseVolume: 0.4,
    hasReturnPhase: true,
    isochronicAvailable: false,
    icon: '🌍',
    color: '#059669',
    ambientSound: 'forest',
    ambientVolume: 0.4,
  },

  // ── Focus ───────────────────────────────────────────────────
  {
    id: 'focus-session',
    name: 'Deep Focus',
    description: '45-minute SMR/low-beta session for sustained concentration. Targets the sensorimotor rhythm band (15 Hz) associated with calm focus.',
    category: 'focus',
    targetBand: 'beta',
    duration: 2700,
    carriers: [{ carrierFreq: 250, gainDb: 0 }],
    frequencyEnvelope: [
      { time: 0, beatFreq: 10 },
      { time: 180, beatFreq: 10 },    // hold 3 min
      { time: 420, beatFreq: 15 },    // ramp up 4 min (1.25 Hz/min)
      { time: 2400, beatFreq: 15 },   // hold 33 min
      { time: 2580, beatFreq: 10 },   // ramp down 3 min (1.7 Hz/min)
      { time: 2700, beatFreq: 10 },   // hold 2 min
    ],
    noiseType: 'pink',
    noiseVolume: 0.25,
    hasReturnPhase: true,
    isochronicAvailable: true,
    icon: '🎯',
    color: '#ef4444',
    ambientSound: 'rain',
    ambientVolume: 0.25,
  },
  {
    id: 'gamma-boost',
    name: 'Gamma Boost',
    description: '25-minute 40 Hz gamma session for peak cognitive performance and working memory enhancement.',
    category: 'focus',
    targetBand: 'gamma',
    duration: 1500,
    carriers: [{ carrierFreq: 315, gainDb: 0 }],
    frequencyEnvelope: [
      { time: 0, beatFreq: 12 },
      { time: 120, beatFreq: 12 },    // hold 2 min
      { time: 480, beatFreq: 40 },    // ramp up 6 min (4.7 Hz/min)
      { time: 1140, beatFreq: 40 },   // hold 11 min
      { time: 1380, beatFreq: 12 },   // ramp down 4 min (7 Hz/min)
      { time: 1500, beatFreq: 12 },   // hold 2 min
    ],
    noiseType: 'pink',
    noiseVolume: 0.2,
    hasReturnPhase: true,
    isochronicAvailable: true,
    icon: '⚡',
    color: '#f97316',
    ambientSound: 'none',
    ambientVolume: 0,
  },

  {
    id: 'peak-cognition',
    name: 'Peak Cognition',
    description: 'Research-optimized 40 Hz gamma protocol for working memory and cognitive performance. Dual-carrier with wider frequency spread and intermediate beta stage.',
    category: 'focus',
    targetBand: 'gamma',
    duration: 1500,
    carriers: [
      { carrierFreq: 315, gainDb: 0 },
      { carrierFreq: 475, gainDb: -4 },
    ],
    frequencyEnvelope: [
      { time: 0, beatFreq: 12 },
      { time: 180, beatFreq: 20 },      // ramp to beta 3 min
      { time: 420, beatFreq: 40 },      // ramp to gamma 4 min
      { time: 1140, beatFreq: 40 },     // hold 12 min cognitive window
      { time: 1320, beatFreq: 20 },     // return to beta 3 min
      { time: 1500, beatFreq: 12 },     // return 3 min
    ],
    noiseType: 'pink',
    noiseVolume: 0.15,
    hasReturnPhase: true,
    isochronicAvailable: true,
    icon: '🧠',
    color: '#f59e0b',
    ambientSound: 'none',
    ambientVolume: 0,
  },

  // ── Sleep ───────────────────────────────────────────────────
  {
    id: 'sleep-drift',
    name: 'Sleep Drift',
    description: '45-minute session that gradually descends from alpha through theta into deep delta. No return phase — fades to silence as you drift to sleep.',
    category: 'sleep',
    targetBand: 'delta',
    duration: 2700,
    carriers: [{ carrierFreq: 100, gainDb: 0 }],
    frequencyEnvelope: [
      { time: 0, beatFreq: 10 },
      { time: 300, beatFreq: 8 },     // ramp 5 min (0.4 Hz/min)
      { time: 600, beatFreq: 6 },     // ramp 5 min (0.4 Hz/min)
      { time: 1200, beatFreq: 4 },    // ramp 10 min (0.2 Hz/min)
      { time: 2100, beatFreq: 2 },    // ramp 15 min (0.13 Hz/min)
      { time: 2700, beatFreq: 2 },    // hold 10 min (fade out last 5 min)
    ],
    noiseType: 'brown',
    noiseVolume: 0.5,
    hasReturnPhase: false,
    isochronicAvailable: false,
    icon: '🌙',
    color: '#6366f1',
    ambientSound: 'rain',
    ambientVolume: 0.5,
  },
  {
    id: 'power-nap',
    name: 'Power Nap',
    description: '25-minute nap session. Quick descent to theta, brief delta dip, then gentle return to alpha so you wake refreshed.',
    category: 'sleep',
    targetBand: 'theta',
    duration: 1500,
    carriers: [{ carrierFreq: 120, gainDb: 0 }],
    frequencyEnvelope: [
      { time: 0, beatFreq: 10 },
      { time: 120, beatFreq: 6 },     // ramp 2 min (2 Hz/min)
      { time: 360, beatFreq: 4 },     // ramp 4 min (0.5 Hz/min)
      { time: 600, beatFreq: 3 },     // ramp 4 min (0.25 Hz/min)
      { time: 900, beatFreq: 3 },     // hold 5 min
      { time: 1200, beatFreq: 6 },    // ramp up 5 min (0.6 Hz/min)
      { time: 1380, beatFreq: 10 },   // ramp up 3 min (1.3 Hz/min)
      { time: 1500, beatFreq: 12 },   // ramp up 2 min (1 Hz/min)
    ],
    noiseType: 'brown',
    noiseVolume: 0.45,
    hasReturnPhase: true,
    isochronicAvailable: false,
    icon: '💤',
    color: '#8b5cf6',
    ambientSound: 'ocean',
    ambientVolume: 0.4,
  },

  {
    id: 'lucid-gateway',
    name: 'Lucid Gateway',
    description: 'WILD-inspired protocol for lucid dream induction. Oscillating theta-delta pattern maintains a thread of awareness at the sleep boundary. Fades to silence.',
    category: 'sleep',
    targetBand: 'theta',
    duration: 2400,
    carriers: [
      { carrierFreq: 120, gainDb: 0 },
      { carrierFreq: 240, gainDb: -6 },
    ],
    frequencyEnvelope: [
      { time: 0, beatFreq: 10 },
      { time: 240, beatFreq: 7 },       // ramp 4 min
      { time: 540, beatFreq: 5 },       // ramp 5 min
      { time: 1020, beatFreq: 3 },      // ramp 8 min — edge of sleep
      { time: 1320, beatFreq: 5 },      // theta rebound 5 min
      { time: 1920, beatFreq: 3 },      // re-descend 10 min
      { time: 2400, beatFreq: 2 },      // deep delta 8 min — no return
    ],
    noiseType: 'brown',
    noiseVolume: 0.45,
    hasReturnPhase: false,
    isochronicAvailable: false,
    icon: '🦋',
    color: '#8b5cf6',
    ambientSound: 'rain',
    ambientVolume: 0.3,
  },

  // ── Advanced ────────────────────────────────────────────────
  {
    id: 'gateway-focus10',
    name: 'Focus 10',
    description: 'Monroe-style "Mind Awake / Body Asleep" session. Multi-layer frequency stacking at 100/200/400 Hz carriers targeting 4 Hz theta.',
    category: 'advanced',
    targetBand: 'theta',
    duration: 2700,
    carriers: [
      { carrierFreq: 100, gainDb: 0 },
      { carrierFreq: 200, gainDb: -6 },
      { carrierFreq: 400, gainDb: -9 },
    ],
    frequencyEnvelope: [
      { time: 0, beatFreq: 10 },
      { time: 300, beatFreq: 10 },    // hold 5 min
      { time: 780, beatFreq: 4 },     // ramp down 8 min (0.75 Hz/min)
      { time: 2160, beatFreq: 4 },    // hold 23 min
      { time: 2520, beatFreq: 10 },   // ramp up 6 min (1 Hz/min)
      { time: 2700, beatFreq: 10 },   // hold 3 min
    ],
    noiseType: 'pink',
    noiseVolume: 0.4,
    hasReturnPhase: true,
    isochronicAvailable: false,
    icon: '🔮',
    color: '#ec4899',
    ambientSound: 'stream',
    ambientVolume: 0.35,
  },
  {
    id: 'harmonic-box',
    name: 'Harmonic Box',
    description: 'Advanced harmonic box technique with dual-carrier cross-ear reinforcement at 200/400 Hz for immersive theta exploration.',
    category: 'advanced',
    targetBand: 'theta',
    duration: 2100,
    carriers: [
      { carrierFreq: 200, gainDb: 0 },
      { carrierFreq: 400, gainDb: -3 },
    ],
    frequencyEnvelope: [
      { time: 0, beatFreq: 10 },
      { time: 240, beatFreq: 10 },    // hold 4 min
      { time: 660, beatFreq: 6 },     // ramp down 7 min (0.57 Hz/min)
      { time: 1620, beatFreq: 6 },    // hold 16 min
      { time: 1980, beatFreq: 10 },   // ramp up 6 min (0.67 Hz/min)
      { time: 2100, beatFreq: 10 },   // hold 2 min
    ],
    noiseType: 'pink',
    noiseVolume: 0.35,
    hasReturnPhase: true,
    isochronicAvailable: false,
    icon: '🔷',
    color: '#14b8a6',
    ambientSound: 'forest',
    ambientVolume: 0.3,
  },
  {
    id: 'gateway-focus12',
    name: 'Focus 12',
    description: 'Monroe-style expanded awareness. Two-stage descent holds at Focus 10 (4 Hz) before deepening to Focus 12 (3.5 Hz), mimicking Gateway Exercise structure.',
    category: 'advanced',
    targetBand: 'theta',
    duration: 2700,
    carriers: [
      { carrierFreq: 100, gainDb: 0 },
      { carrierFreq: 200, gainDb: -6 },
      { carrierFreq: 400, gainDb: -9 },
    ],
    frequencyEnvelope: [
      { time: 0, beatFreq: 10 },
      { time: 300, beatFreq: 4 },       // ramp 5 min to Focus 10
      { time: 600, beatFreq: 4 },       // hold 5 min at Focus 10
      { time: 1080, beatFreq: 3.5 },    // ramp 8 min to Focus 12
      { time: 1800, beatFreq: 3.5 },    // hold 12 min at Focus 12
      { time: 2100, beatFreq: 4 },      // return through Focus 10 (5 min)
      { time: 2400, beatFreq: 10 },     // return to waking (5 min)
      { time: 2700, beatFreq: 10 },     // hold 5 min
    ],
    noiseType: 'pink',
    noiseVolume: 0.35,
    hasReturnPhase: true,
    isochronicAvailable: false,
    icon: '🔮',
    color: '#d946ef',
    ambientSound: 'stream',
    ambientVolume: 0.3,
  },
  {
    id: 'gateway-focus15',
    name: 'Focus 15',
    description: 'The "No-Time" state — deep delta-theta border. Three-stage descent through Focus 10 → 12 → 15, with extended hold at 2 Hz. Quad carrier for maximum hemispheric entrainment.',
    category: 'advanced',
    targetBand: 'delta',
    duration: 3300,
    carriers: [
      { carrierFreq: 100, gainDb: 0 },
      { carrierFreq: 200, gainDb: -6 },
      { carrierFreq: 400, gainDb: -9 },
      { carrierFreq: 300, gainDb: -12 },
    ],
    frequencyEnvelope: [
      { time: 0, beatFreq: 10 },
      { time: 300, beatFreq: 4 },       // ramp 5 min to Focus 10
      { time: 600, beatFreq: 3.5 },     // ramp 5 min to Focus 12
      { time: 1080, beatFreq: 2 },      // ramp 8 min to Focus 15
      { time: 2280, beatFreq: 2 },      // hold 20 min — deep "no time"
      { time: 2700, beatFreq: 3.5 },    // return 7 min
      { time: 2940, beatFreq: 4 },      // return 4 min
      { time: 3180, beatFreq: 10 },     // return 4 min
      { time: 3300, beatFreq: 10 },     // hold 2 min
    ],
    noiseType: 'brown',
    noiseVolume: 0.3,
    hasReturnPhase: true,
    isochronicAvailable: false,
    icon: '🌀',
    color: '#7c3aed',
    ambientSound: 'none',
    ambientVolume: 0,
  },
  {
    id: 'gateway-focus21',
    name: 'Focus 21',
    description: 'Edge of perception — the deepest Gateway focus level. Four-stage descent through all focus levels with extended gradual return for safe re-integration. Longest session in the app.',
    category: 'advanced',
    targetBand: 'delta',
    duration: 3600,
    carriers: [
      { carrierFreq: 100, gainDb: 0 },
      { carrierFreq: 200, gainDb: -6 },
      { carrierFreq: 400, gainDb: -9 },
      { carrierFreq: 300, gainDb: -12 },
    ],
    frequencyEnvelope: [
      { time: 0, beatFreq: 10 },
      { time: 240, beatFreq: 4 },       // ramp 4 min to Focus 10
      { time: 420, beatFreq: 3.5 },     // ramp 3 min to Focus 12
      { time: 720, beatFreq: 2 },       // ramp 5 min to Focus 15
      { time: 1080, beatFreq: 1.5 },    // ramp 6 min to Focus 21
      { time: 2400, beatFreq: 1.5 },    // hold 22 min
      { time: 2760, beatFreq: 2 },      // return 6 min
      { time: 3000, beatFreq: 3.5 },    // return 4 min
      { time: 3240, beatFreq: 4 },      // return 4 min
      { time: 3540, beatFreq: 10 },     // return 5 min
      { time: 3600, beatFreq: 10 },     // hold 1 min
    ],
    noiseType: 'brown',
    noiseVolume: 0.25,
    hasReturnPhase: true,
    isochronicAvailable: false,
    icon: '✨',
    color: '#4f46e5',
    ambientSound: 'none',
    ambientVolume: 0,
  },
]

export const allPresets: SessionPreset[] = [...presets, ...guidedPresets]

export const categoryLabels: Record<string, string> = {
  relaxation: 'Relaxation',
  meditation: 'Meditation',
  focus: 'Focus',
  sleep: 'Sleep',
  advanced: 'Advanced',
  guided: 'Guided',
  custom: 'Custom',
}

export const categoryOrder = ['relaxation', 'meditation', 'focus', 'sleep', 'advanced', 'guided', 'custom'] as const

export const bandInfo: Record<string, { label: string; range: string; description: string }> = {
  delta: { label: 'Delta', range: '0.5–4 Hz', description: 'Deep sleep, restoration' },
  theta: { label: 'Theta', range: '4–8 Hz', description: 'Deep meditation, creativity' },
  alpha: { label: 'Alpha', range: '8–13 Hz', description: 'Relaxed wakefulness' },
  beta: { label: 'Beta', range: '13–30 Hz', description: 'Active focus, concentration' },
  gamma: { label: 'Gamma', range: '30–100 Hz', description: 'Peak cognition, memory' },
}

export const phaseLabels: Record<string, string> = {
  idle: '',
  induction: 'Settling In',
  main: 'Sustaining',
  return: 'Returning',
  complete: 'Complete',
}

/** Returns recommended preset IDs based on time of day */
export function getRecommendedPresets(): string[] {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) {
    // Morning: focus
    return ['focus-session', 'gamma-boost', 'quick-calm']
  } else if (hour >= 12 && hour < 18) {
    // Afternoon: focus + relaxation
    return ['focus-session', 'quick-calm', 'creative-theta']
  } else if (hour >= 18 && hour < 22) {
    // Evening: relaxation + meditation
    return ['deep-relax', 'theta-meditation', 'creative-theta']
  } else {
    // Night: sleep
    return ['sleep-drift', 'power-nap', 'deep-relax']
  }
}

/** Returns a greeting based on time of day */
export function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  if (hour >= 18 && hour < 22) return 'Good evening'
  return 'Good evening'
}

/** Returns a more descriptive label for the main phase based on target vs current */
export function getMainPhaseLabel(preset: SessionPreset, beatFreq: number): string {
  const target = preset.frequencyEnvelope.reduce(
    (min, p) => (p.beatFreq < min ? p.beatFreq : min),
    Infinity
  )
  if (Math.abs(beatFreq - target) > 0.5) {
    return 'Deepening'
  }
  return 'Sustaining'
}
