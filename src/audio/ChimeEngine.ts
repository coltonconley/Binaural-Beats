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

  /**
   * Rocket-pan transition FX — a rising-pitch tone sweeping 200→800 Hz over 3 seconds
   * panned hard left to right simultaneously. Used at the Focus 10→12 transition (~25:30).
   */
  playRocketPan(): void {
    if (!this.ctx || !this.dest) return

    const now = this.ctx.currentTime
    const duration = 3.0

    // Left channel: pitch sweeps upward
    const oscLeft = this.ctx.createOscillator()
    const gainLeft = this.ctx.createGain()
    const panLeft = this.ctx.createStereoPanner()
    oscLeft.type = 'sine'
    oscLeft.frequency.setValueAtTime(200, now)
    oscLeft.frequency.exponentialRampToValueAtTime(800, now + duration)
    gainLeft.gain.setValueAtTime(0, now)
    gainLeft.gain.linearRampToValueAtTime(0.18, now + 0.1)
    gainLeft.gain.linearRampToValueAtTime(0.18, now + duration - 0.3)
    gainLeft.gain.linearRampToValueAtTime(0, now + duration)
    panLeft.pan.value = -1
    oscLeft.connect(gainLeft)
    gainLeft.connect(panLeft)
    panLeft.connect(this.dest)
    oscLeft.start(now)
    oscLeft.stop(now + duration)

    // Right channel: same sweep but starts slightly after, panned right
    const oscRight = this.ctx.createOscillator()
    const gainRight = this.ctx.createGain()
    const panRight = this.ctx.createStereoPanner()
    oscRight.type = 'sine'
    oscRight.frequency.setValueAtTime(200, now + 0.1)
    oscRight.frequency.exponentialRampToValueAtTime(800, now + duration + 0.1)
    gainRight.gain.setValueAtTime(0, now + 0.1)
    gainRight.gain.linearRampToValueAtTime(0.18, now + 0.2)
    gainRight.gain.linearRampToValueAtTime(0.18, now + duration - 0.2)
    gainRight.gain.linearRampToValueAtTime(0, now + duration + 0.1)
    panRight.pan.value = 1
    oscRight.connect(gainRight)
    gainRight.connect(panRight)
    panRight.connect(this.dest)
    oscRight.start(now + 0.1)
    oscRight.stop(now + duration + 0.1)
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
