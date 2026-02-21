import type { NoiseType } from '../types'

export class NoiseGenerator {
  private source: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private ctx: AudioContext | null = null

  get isRunning(): boolean {
    return this.source !== null
  }

  start(ctx: AudioContext, destination: AudioNode, type: NoiseType, volume: number): void {
    if (type === 'none') return
    this.ctx = ctx

    // 10-second buffer to avoid audible loop artifacts
    const bufferSize = ctx.sampleRate * 10
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate)

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch)
      if (type === 'pink') {
        this.fillPinkNoise(data)
      } else {
        this.fillBrownNoise(data)
      }
    }

    this.source = ctx.createBufferSource()
    this.source.buffer = buffer
    this.source.loop = true

    this.gainNode = ctx.createGain()
    this.gainNode.gain.value = volume

    this.source.connect(this.gainNode)
    this.gainNode.connect(destination)
    this.source.start()
  }

  setVolume(volume: number): void {
    if (!this.gainNode || !this.ctx) return
    const now = this.ctx.currentTime
    this.gainNode.gain.cancelScheduledValues(now)
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now)
    this.gainNode.gain.linearRampToValueAtTime(volume, now + 0.05)
  }

  fadeVolume(targetVolume: number, durationSec: number): void {
    if (!this.gainNode || !this.ctx) return
    const now = this.ctx.currentTime
    this.gainNode.gain.cancelScheduledValues(now)
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now)
    this.gainNode.gain.linearRampToValueAtTime(targetVolume, now + durationSec)
  }

  stop(): void {
    try {
      this.source?.stop()
      this.source?.disconnect()
    } catch { /* */ }
    try {
      this.gainNode?.disconnect()
    } catch { /* */ }
    this.source = null
    this.gainNode = null
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

  /** Brown noise — leaky integrator (1/f² spectrum) */
  private fillBrownNoise(data: Float32Array): void {
    let lastOut = 0
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1
      lastOut = (lastOut + 0.02 * white) / 1.02
      data[i] = lastOut * 3.5
    }
  }
}
