import { useState, useCallback } from 'react'
import type { SessionPreset, SessionOptions } from './types'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useWakeLock } from './hooks/useWakeLock'
import { Onboarding } from './components/Onboarding'
import { PresetList } from './components/PresetList'
import { SessionSetup } from './components/SessionSetup'
import { Player } from './components/Player'

type View = 'discover' | 'setup' | 'countdown' | 'session'

function App() {
  const [view, setView] = useState<View>('discover')
  const [selectedPreset, setSelectedPreset] = useState<SessionPreset | null>(null)
  const [countdownNum, setCountdownNum] = useState(3)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return !localStorage.getItem('onboarding_complete')
    } catch {
      return true
    }
  })

  const audio = useAudioEngine()
  const wakeLock = useWakeLock()

  const handlePresetSelect = useCallback((preset: SessionPreset) => {
    setSelectedPreset(preset)
    setView('setup')
  }, [])

  const handleSetupClose = useCallback(() => {
    setSelectedPreset(null)
    setView('discover')
  }, [])

  const handleBeginSession = useCallback(
    async (preset: SessionPreset, options: SessionOptions) => {
      setView('countdown')
      setCountdownNum(3)

      // 3-2-1 countdown
      await new Promise<void>((resolve) => {
        let count = 3
        const interval = setInterval(() => {
          count--
          if (count <= 0) {
            clearInterval(interval)
            resolve()
          } else {
            setCountdownNum(count)
          }
        }, 900)
      })

      try {
        await audio.startSession(preset, {
          isochronicEnabled: options.isochronicEnabled,
          breathingGuideEnabled: options.breathingGuideEnabled,
          volume: options.volume,
        })
        await wakeLock.request()
        setView('session')
      } catch (err) {
        console.error('Failed to start session:', err)
        setView('discover')
      }
    },
    [audio, wakeLock],
  )

  const handleStopSession = useCallback(() => {
    audio.stop()
    wakeLock.release()
    setSelectedPreset(null)
    setView('discover')
  }, [audio, wakeLock])

  const handleSessionComplete = useCallback(() => {
    wakeLock.release()
  }, [wakeLock])

  const handleOnboardingComplete = useCallback(() => {
    try {
      localStorage.setItem('onboarding_complete', 'true')
    } catch { /* */ }
    setShowOnboarding(false)
  }, [])

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  if (view === 'countdown') {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--color-bg-deep)' }}>
        <span key={countdownNum} className="animate-countdown text-8xl font-light text-white/80">
          {countdownNum}
        </span>
      </div>
    )
  }

  if (view === 'session' && audio.state.activePreset) {
    return (
      <Player
        state={audio.state}
        onPause={audio.pause}
        onResume={audio.resume}
        onStop={handleStopSession}
        onVolumeChange={audio.setVolume}
        onToggleIsochronic={audio.toggleIsochronic}
        onToggleBreathingGuide={audio.toggleBreathingGuide}
        onComplete={handleSessionComplete}
        getAnalyser={audio.getAnalyser}
      />
    )
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg-deep)' }}>
      <PresetList onSelect={handlePresetSelect} />

      {view === 'setup' && selectedPreset && (
        <SessionSetup
          preset={selectedPreset}
          onClose={handleSetupClose}
          onBegin={handleBeginSession}
        />
      )}
    </div>
  )
}

export default App
