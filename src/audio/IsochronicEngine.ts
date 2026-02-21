/**
 * Isochronic tone generator — pulses a single tone on/off at the target
 * brainwave frequency. Uses trapezoidal envelope (2ms attack/release)
 * to avoid clicks. Only effective for frequencies >= 8 Hz.
 */
export class IsochronicEngine {
  private ctx: AudioContext | null = null
  private oscillator: OscillatorNode | null = null
  private pulseGain: GainNode | null = null
  private masterGain: GainNode | null = null
  private schedulerInterval: ReturnType<typeof setInterval> | null = null
  private _beatFreq = 10
  private _isRunning = false
  private lastScheduledTime = 0

  get isRunning(): boolean {
    return this._isRunning
  }

  start(
    ctx: AudioContext,
    destination: AudioNode,
    carrierFreq: number,
    beatFreq: number,
    volume: number,
  ): void {
    this.stop()
    this.ctx = ctx
    this._beatFreq = beatFreq

    this.oscillator = ctx.createOscillator()
    this.oscillator.type = 'sine'
    this.oscillator.frequency.value = carrierFreq

    // Pulse gain — modulated on/off at beat frequency
    this.pulseGain = ctx.createGain()
    this.pulseGain.gain.value = 0

    // Master gain for overall volume (at -6dB relative to binaural)
    this.masterGain = ctx.createGain()
    this.masterGain.gain.value = volume * 0.5

    this.oscillator.connect(this.pulseGain)
    this.pulseGain.connect(this.masterGain)
    this.masterGain.connect(destination)

    this.oscillator.start()
    this.lastScheduledTime = ctx.currentTime

    // Schedule first batch and start recurring scheduler
    this.schedulePulses()
    this.schedulerInterval = setInterval(() => this.schedulePulses(), 900)

    this._isRunning = true
  }

  setBeatFrequency(freq: number): void {
    this._beatFreq = Math.max(freq, 1)
  }

  setVolume(volume: number): void {
    if (!this.masterGain || !this.ctx) return
    const now = this.ctx.currentTime
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now)
    this.masterGain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.05)
  }

  stop(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval)
      this.schedulerInterval = null
    }
    try {
      this.oscillator?.stop()
      this.oscillator?.disconnect()
    } catch { /* */ }
    try { this.pulseGain?.disconnect() } catch { /* */ }
    try { this.masterGain?.disconnect() } catch { /* */ }
    this.oscillator = null
    this.pulseGain = null
    this.masterGain = null
    this.ctx = null
    this._isRunning = false
  }

  /**
   * Pre-schedules ~1.1 seconds of on/off gain ramps using Web Audio's
   * built-in scheduler. Trapezoidal envelope: 2ms attack, 2ms release.
   */
  private schedulePulses(): void {
    if (!this.ctx || !this.pulseGain) return

    const now = this.ctx.currentTime
    const scheduleAhead = 1.1 // seconds
    const endTime = now + scheduleAhead

    // If lastScheduledTime is too far in the past (e.g., after tab backgrounding),
    // reset to now to avoid scheduling a huge backlog of pulses
    const startFrom = this.lastScheduledTime < now - 0.1
      ? now
      : Math.max(this.lastScheduledTime, now)

    // Cancel any previously scheduled values beyond startFrom to prevent overlap
    this.pulseGain.gain.cancelScheduledValues(startFrom)

    const period = 1 / this._beatFreq
    const halfPeriod = period / 2
    const rampTime = 0.002 // 2ms attack/release

    let t = startFrom
    while (t < endTime) {
      const onEnd = t + halfPeriod
      const offEnd = t + period

      // Ramp up (attack)
      this.pulseGain.gain.setValueAtTime(0, t)
      this.pulseGain.gain.linearRampToValueAtTime(1, t + rampTime)

      // Ramp down (release)
      this.pulseGain.gain.setValueAtTime(1, onEnd - rampTime)
      this.pulseGain.gain.linearRampToValueAtTime(0, onEnd)

      // Hold off until next cycle
      this.pulseGain.gain.setValueAtTime(0, offEnd)

      t = offEnd
    }

    this.lastScheduledTime = t
  }
}
