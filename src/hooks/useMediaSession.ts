import { useEffect, useRef, useCallback } from 'react'
import type { SessionPreset } from '../types'

interface MediaSessionOptions {
  preset: SessionPreset | null
  isPlaying: boolean
  isPaused: boolean
  elapsed: number
  duration: number
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

/**
 * Integrates with the MediaSession API for lock screen / notification controls
 * and keeps a silent <audio> element playing to prevent Web Audio suspension
 * on mobile when the screen locks.
 */
export function useMediaSession({
  preset,
  isPlaying,
  isPaused,
  elapsed,
  duration,
  onPause,
  onResume,
  onStop,
}: MediaSessionOptions) {
  const silentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Create and manage silent audio keepalive
  const startKeepalive = useCallback(() => {
    if (silentAudioRef.current) return

    try {
      // Generate a tiny silent WAV inline (44-byte header + 2 seconds of silence at 8kHz mono)
      const sampleRate = 8000
      const numSamples = sampleRate * 2
      const dataSize = numSamples * 2 // 16-bit samples
      const fileSize = 44 + dataSize

      const buffer = new ArrayBuffer(fileSize)
      const view = new DataView(buffer)

      // WAV header
      const writeStr = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
      }
      writeStr(0, 'RIFF')
      view.setUint32(4, fileSize - 8, true)
      writeStr(8, 'WAVE')
      writeStr(12, 'fmt ')
      view.setUint32(16, 16, true)     // chunk size
      view.setUint16(20, 1, true)      // PCM
      view.setUint16(22, 1, true)      // mono
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * 2, true) // byte rate
      view.setUint16(32, 2, true)      // block align
      view.setUint16(34, 16, true)     // bits per sample
      writeStr(36, 'data')
      view.setUint32(40, dataSize, true)
      // Data is already zeroed (silence)

      const blob = new Blob([buffer], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)

      const audio = new Audio(url)
      audio.loop = true
      audio.volume = 0.01 // Near-silent
      audio.play().catch(() => { /* autoplay blocked, fine */ })

      silentAudioRef.current = audio
    } catch {
      // Silent audio not supported, gracefully degrade
    }
  }, [])

  const stopKeepalive = useCallback(() => {
    if (silentAudioRef.current) {
      silentAudioRef.current.pause()
      silentAudioRef.current.src = ''
      silentAudioRef.current = null
    }
  }, [])

  // MediaSession metadata + handlers
  useEffect(() => {
    if (!('mediaSession' in navigator) || !preset) return

    if (isPlaying || isPaused) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: preset.name,
        artist: 'Binaural Beats',
        album: preset.category.charAt(0).toUpperCase() + preset.category.slice(1),
      })

      navigator.mediaSession.playbackState = isPaused ? 'paused' : 'playing'

      navigator.mediaSession.setActionHandler('play', () => onResume())
      navigator.mediaSession.setActionHandler('pause', () => onPause())
      navigator.mediaSession.setActionHandler('stop', () => onStop())

      // Position state for progress on lock screen
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: Math.min(elapsed, duration),
        })
      } catch {
        // setPositionState not supported in all browsers
      }
    }

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null
        navigator.mediaSession.playbackState = 'none'
        navigator.mediaSession.setActionHandler('play', null)
        navigator.mediaSession.setActionHandler('pause', null)
        navigator.mediaSession.setActionHandler('stop', null)
      }
    }
  }, [preset, isPlaying, isPaused, elapsed, duration, onPause, onResume, onStop])

  // Start/stop keepalive with session
  useEffect(() => {
    if (isPlaying) {
      startKeepalive()
    } else if (!isPaused) {
      stopKeepalive()
    }

    return () => {
      stopKeepalive()
    }
  }, [isPlaying, isPaused, startKeepalive, stopKeepalive])
}
