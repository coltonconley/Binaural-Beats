/**
 * ASGEP Master Track — Advanced Spatial Gamma Entrainment Protocol
 *
 * A single 60-minute Monroe-style guided session traversing:
 *   Phase 1 (0–15 min)  · Induction: Alpha (8 Hz) → Theta (6 Hz)
 *   Phase 2 (15–25 min) · Focus 10 — Mind Awake, Body Asleep (4 Hz dual-chord)
 *   Phase 3 (25–35 min) · Focus 12 — Expanded Awareness (SAM 15 Hz tremolo)
 *   Phase 4 (35–50 min) · Focus 15 / 21 — Delta + 40 Hz Gamma duality
 *   Phase 5 (50–60 min) · Return — Active isochronic drive back to Beta
 *
 * Key ASGEP features implemented:
 *   • SAM engine at phase-appropriate rotation frequencies
 *   • 40 Hz Gamma binaural carrier overlay during deep states (carrier index 2)
 *   • Near-silence ambient void drop at 35:00 (Focus 15 entry)
 *   • Rocket-pan spatial FX at 25:30 (Focus 10→12 transition)
 *   • 200 Hz low-pass filtered pink noise masking layer
 *   • 0.2 Hz breathing-pace LFO on noise (12 cycles/min)
 *   • Sub-8 Hz isochronic (4 Hz, 6 Hz) active during Phases 1–2
 *   • Isochronic 15 Hz + 20 Hz during Phase 5 return
 */
import type { SessionPreset } from '../../types'
import { asgepVoiceScript } from './asgepVoiceScript'

