export class ChimeEngine {
  private ctx: AudioContext | null = null
  private dest: AudioNode | null = null

  init(ctx: AudioContext, destination: AudioNode): void {
    this.ctx = ctx
    this.dest = destination
  }

  playChime(type: 'transition' | 'start' | 'end'): void {
    if (!this.ctx || !this.dest) return

    switch (type) {
      case 'transition':
        this.playTransitionChime()
        break
      case 'start':
        this.playMultiNoteChime([523.25, 659.25, 783.99]) // C5, E5, G5 ascending
        break
      case 'end':
        this.playMultiNoteChime([783.99, 659.25, 523.25]) // G5, E5, C5 descending
        break
    }
  }

  stop(): void {
    this.ctx = null
    this.dest = null
  }

  private playTransitionChime(): void {
    if (!this.ctx || !this.dest) return

    const now = this.ctx.currentTime

    // Two-tone bell: 784 Hz + 1175 Hz
    const frequencies = [784, 1175]
    for (const freq of frequencies) {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.value = freq

      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2)

      osc.connect(gain)
      gain.connect(this.dest!)

      osc.start(now)
      osc.stop(now + 2)
    }
  }

  private playMultiNoteChime(frequencies: number[]): void {
    if (!this.ctx || !this.dest) return

    const now = this.ctx.currentTime
    const spacing = 0.15 // 150ms between notes

    for (let i = 0; i < frequencies.length; i++) {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.value = frequencies[i]

      const noteStart = now + i * spacing
      gain.gain.setValueAtTime(0, noteStart)
      gain.gain.linearRampToValueAtTime(0.15, noteStart + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 1.5)

      osc.connect(gain)
      gain.connect(this.dest!)

      osc.start(noteStart)
      osc.stop(noteStart + 1.5)
    }
  }
}
