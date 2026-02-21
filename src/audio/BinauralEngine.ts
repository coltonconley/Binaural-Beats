import type { CarrierLayer } from '../types'

interface OscillatorPair {
  left: OscillatorNode
  right: OscillatorNode
  leftGain: GainNode
  rightGain: GainNode
  leftPan: StereoPannerNode
  rightPan: StereoPannerNode
  carrierFreq: number
}

export class BinauralEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private pairs: OscillatorPair[] = []
  private _currentBeatFreq = 0
  private _isRunning = false

  get audioContext(): AudioContext | null {
    return this.ctx
  }

  get analyserNode(): AnalyserNode | null {
    return this.analyser
  }

  get isRunning(): boolean {
    return this._isRunning
  }

  get currentBeatFreq(): number {
    return this._currentBeatFreq
  }

  get masterGainNode(): GainNode | null {
    return this.masterGain
  }

  async start(carriers: CarrierLayer[], beatFreq: number, volume: number): Promise<void> {
    if (this._isRunning) this.stop()

    // Use system default sample rate — don't force 44100
    this.ctx = new AudioContext()

    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = volume

    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.8

    this.masterGain.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)

    this.pairs = carriers.map((layer) => this.createPair(layer, beatFreq))

    this._currentBeatFreq = beatFreq
    this._isRunning = true
  }

  /** Start with an existing AudioContext (for sharing with IsochronicEngine) */
  startWithContext(
    ctx: AudioContext,
    destination: AudioNode,
    carriers: CarrierLayer[],
    beatFreq: number,
    volume: number,
  ): { masterGain: GainNode; analyser: AnalyserNode } {
    if (this._isRunning) this.stopNodes()

    this.ctx = ctx

    this.masterGain = ctx.createGain()
    this.masterGain.gain.value = volume

    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.8

    this.masterGain.connect(this.analyser)
    this.analyser.connect(destination)

    this.pairs = carriers.map((layer) => this.createPair(layer, beatFreq))

    this._currentBeatFreq = beatFreq
    this._isRunning = true

    return { masterGain: this.masterGain, analyser: this.analyser }
  }

  private createPair(layer: CarrierLayer, beatFreq: number): OscillatorPair {
    const ctx = this.ctx!

    const left = ctx.createOscillator()
    left.type = 'sine'
    left.frequency.value = layer.carrierFreq

    const right = ctx.createOscillator()
    right.type = 'sine'
    right.frequency.value = layer.carrierFreq + beatFreq

    // 0.3 amplitude per oscillator for headroom with multi-layer stacking
    const linearGain = Math.pow(10, layer.gainDb / 20) * 0.3

    const leftGain = ctx.createGain()
    leftGain.gain.value = linearGain

    const rightGain = ctx.createGain()
    rightGain.gain.value = linearGain

    // Hard pan: critical for binaural beats
    const leftPan = ctx.createStereoPanner()
    leftPan.pan.value = -1

    const rightPan = ctx.createStereoPanner()
    rightPan.pan.value = 1

    left.connect(leftGain)
    leftGain.connect(leftPan)
    leftPan.connect(this.masterGain!)

    right.connect(rightGain)
    rightGain.connect(rightPan)
    rightPan.connect(this.masterGain!)

    left.start()
    right.start()

    return { left, right, leftGain, rightGain, leftPan, rightPan, carrierFreq: layer.carrierFreq }
  }

  rampBeatFrequency(newBeatFreq: number, durationSec: number): void {
    if (!this.ctx || !this._isRunning) return

    const now = this.ctx.currentTime
    for (const pair of this.pairs) {
      const targetFreq = pair.carrierFreq + newBeatFreq
      pair.right.frequency.cancelScheduledValues(now)
      pair.right.frequency.setValueAtTime(pair.right.frequency.value, now)
      // Use linearRamp for small changes (habituation oscillation),
      // exponentialRamp for larger frequency sweeps
      if (Math.abs(newBeatFreq - this._currentBeatFreq) < 1) {
        pair.right.frequency.linearRampToValueAtTime(targetFreq, now + durationSec)
      } else {
        pair.right.frequency.exponentialRampToValueAtTime(
          Math.max(targetFreq, 0.01),
          now + durationSec,
        )
      }
    }
    this._currentBeatFreq = newBeatFreq
  }

  setBeatFrequency(beatFreq: number): void {
    if (!this.ctx || !this._isRunning) return
    for (const pair of this.pairs) {
      pair.right.frequency.value = pair.carrierFreq + beatFreq
    }
    this._currentBeatFreq = beatFreq
  }

  setVolume(volume: number): void {
    if (!this.masterGain || !this.ctx) return
    const now = this.ctx.currentTime
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now)
    this.masterGain.gain.linearRampToValueAtTime(volume, now + 0.05)
  }

  fadeVolume(targetVolume: number, durationSec: number): void {
    if (!this.masterGain || !this.ctx) return
    const now = this.ctx.currentTime
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now)
    this.masterGain.gain.linearRampToValueAtTime(targetVolume, now + durationSec)
  }

  private stopNodes(): void {
    for (const pair of this.pairs) {
      try {
        pair.left.stop()
        pair.right.stop()
        pair.left.disconnect()
        pair.right.disconnect()
        pair.leftGain.disconnect()
        pair.rightGain.disconnect()
        pair.leftPan.disconnect()
        pair.rightPan.disconnect()
      } catch {
        // Already stopped
      }
    }
    this.pairs = []
    if (this.masterGain) {
      try { this.masterGain.disconnect() } catch { /* */ }
    }
    if (this.analyser) {
      try { this.analyser.disconnect() } catch { /* */ }
    }
    this.masterGain = null
    this.analyser = null
    this._isRunning = false
    this._currentBeatFreq = 0
  }

  stop(): void {
    this.stopNodes()
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close()
    }
    this.ctx = null
  }

  /** Stop nodes without closing the AudioContext (when context is shared) */
  stopShared(): void {
    this.stopNodes()
    this.ctx = null
  }
}
