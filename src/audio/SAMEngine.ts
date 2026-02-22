/**
 * Spatial Angle Modulation (SAM) Engine
 *
 * Generates a 303 Hz carrier tone and routes it through a stereo panning
 * system driven by a low-frequency oscillator. Rotation speed equals the
 * target brainwave frequency — the listener perceives the tone orbiting
 * around their head, reinforcing cortical entrainment through spatial
 * rather than tonal cues.
 *
 * Two modes:
 *   'smooth'  — sine-LFO panning creates a smooth circular orbit
 *   'erratic' — random discontinuous pan jumps disorient spatial tracking
 *               (used in deep Focus 21 states for dimensional-shift effect)
 */
export class SAMEngine {
  private ctx: AudioContext | null = null
  private oscillator: OscillatorNode | null = null
  private panner: StereoPannerNode | null = null
  private masterGain: GainNode | null = null
  private lfo: OscillatorNode | null = null
  private lfoGain: GainNode | null = null
  private erraticInterval: ReturnType<typeof setInterval> | null = null
  private _rotationHz = 4
  private _mode: 'smooth' | 'erratic' = 'smooth'
  private _isRunning = false

  get isRunning(): boolean {
    return this._isRunning
  }

  start(
    ctx: AudioContext,
    destination: AudioNode,
    rotationHz: number,
    mode: 'smooth' | 'erratic',
    volume: number,
    carrierFreq = 303,
  ): void {
    this.stop()
    this.ctx = ctx
    this._rotationHz = rotationHz
    this._mode = mode

    // 303 Hz carrier oscillator
    this.oscillator = ctx.createOscillator()
    this.oscillator.type = 'sine'
    this.oscillator.frequency.value = carrierFreq

    // Stereo panner driven by LFO (or random jumps in erratic mode)
    this.panner = ctx.createStereoPanner()
    this.panner.pan.value = 0

    // Master gain — SAM sits below binaural beats in the mix
    this.masterGain = ctx.createGain()
    this.masterGain.gain.value = 0 // start silent, fade in
    this.masterGain.gain.setValueAtTime(0, ctx.currentTime)
    this.masterGain.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 3)

    this.oscillator.connect(this.panner)
    this.panner.connect(this.masterGain)
    this.masterGain.connect(destination)
    this.oscillator.start()

    this._applyMode(mode, rotationHz)
    this._isRunning = true
  }

  setRotationHz(hz: number): void {
    this._rotationHz = hz
    if (!this._isRunning) return
    if (this._mode === 'smooth' && this.lfo) {
      this.lfo.frequency.value = hz
    }
    // Erratic mode picks up new hz on next restart of interval (no special action needed)
  }

  setMode(mode: 'smooth' | 'erratic'): void {
    if (this._mode === mode || !this._isRunning) return
    this._mode = mode
    this._clearMode()
    this._applyMode(mode, this._rotationHz)
  }

  setVolume(volume: number): void {
    if (!this.masterGain || !this.ctx) return
    const now = this.ctx.currentTime
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now)
    this.masterGain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.05)
  }

  fadeVolume(targetVolume: number, durationSec: number): void {
    if (!this.masterGain || !this.ctx) return
    const now = this.ctx.currentTime
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now)
    this.masterGain.gain.linearRampToValueAtTime(targetVolume * 0.4, now + durationSec)
  }

  stop(): void {
    this._clearMode()
    try {
      this.oscillator?.stop()
      this.oscillator?.disconnect()
    } catch { /* */ }
    try { this.panner?.disconnect() } catch { /* */ }
    try { this.masterGain?.disconnect() } catch { /* */ }
    this.oscillator = null
    this.panner = null
    this.masterGain = null
    this.ctx = null
    this._isRunning = false
  }

  private _applyMode(mode: 'smooth' | 'erratic', rotationHz: number): void {
    if (!this.ctx || !this.panner) return

    if (mode === 'smooth') {
      // LFO oscillator drives the stereo panner.pan AudioParam directly.
      // An LFO at rotationHz sweeping ±1 creates a full left→right orbit at that frequency.
      this.lfo = this.ctx.createOscillator()
      this.lfo.type = 'sine'
      this.lfo.frequency.value = rotationHz

      // lfoGain scales the LFO output to fill the ±1 pan range
      this.lfoGain = this.ctx.createGain()
      this.lfoGain.gain.value = 1.0

      this.lfo.connect(this.lfoGain)
      this.lfoGain.connect(this.panner.pan)
      this.lfo.start()
    } else {
      // Erratic mode: random pan jumps at ~rotationHz rate (random interval ±50%)
      const baseIntervalMs = (1 / Math.max(rotationHz, 0.5)) * 1000
      const jump = (): void => {
        if (!this.panner || !this._isRunning) return
        const panPos = (Math.random() * 2 - 1)
        this.panner.pan.value = panPos

        // Re-schedule with randomised interval
        const nextMs = baseIntervalMs * (0.5 + Math.random())
        this.erraticInterval = setTimeout(jump, nextMs) as unknown as ReturnType<typeof setInterval>
      }
      this.erraticInterval = setTimeout(jump, baseIntervalMs * Math.random()) as unknown as ReturnType<typeof setInterval>
    }
  }

  private _clearMode(): void {
    if (this.erraticInterval !== null) {
      clearTimeout(this.erraticInterval as unknown as ReturnType<typeof setTimeout>)
      clearInterval(this.erraticInterval)
      this.erraticInterval = null
    }
    if (this.lfo) {
      try {
        this.lfo.stop()
        this.lfo.disconnect()
      } catch { /* */ }
      this.lfo = null
    }
    if (this.lfoGain) {
      try { this.lfoGain.disconnect() } catch { /* */ }
      this.lfoGain = null
    }
  }
}