export const asgepMasterTrack: SessionPreset = {
  id: 'asgep-master',
  name: 'ASGEP Master — Focus 10/12/15/21',
  description:
    'Advanced Spatial Gamma Entrainment Protocol. A single 60-minute session covering all Monroe focus levels with SAM spatial rotation, 40 Hz Gamma overlay, Delta+Gamma duality states, and precision brainwave entrainment. Requires headphones.',
  category: 'guided',
  targetBand: 'delta',
  duration: 3600, // 60 minutes

  /**
   * Carrier configuration:
   *   [0] 200 Hz — primary carrier, tracks beat frequency envelope throughout
   *   [1] 100 Hz — sub-harmonic depth layer, tracks beat frequency envelope
   *   [2] 400 Hz — 40 Hz Gamma overlay (fixedBeatFreq=40), starts near-silent,
   *                faded in by carrierGainEvents at Phase 4 entry (35:00)
   */
  carriers: [
    { carrierFreq: 200, gainDb: 0 },
    { carrierFreq: 100, gainDb: -4 },
    { carrierFreq: 400, gainDb: -60, fixedBeatFreq: 40 }, // Gamma — starts silent
  ],

  /**
   * Frequency envelope — drives the primary binaural beat frequency over time.
   * Times are in seconds from session start.
   *
   * Phase 1 (0–900s):   8 Hz Alpha hold → 6 Hz Theta ramp
   * Phase 2 (900–1500s): 4 Hz Focus 10 / Theta
   * Phase 3 (1500–2100s): 4 Hz Focus 12 (SAM handles 15 Hz tremolo)
   * Phase 4 (2100–3000s): 1.5 Hz Deep Delta (Focus 15 / 21)
   * Phase 5 (3000–3600s): 12 Hz → 20 Hz return ramp
   */
  frequencyEnvelope: [
    // Phase 1 — Alpha induction, hold, then step toward Theta
    { time: 0,    beatFreq: 8.0 }, // Alpha entry: 200/208 Hz
    { time: 60,   beatFreq: 8.0 }, // Alpha hold
    { time: 720,  beatFreq: 8.0 }, // 12:00 — begin Theta approach
    { time: 840,  beatFreq: 6.5 }, // 14:00 — stepping down
    { time: 900,  beatFreq: 6.0 }, // 15:00 — Phase 2 start: low Theta

    // Phase 2 — Focus 10 (4 Hz)
    { time: 960,  beatFreq: 4.0 }, // 16:00 — settle into 4 Hz
    { time: 1500, beatFreq: 4.0 }, // 25:00 — Phase 3 transition holds 4 Hz

    // Phase 3 — Focus 12 (4 Hz primary, SAM at 15 Hz)
    { time: 1560, beatFreq: 4.0 }, // 26:00 — Focus 12 established
    { time: 2100, beatFreq: 4.0 }, // 35:00 — Phase 4 entry

    // Phase 4 — Focus 15 + 21 (1.5 Hz Delta)
    { time: 2160, beatFreq: 1.5 }, // 36:00 — Deep Delta settled
    { time: 3000, beatFreq: 1.5 }, // 50:00 — Phase 5 return starts

    // Phase 5 — Return (12 Hz → 20 Hz isochronic drive)
    { time: 3060, beatFreq: 12.0 }, // 51:00 — Low Beta entry
    { time: 3300, beatFreq: 15.0 }, // 55:00 — Mid Beta
    { time: 3480, beatFreq: 20.0 }, // 58:00 — High Beta / fully waking
    { time: 3600, beatFreq: 20.0 }, // 60:00 — end
  ],

  noiseType: 'pink',
  noiseVolume: 0.22, // slightly lower — LP filter concentrates energy in low frequencies
  hasReturnPhase: true,
  isochronicAvailable: true, // User can enable; sub-8 Hz isochronic works (min = 1 Hz)
  icon: '🔮',
  color: '#1e40af',
  ambientSound: 'ocean',
  ambientVolume: 0.15,

  guidanceScript: {
    phasedNoise: false, // Standard noise with LP filter and breathing LFO instead
    voiceVolume: 0.58,  // ~-18 LUFS relative — barely audible above masking ("subliminal whisper")

    noiseFilter: {
      lowPassFreq: 200,    // Dense low-frequency rumble per ASGEP spec
      breathingLFO: true,  // 0.2 Hz pacing to subliminally entrain breathing at 12/min
    },

    resonantTuning: {
      startTime: 195,  // 3:15
      endTime: 375,    // 6:15
      frequency: 136,
      gainDb: -6,
    },

    /**
     * SAM (Spatial Angle Modulation) windows.
     * 303 Hz carrier rotates spatially at the target brainwave frequency.
     */
    samWindows: [
      // Phase 2: Focus 10 — smooth 4 Hz orbit
      { startTime: 900,  endTime: 1500, rotationHz: 4,  mode: 'smooth' },
      // Phase 3: Focus 12 — smooth 15 Hz tremolo orbit
      { startTime: 1500, endTime: 2100, rotationHz: 15, mode: 'smooth' },
      // Phase 4: Focus 15/21 — fast smooth 40 Hz Gamma orbit
      { startTime: 2100, endTime: 2700, rotationHz: 40, mode: 'smooth' },
      // Deep Focus 21 hold: erratic discontinuous spatial jumps
      { startTime: 2700, endTime: 3000, rotationHz: 40, mode: 'erratic' },
    ],

    /**
     * Carrier gain events — one-shot automation.
     * Index 2 is the 40 Hz Gamma overlay carrier (400/440 Hz).
     */
    carrierGainEvents: [
      // 35:00 — Gamma overlay fades IN over 15 seconds as void opens
      { time: 2100, carrierIndex: 2, targetGain: 1.0, durationSec: 15 },
      // 50:00 — Gamma overlay fades OUT as return begins
      { time: 3000, carrierIndex: 2, targetGain: 0.0, durationSec: 15 },
    ],

    /**
     * Ambient fade events — void silence drop and return.
     */
    ambientEvents: [
      // 35:00 — Ambient drops to near-silence: "void entry" technique
      { time: 2100, targetVolume: 0.01, durationSec: 8 },
      // 50:00 — Ambient returns as consciousness rises back
      { time: 3000, targetVolume: 0.12, durationSec: 20 },
    ],

    /**
     * Rocket-pan spatial FX fires at 25:30 to mark Focus 10→12 transition.
     * A rising-pitch tone sweeps from left to right ear over 3 seconds.
     */
    rocketPanTime: 1530,

    phases: [
      { name: 'Preparation', startTime: 0,    endTime: 120  },
      { name: 'Energy Conversion Box', startTime: 120,  endTime: 195  },
      { name: 'REBAL & Affirmation', startTime: 195,  endTime: 390  },
      { name: 'Resonant Tuning', startTime: 195,  endTime: 375  },
      { name: 'Alpha Induction', startTime: 390,  endTime: 900  },
      { name: 'Focus 10', startTime: 900,  endTime: 1500 },
      { name: 'Focus 12', startTime: 1500, endTime: 2100 },
      { name: 'Focus 15', startTime: 2100, endTime: 2700 },
      { name: 'Focus 21', startTime: 2700, endTime: 3000 },
      { name: 'Return', startTime: 3000, endTime: 3600 },
    ],

    voiceCues: asgepVoiceScript,
  },
}
