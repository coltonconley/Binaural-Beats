export class ResonantToneEngine {
  private osc: OscillatorNode | null = null
  private gainNode: GainNode | null = null
  private ctx: AudioContext | null = null

  get isRunning(): boolean {
    return this.osc !== null
  }

  start(ctx: AudioContext, destination: AudioNode, frequency = 136, gainDb = -6): void {
    this.ctx = ctx

    this.osc = ctx.createOscillator()
    this.osc.type = 'sine'
    this.osc.frequency.value = frequency

    this.gainNode = ctx.createGain()
    const linearGain = Math.pow(10, gainDb / 20)
    this.gainNode.gain.value = 0

    this.osc.connect(this.gainNode)
    this.gainNode.connect(destination)
    this.osc.start()

    // Fade in over 2 seconds
    const now = ctx.currentTime
    this.gainNode.gain.setValueAtTime(0, now)
    this.gainNode.gain.linearRampToValueAtTime(linearGain, now + 2)
  }

  fadeVolume(targetVolume: number, durationSec: number): void {
    if (!this.gainNode || !this.ctx) return
    const now = this.ctx.currentTime
    this.gainNode.gain.cancelScheduledValues(now)
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now)
    this.gainNode.gain.linearRampToValueAtTime(targetVolume, now + durationSec)
  }

  stop(): void {
    if (this.osc) {
      try {
        if (this.gainNode && this.ctx) {
          const now = this.ctx.currentTime
          this.gainNode.gain.cancelScheduledValues(now)
          this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now)
          this.gainNode.gain.linearRampToValueAtTime(0, now + 0.5)
          this.osc.stop(now + 0.6)
        } else {
          this.osc.stop()
        }
      } catch { /* already stopped */ }
    }
    try { this.osc?.disconnect() } catch { /* */ }
    try { this.gainNode?.disconnect() } catch { /* */ }
    this.osc = null
    this.gainNode = null
    this.ctx = null
  }
}
