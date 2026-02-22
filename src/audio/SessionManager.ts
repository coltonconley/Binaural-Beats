import type { SessionPreset, SessionPhase, FrequencyPoint, AmbientSoundType, GuidanceScript } from '../types'
import { BinauralEngine } from './BinauralEngine'
import { NoiseGenerator } from './NoiseGenerator'
import { IsochronicEngine } from './IsochronicEngine'
import { AmbientEngine } from './AmbientEngine'
import { VoiceCueEngine } from './VoiceCueEngine'
import { ChimeEngine } from './ChimeEngine'
import { PhasedNoiseEngine } from './PhasedNoiseEngine'
import { ResonantToneEngine } from './ResonantToneEngine'

export type SessionCallback = (state: {
  phase: SessionPhase
  elapsed: number
  beatFreq: number
  guidancePhaseName?: string
}) => void

export class SessionManager {
  private ctx: AudioContext | null = null
  private engine = new BinauralEngine()
  private noise = new NoiseGenerator()
  private isochronic = new IsochronicEngine()
  private ambient = new AmbientEngine()
  private voiceCues = new VoiceCueEngine()
  private chime = new ChimeEngine()
  private phasedNoise = new PhasedNoiseEngine()
  private resonantTone = new ResonantToneEngine()
  private preset: SessionPreset | null = null
  private startTime = 0
  private pausedAt = 0
  private pauseOffset = 0
  private animFrameId = 0
  private fallbackInterval: ReturnType<typeof setInterval> | null = null
  private _phase: SessionPhase = 'idle'
  private _elapsed = 0
  private callback: SessionCallback | null = null
  private volume = 0.7
  private _isochronicEnabled = false
  private _starting = false
  private ambientVolume = 0
  private ambientSound: AmbientSoundType = 'none'
  private guidanceScript: GuidanceScript | null = null
  private isGuidedSession = false
  private resonantToneActive = false

  get phase(): SessionPhase {
    return this._phase
  }

  get elapsed(): number {
    return this._elapsed
  }

  get isPlaying(): boolean {
    return this._phase !== 'idle' && this._phase !== 'complete' && this.pausedAt === 0
  }

  get isPaused(): boolean {
    return this.pausedAt > 0
  }

  get binauralEngine(): BinauralEngine {
    return this.engine
  }

  get currentBeatFreq(): number {
    return this.engine.currentBeatFreq
  }

  get isochronicEnabled(): boolean {
    return this._isochronicEnabled
  }

  async start(
    preset: SessionPreset,
    volume: number,
    isochronicEnabled: boolean,
    onUpdate: SessionCallback,
    ambientSound?: AmbientSoundType,
    ambientVolume?: number,
    sessionOptions?: {
      voiceEnabled?: boolean
      preferredVoiceName?: string
      voiceRate?: number
    },
  ): Promise<void> {
    if (this._starting) return
    this._starting = true

    try {
      this.stop()
      this.preset = preset
      this.volume = volume
      this.callback = onUpdate
      this.pauseOffset = 0
      this.pausedAt = 0
      this._isochronicEnabled = isochronicEnabled && preset.isochronicAvailable
      this.ambientSound = ambientSound ?? preset.ambientSound
      this.ambientVolume = ambientVolume ?? preset.ambientVolume
      this.guidanceScript = preset.guidanceScript ?? null
      this.isGuidedSession = !!this.guidanceScript
      this.resonantToneActive = false

      const initialBeatFreq = preset.frequencyEnvelope[0].beatFreq

      // Create shared AudioContext (must be in user gesture call stack)
      this.ctx = new AudioContext()
      await this.ctx.resume()

      // Start binaural engine with shared context
      this.engine.startWithContext(
        this.ctx,
        this.ctx.destination,
        preset.carriers,
        initialBeatFreq,
        0, // start silent
      )

      // Fade in over 2 seconds
      this.engine.fadeVolume(volume, 2)

      // Start noise — use phased noise for guided sessions, regular noise otherwise
      if (this.isGuidedSession && this.guidanceScript?.phasedNoise) {
        this.phasedNoise.start(
          this.ctx,
          this.ctx.destination,
          initialBeatFreq,
          preset.noiseVolume * volume,
        )
      } else if (preset.noiseType !== 'none') {
        this.noise.start(this.ctx, this.ctx.destination, preset.noiseType, 0)
        this.noise.fadeVolume(preset.noiseVolume * volume, 2)
      }

      // Start isochronic if enabled
      if (this._isochronicEnabled) {
        this.isochronic.start(
          this.ctx,
          this.ctx.destination,
          preset.carriers[0].carrierFreq,
          initialBeatFreq,
          volume,
        )
      }

      // Start ambient sound (independent of master volume)
      if (this.ambientSound !== 'none') {
        await this.ambient.start(this.ctx, this.ctx.destination, this.ambientSound, 0)
        this.ambient.fadeVolume(this.ambientVolume, 2)
      }

      // Initialize guided session engines
      if (this.isGuidedSession && this.guidanceScript) {
        // Initialize chime engine
        this.chime.init(this.ctx, this.ctx.destination)

        // Play start chime
        this.chime.playChime('start')

        // Initialize voice cue engine
        const voiceEnabled = sessionOptions?.voiceEnabled !== false
        this.voiceCues.init(this.guidanceScript.voiceCues, {
          preferredVoiceName: sessionOptions?.preferredVoiceName,
          rate: sessionOptions?.voiceRate,
          volume: this.guidanceScript.voiceVolume ?? 0.71,
          enabled: voiceEnabled,
        })
      }

      this._phase = 'induction'
      this.startTime = performance.now()

      // Set up visibility change handler
      document.addEventListener('visibilitychange', this.handleVisibilityChange)

      this.startTickLoop()
    } finally {
      this._starting = false
    }
  }

