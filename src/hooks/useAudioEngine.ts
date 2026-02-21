import { useState, useRef, useCallback, useEffect } from 'react'
import { SessionManager } from '../audio/SessionManager'
import type { SessionPreset, SessionPhase } from '../types'

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
}

export function useAudioEngine() {
  const managerRef = useRef<SessionManager | null>(null)
  const volumeRef = useRef(0.7)
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
      options?: { isochronicEnabled?: boolean; breathingGuideEnabled?: boolean; volume?: number },
    ) => {
      const manager = getManager()
      const isoEnabled = options?.isochronicEnabled ?? false
      const breathEnabled = options?.breathingGuideEnabled ?? false
      if (options?.volume !== undefined) {
        volumeRef.current = options.volume
      }

      await manager.start(preset, volumeRef.current, isoEnabled, ({ phase, elapsed, beatFreq }) => {
        setState((prev) => ({
          ...prev,
          isPlaying: phase !== 'complete',
          isPaused: false,
          phase,
          elapsed,
          beatFreq,
        }))
      })

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
    getManager().stop()
    setState({ ...initialState, volume: volumeRef.current })
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

  const getAnalyser = useCallback((): AnalyserNode | null => {
    return getManager().binauralEngine.analyserNode
  }, [getManager])

  useEffect(() => {
    return () => {
      managerRef.current?.stop()
    }
  }, [])

  return {
    state,
    startSession,
    pause,
    resume,
    stop,
    setVolume,
    toggleIsochronic,
    toggleBreathingGuide,
    getAnalyser,
  }
}
