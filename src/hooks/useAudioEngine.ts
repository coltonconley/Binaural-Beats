import { useState, useRef, useCallback, useEffect } from 'react'
import { SessionManager } from '../audio/SessionManager'
import type { SessionPreset, SessionPhase, AmbientSoundType } from '../types'

export interface AudioEngineState {
  isPlaying: boolean
  isPaused: boolean
  phase: SessionPhase
  elapsed: number
  duration: number
  beatFreq: number
  volume: number
  activePreset: SessionPreset | null
  isochronicEnabled: boolean
  breathingGuideEnabled: boolean
  ambientSound: AmbientSoundType
  ambientVolume: number
  guidancePhaseName?: string
}

const initialState: AudioEngineState = {
  isPlaying: false,
  isPaused: false,
  phase: 'idle',
  elapsed: 0,
  duration: 0,
  beatFreq: 0,
  volume: 0.7,
  activePreset: null,
  isochronicEnabled: false,
  breathingGuideEnabled: false,
  ambientSound: 'none',
  ambientVolume: 0,
}

export function useAudioEngine() {
  const managerRef = useRef<SessionManager | null>(null)
  const volumeRef = useRef(0.7)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [state, setState] = useState<AudioEngineState>(initialState)

  const getManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = new SessionManager()
    }
    return managerRef.current
  }, [])

  const startSession = useCallback(
    async (
      preset: SessionPreset,
      options?: {
        isochronicEnabled?: boolean
        breathingGuideEnabled?: boolean
        volume?: number
        ambientSound?: AmbientSoundType
        ambientVolume?: number
        voiceEnabled?: boolean
        preferredVoiceName?: string
        voiceRate?: number
      },
    ) => {
      const manager = getManager()
      const isoEnabled = options?.isochronicEnabled ?? false
      const breathEnabled = options?.breathingGuideEnabled ?? false
      const ambSound = options?.ambientSound ?? preset.ambientSound
      const ambVol = options?.ambientVolume ?? preset.ambientVolume
      if (options?.volume !== undefined) {
        volumeRef.current = options.volume
      }

      await manager.start(
        preset,
        volumeRef.current,
        isoEnabled,
        ({ phase, elapsed, beatFreq, guidancePhaseName }) => {
          setState((prev) => ({
            ...prev,
            isPlaying: phase !== 'complete',
            isPaused: false,
            phase,
            elapsed,
            beatFreq,
            guidancePhaseName,
          }))
        },
        ambSound,
        ambVol,
        {
          voiceEnabled: options?.voiceEnabled,
          preferredVoiceName: options?.preferredVoiceName,
          voiceRate: options?.voiceRate,
        },
      )

      setState((prev) => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
        phase: 'induction',
        elapsed: 0,
        duration: preset.duration,
        volume: volumeRef.current,
        activePreset: preset,
        isochronicEnabled: isoEnabled && preset.isochronicAvailable,
        breathingGuideEnabled: breathEnabled,
        ambientSound: ambSound,
        ambientVolume: ambVol,
      }))
    },
    [getManager],
  )

  const pause = useCallback(() => {
    getManager().pause()
    setState((prev) => ({ ...prev, isPaused: true, isPlaying: false }))
  }, [getManager])

  const resume = useCallback(() => {
    getManager().resume()
    setState((prev) => ({ ...prev, isPaused: false, isPlaying: true }))
  }, [getManager])

  const stop = useCallback(() => {
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
    const manager = getManager()
    // Fade out audio briefly before full stop to avoid abrupt cutoff
    manager.fadeOut(0.3)
    fadeTimerRef.current = setTimeout(() => {
      fadeTimerRef.current = null
      manager.stop()
    }, 350)
    setState({ ...initialState, volume: volumeRef.current, ambientSound: 'none', ambientVolume: 0 })
  }, [getManager])

  const setVolume = useCallback(
    (v: number) => {
      volumeRef.current = v
      getManager().setVolume(v)
      setState((prev) => ({ ...prev, volume: v }))
    },
    [getManager],
  )

  const toggleIsochronic = useCallback(() => {
    getManager().toggleIsochronic()
    setState((prev) => ({ ...prev, isochronicEnabled: getManager().isochronicEnabled }))
  }, [getManager])

  const toggleBreathingGuide = useCallback(() => {
    setState((prev) => ({ ...prev, breathingGuideEnabled: !prev.breathingGuideEnabled }))
  }, [])

  const seek = useCallback(
    (targetTime: number) => {
      const manager = getManager()
      manager.seek(targetTime)
      setState((prev) => ({
        ...prev,
        elapsed: targetTime,
        beatFreq: manager.currentBeatFreq,
        phase: manager.phase,
      }))
    },
    [getManager],
  )

  const setAmbientVolume = useCallback(
    (v: number) => {
      getManager().setAmbientVolume(v)
      setState((prev) => ({ ...prev, ambientVolume: v }))
    },
    [getManager],
  )

  const setAmbientSound = useCallback(
    async (sound: AmbientSoundType) => {
      await getManager().setAmbientSound(sound)
      setState((prev) => ({ ...prev, ambientSound: sound }))
    },
    [getManager],
  )

  const getAnalyser = useCallback((): AnalyserNode | null => {
    return getManager().binauralEngine.analyserNode
  }, [getManager])

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current)
      }
      managerRef.current?.stop()
    }
  }, [])

  return {
    state,
    startSession,
    pause,
    resume,
    stop,
    seek,
    setVolume,
    toggleIsochronic,
    toggleBreathingGuide,
    setAmbientVolume,
    setAmbientSound,
    getAnalyser,
  }
}