  pause(): void {
    if (this.pausedAt > 0 || this._phase === 'idle' || this._phase === 'complete') return
    this.pausedAt = performance.now()
    this.stopTickLoop()
    this.engine.fadeVolume(0, 0.3)
    this.noise.fadeVolume(0, 0.3)
    this.ambient.fadeVolume(0, 0.3)
    if (this._isochronicEnabled) this.isochronic.setVolume(0)

    // Pause guided session engines
    if (this.isGuidedSession) {
      this.voiceCues.pause()
      this.phasedNoise.fadeVolume(0, 0.3)
      if (this.resonantToneActive) {
        this.resonantTone.fadeVolume(0, 0.3)
      }
    }
  }

  resume(): void {
    if (this.pausedAt === 0) return
    this.pauseOffset += performance.now() - this.pausedAt
    this.pausedAt = 0

    // Check if session should have completed while paused
    const elapsed = (performance.now() - this.startTime - this.pauseOffset) / 1000
    if (this.preset && elapsed >= this.preset.duration) {
      this.completeSession()
      return
    }

    this.engine.fadeVolume(this.volume, 0.3)
    if (this.preset) {
      this.noise.fadeVolume(this.preset.noiseVolume * this.volume, 0.3)
    }
    this.ambient.fadeVolume(this.ambientVolume, 0.3)
    if (this._isochronicEnabled) this.isochronic.setVolume(this.volume)

    // Resume guided session engines
    if (this.isGuidedSession && this.preset) {
      this.voiceCues.resume()
      if (this.phasedNoise.isRunning) {
        this.phasedNoise.fadeVolume(this.preset.noiseVolume * this.volume, 0.3)
      }
      if (this.resonantToneActive) {
        const gainDb = this.guidanceScript?.resonantTuning?.gainDb ?? -6
        const linearGain = Math.pow(10, gainDb / 20)
        this.resonantTone.fadeVolume(linearGain, 0.3)
      }
    }

    this.startTickLoop()
  }

  /** Fade all audio to silence over the given duration */
  fadeOut(durationSec: number): void {
    this.engine.fadeVolume(0, durationSec)
    this.noise.fadeVolume(0, durationSec)
    this.ambient.fadeVolume(0, durationSec)
    if (this._isochronicEnabled) this.isochronic.setVolume(0)
    if (this.isGuidedSession) {
      this.phasedNoise.fadeVolume(0, durationSec)
      if (this.resonantToneActive) {
        this.resonantTone.fadeVolume(0, durationSec)
      }
    }
  }

