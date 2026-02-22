export class PhasedNoiseEngine {
  private source: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private panner: StereoPannerNode | null = null
  private lfo: OscillatorNode | null = null
  private lfoGain: GainNode | null = null
  private ctx: AudioContext | null = null
  private targetVolume = 0

  get isRunning(): boolean {
    return this.source !== null
  }

  start(ctx: AudioContext, destination: AudioNode, beatFreq: number, volume: number): void {
    this.ctx = ctx
    this.targetVolume = volume

    // Generate mono pink noise buffer (10 seconds)
    const bufferSize = ctx.sampleRate * 10
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    this.fillPinkNoise(data)

    // Source
    this.source = ctx.createBufferSource()
    this.source.buffer = buffer
    this.source.loop = true

    // Gain
    this.gainNode = ctx.createGain()
    this.gainNode.gain.value = volume

    // Stereo panner
    this.panner = ctx.createStereoPanner()

    // LFO for panning: oscillates pan value at beat frequency
    this.lfo = ctx.createOscillator()
    this.lfo.type = 'sine'
    this.lfo.frequency.value = beatFreq

    this.lfoGain = ctx.createGain()
    this.lfoGain.gain.value = 0.8 // Pan depth (0-1 range, 0.8 = near full pan)

    // Connect LFO → lfoGain → panner.pan
    this.lfo.connect(this.lfoGain)
    this.lfoGain.connect(this.panner.pan)

    // Connect source → gain → panner → destination
    this.source.connect(this.gainNode)
    this.gainNode.connect(this.panner)
    this.panner.connect(destination)

    this.source.start()
    this.lfo.start()
  }

  setPanRate(hz: number): void {
    if (!this.lfo || !this.ctx) return
    const now = this.ctx.currentTime
    this.lfo.frequency.cancelScheduledValues(now)
    this.lfo.frequency.setValueAtTime(this.lfo.frequency.value, now)
    this.lfo.frequency.linearRampToValueAtTime(Math.max(hz, 0.1), now + 0.5)
  }

  setVolume(volume: number): void {
    this.targetVolume = volume
    if (!this.gainNode || !this.ctx) return
    const now = this.ctx.currentTime
    this.gainNode.gain.cancelScheduledValues(now)
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now)
    this.gainNode.gain.linearRampToValueAtTime(volume, now + 0.05)
  }

  fadeVolume(targetVolume: number, durationSec: number): void {
    this.targetVolume = targetVolume
    if (!this.gainNode || !this.ctx) return
    const now = this.ctx.currentTime
    this.gainNode.gain.cancelScheduledValues(now)
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now)
    this.gainNode.gain.linearRampToValueAtTime(targetVolume, now + durationSec)
  }

  restoreVolume(durationSec: number): void {
    this.fadeVolume(this.targetVolume, durationSec)
  }

  stop(): void {
    try { this.lfo?.stop() } catch { /* */ }
    try { this.source?.stop() } catch { /* */ }
    try { this.lfo?.disconnect() } catch { /* */ }
    try { this.lfoGain?.disconnect() } catch { /* */ }
    try { this.source?.disconnect() } catch { /* */ }
    try { this.gainNode?.disconnect() } catch { /* */ }
    try { this.panner?.disconnect() } catch { /* */ }
    this.lfo = null
    this.lfoGain = null
    this.source = null
    this.gainNode = null
    this.panner = null
    this.ctx = null
  }

  /** Pink noise — Paul Kellet's refined Voss-McCartney (1/f spectrum) */
  private fillPinkNoise(data: Float32Array): void {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  }
}
