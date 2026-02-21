import { useRef, useCallback, useEffect } from 'react'
import type { SessionPreset } from '../types'

/**
 * Plays a short preview of a preset's binaural tone.
 * Creates a temporary AudioContext, plays ~5 seconds with fade in/out, then cleans up.
 */
export function usePreviewTone() {
  const ctxRef = useRef<AudioContext | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPlayingRef = useRef(false)

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      ctxRef.current.close().catch(() => {})
    }
    ctxRef.current = null
    isPlayingRef.current = false
  }, [])

  const play = useCallback((preset: SessionPreset, volume: number) => {
    stop()

    try {
      const ctx = new AudioContext()
      ctxRef.current = ctx
      isPlayingRef.current = true

      const masterGain = ctx.createGain()
      masterGain.gain.value = 0
      masterGain.connect(ctx.destination)

      const carrier = preset.carriers[0]
      const beatFreq = preset.frequencyEnvelope[0]?.beatFreq ?? 10

      // Left oscillator (carrier frequency only)
      const leftOsc = ctx.createOscillator()
      leftOsc.type = 'sine'
      leftOsc.frequency.value = carrier.carrierFreq

      const leftPan = ctx.createStereoPanner()
      leftPan.pan.value = -1

      leftOsc.connect(leftPan)
      leftPan.connect(masterGain)

      // Right oscillator (carrier + beat)
      const rightOsc = ctx.createOscillator()
      rightOsc.type = 'sine'
      rightOsc.frequency.value = carrier.carrierFreq + beatFreq

      const rightPan = ctx.createStereoPanner()
      rightPan.pan.value = 1

      rightOsc.connect(rightPan)
      rightPan.connect(masterGain)

      // Noise layer (if preset uses noise)
      let noiseSource: AudioBufferSourceNode | null = null
      if (preset.noiseType !== 'none') {
        const bufferSize = ctx.sampleRate * 2
        const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate)
        for (let ch = 0; ch < 2; ch++) {
          const data = buffer.getChannelData(ch)
          if (preset.noiseType === 'pink') {
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
            for (let i = 0; i < data.length; i++) {
              const w = Math.random() * 2 - 1
              b0 = 0.99886 * b0 + w * 0.0555179
              b1 = 0.99332 * b1 + w * 0.0750759
              b2 = 0.96900 * b2 + w * 0.1538520
              b3 = 0.86650 * b3 + w * 0.3104856
              b4 = 0.55000 * b4 + w * 0.5329522
              b5 = -0.7616 * b5 - w * 0.0168980
              data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
              b6 = w * 0.115926
            }
          } else {
            let lastOut = 0
            for (let i = 0; i < data.length; i++) {
              const w = Math.random() * 2 - 1
              lastOut = (lastOut + 0.02 * w) / 1.02
              data[i] = lastOut * 3.5
            }
          }
        }
        noiseSource = ctx.createBufferSource()
        noiseSource.buffer = buffer
        noiseSource.loop = true

        const noiseGain = ctx.createGain()
        noiseGain.gain.value = 0
        noiseSource.connect(noiseGain)
        noiseGain.connect(ctx.destination)

        noiseSource.start()
        // Fade noise in
        const noiseFadeTarget = preset.noiseVolume * volume * 0.3 // Keep noise quieter in preview
        noiseGain.gain.linearRampToValueAtTime(noiseFadeTarget, ctx.currentTime + 0.8)
        // Fade noise out before end
        noiseGain.gain.setValueAtTime(noiseFadeTarget, ctx.currentTime + 4)
        noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 5)
      }

      leftOsc.start()
      rightOsc.start()

      // Fade in over 0.8s
      const adjustedVolume = volume * 0.3 // Keep oscillators at 30% of set volume
      masterGain.gain.linearRampToValueAtTime(adjustedVolume, ctx.currentTime + 0.8)

      // Hold for ~4s, then fade out over 1s
      masterGain.gain.setValueAtTime(adjustedVolume, ctx.currentTime + 4)
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 5)

      // Stop everything after 5.5s
      timeoutRef.current = setTimeout(() => {
        stop()
      }, 5500)
    } catch {
      stop()
    }
  }, [stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => stop()
  }, [stop])

  return { play, stop, isPlayingRef }
}