  stop(): void {
    this.stopTickLoop()
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    this.engine.stopShared()
    this.noise.stop()
    this.isochronic.stop()
    this.ambient.stop()
    this.voiceCues.stop()
    this.chime.stop()
    this.phasedNoise.stop()
    this.resonantTone.stop()
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close()
    }
    this.ctx = null
    this._phase = 'idle'
    this._elapsed = 0
    this.pauseOffset = 0
    this.pausedAt = 0
    this.preset = null
    this.callback = null
    this._isochronicEnabled = false
    this.ambientSound = 'none'
    this.ambientVolume = 0
    this.guidanceScript = null
    this.isGuidedSession = false
    this.resonantToneActive = false
  }

  setVolume(v: number): void {
    this.volume = v
    if (this.pausedAt > 0) return
    this.engine.setVolume(v)
    if (this.preset) {
      this.noise.setVolume(this.preset.noiseVolume * v)
      if (this.isGuidedSession && this.phasedNoise.isRunning) {
        this.phasedNoise.setVolume(this.preset.noiseVolume * v)
      }
    }
    if (this._isochronicEnabled) this.isochronic.setVolume(v)
  }

  toggleIsochronic(): void {
    if (!this.preset || !this.preset.isochronicAvailable || !this.ctx) return

    this._isochronicEnabled = !this._isochronicEnabled
    if (this._isochronicEnabled) {
      this.isochronic.start(
        this.ctx,
        this.ctx.destination,
        this.preset.carriers[0].carrierFreq,
        this.engine.currentBeatFreq,
        this.pausedAt > 0 ? 0 : this.volume,
      )
    } else {
      this.isochronic.stop()
    }
  }

  /** Seek to a specific time in the session */
  seek(targetTime: number): void {
    if (!this.preset) return

    // Clamp to [0, duration - 0.1] to avoid accidental completion
    const clampedTime = Math.max(0, Math.min(targetTime, this.preset.duration - 0.1))

    // Adjust pauseOffset so that elapsed calculation yields clampedTime
    const now = this.pausedAt > 0 ? this.pausedAt : performance.now()
    this.pauseOffset = now - this.startTime - clampedTime * 1000

    this._elapsed = clampedTime

    // Update phase
    this.updatePhase()

    // Set beat frequency instantly (no ramp, to support rapid scrubbing)
    const targetFreq = Math.max(this.interpolateFrequency(clampedTime), 0.1)
    this.engine.setBeatFrequency(targetFreq)
    if (this._isochronicEnabled) {
      this.isochronic.setBeatFrequency(targetFreq)
    }

    // Seek voice cues
    if (this.isGuidedSession) {
      this.voiceCues.seek(clampedTime)
    }

    // Fire callback immediately
    const guidancePhaseName = this.isGuidedSession
      ? this.getCurrentGuidancePhaseName(clampedTime)
      : undefined

    this.callback?.({
      phase: this._phase,
      elapsed: clampedTime,
      beatFreq: targetFreq,
      guidancePhaseName,
    })
  }

  setAmbientVolume(v: number): void {
    this.ambientVolume = v
    if (this.pausedAt > 0) return
    this.ambient.setVolume(v)
  }

  async setAmbientSound(sound: AmbientSoundType): Promise<void> {
    this.ambientSound = sound
    if (!this.ctx || this.pausedAt > 0) return

    if (sound === 'none') {
      this.ambient.fadeVolume(0, 1)
      setTimeout(() => this.ambient.stop(), 1100)
      return
    }

    if (this.ambient.isRunning) {
      await this.ambient.switchSound(sound, this.ambientVolume)
    } else {
      await this.ambient.start(this.ctx, this.ctx.destination, sound, 0)
      this.ambient.fadeVolume(this.ambientVolume, 1)
    }
  }

  // ── Tick loop ─────────────────────────────────────────────

  private startTickLoop(): void {
    this.stopTickLoop()
    if (document.visibilityState === 'hidden') {
      this.fallbackInterval = setInterval(this.tick, 1000)
    } else {
      this.animFrameId = requestAnimationFrame(this.tick)
    }
  }

  private stopTickLoop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = 0
    }
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval)
      this.fallbackInterval = null
    }
  }

  private handleVisibilityChange = (): void => {
    if (this._phase === 'idle' || this._phase === 'complete' || this.pausedAt > 0) return

    this.stopTickLoop()
    if (document.visibilityState === 'hidden') {
      this.fallbackInterval = setInterval(this.tick, 1000)
    } else {
      // Returning to foreground — resume rAF loop (tick will self-schedule)
      this.animFrameId = requestAnimationFrame(this.tick)
    }
  }

  private tick = (): void => {
    if (!this.preset || this.pausedAt > 0) return

    try {
      const now = performance.now()
      this._elapsed = (now - this.startTime - this.pauseOffset) / 1000

      if (this._elapsed >= this.preset.duration) {
        this.completeSession()
        return
      }

      this.updatePhase()

      // Interpolate target beat frequency from envelope
      let targetFreq = this.interpolateFrequency(this._elapsed)

      // Apply habituation oscillation during main phase (±0.3 Hz, 45s period)
      if (this._phase === 'main') {
        const oscillation = Math.sin((this._elapsed * 2 * Math.PI) / 45) * 0.3
        targetFreq += oscillation
      }

      // Ensure beat frequency stays positive
      targetFreq = Math.max(targetFreq, 0.1)

      // Smooth micro-ramp toward target
      if (Math.abs(targetFreq - this.engine.currentBeatFreq) > 0.01) {
        this.engine.rampBeatFrequency(targetFreq, 0.5)
      }

      // Update isochronic beat frequency to match
      if (this._isochronicEnabled) {
        this.isochronic.setBeatFrequency(targetFreq)
      }

      // Guided session tick updates
      let guidancePhaseName: string | undefined
      if (this.isGuidedSession && this.guidanceScript) {
        // Voice cue processing
        const { shouldChime } = this.voiceCues.tick(this._elapsed)
        if (shouldChime) {
          this.chime.playChime('transition')
        }

        // Resonant tuning management
        this.updateResonantTone(this._elapsed)

        // Update phased noise pan rate to match beat frequency
        if (this.phasedNoise.isRunning) {
          this.phasedNoise.setPanRate(targetFreq)
        }

        // Get current guidance phase name
        guidancePhaseName = this.getCurrentGuidancePhaseName(this._elapsed)
      }

      this.callback?.({
        phase: this._phase,
        elapsed: this._elapsed,
        beatFreq: targetFreq,
        guidancePhaseName,
      })
    } catch (err) {
      console.error('Session tick error:', err)
    }

    // Re-schedule if using rAF (always, even after error, to keep loop alive)
    if (document.visibilityState !== 'hidden' && !this.fallbackInterval) {
      this.animFrameId = requestAnimationFrame(this.tick)
    }
  }

  private completeSession(): void {
    this._phase = 'complete'
    this.stopTickLoop()

    if (this.preset && !this.preset.hasReturnPhase) {
      this.engine.fadeVolume(0, 5)
      this.noise.fadeVolume(0, 5)
      this.ambient.fadeVolume(0, 5)
      if (this.isGuidedSession) {
        this.phasedNoise.fadeVolume(0, 5)
      }
    }

    // Play end chime for guided sessions
    if (this.isGuidedSession) {
      this.chime.playChime('end')
      this.voiceCues.stop()
      if (this.resonantToneActive) {
        this.resonantTone.stop()
        this.resonantToneActive = false
      }
    }

    this.callback?.({
      phase: 'complete',
      elapsed: this.preset?.duration ?? this._elapsed,
      beatFreq: this.engine.currentBeatFreq,
    })
  }

  private updatePhase(): void {
    if (!this.preset) return
    const env = this.preset.frequencyEnvelope
    const dur = this.preset.duration
    const t = this._elapsed

    if (env.length < 2) {
      this._phase = 'main'
      return
    }

    const inductionEnd = env[1].time
    const returnStart = env.length >= 3 ? env[env.length - 2].time : dur * 0.85

    if (t < inductionEnd) {
      this._phase = 'induction'
    } else if (this.preset.hasReturnPhase && t > returnStart) {
      this._phase = 'return'
    } else {
      this._phase = 'main'
    }
  }

  /** Linear interpolation between frequency envelope keyframes */
  interpolateFrequency(time: number): number {
    if (!this.preset) return 10

    const env = this.preset.frequencyEnvelope
    if (env.length === 0) return 10
    if (env.length === 1) return env[0].beatFreq
    if (time <= env[0].time) return env[0].beatFreq
    if (time >= env[env.length - 1].time) return env[env.length - 1].beatFreq

    let prev: FrequencyPoint = env[0]
    let next: FrequencyPoint = env[env.length - 1]

    for (let i = 0; i < env.length - 1; i++) {
      if (time >= env[i].time && time < env[i + 1].time) {
        prev = env[i]
        next = env[i + 1]
        break
      }
    }

    const segDur = next.time - prev.time
    if (segDur === 0) return prev.beatFreq
    const progress = (time - prev.time) / segDur
    return prev.beatFreq + (next.beatFreq - prev.beatFreq) * progress
  }

  // ── Guided session helpers ──────────────────────────────

  private getCurrentGuidancePhaseName(elapsed: number): string | undefined {
    if (!this.guidanceScript) return undefined
    const phases = this.guidanceScript.phases
    for (let i = phases.length - 1; i >= 0; i--) {
      if (elapsed >= phases[i].startTime && elapsed < phases[i].endTime) {
        return phases[i].name
      }
    }
    return undefined
  }

  private updateResonantTone(elapsed: number): void {
    if (!this.guidanceScript?.resonantTuning || !this.ctx) return

    const rt = this.guidanceScript.resonantTuning
    const inWindow = elapsed >= rt.startTime && elapsed < rt.endTime

    if (inWindow && !this.resonantToneActive) {
      this.resonantTone.start(
        this.ctx,
        this.ctx.destination,
        rt.frequency ?? 136,
        rt.gainDb ?? -6,
      )
      this.resonantToneActive = true
    } else if (!inWindow && this.resonantToneActive) {
      this.resonantTone.stop()
      this.resonantToneActive = false
    }
  }
}
