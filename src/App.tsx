import { useState, useCallback, useRef, useEffect } from 'react'
import type { SessionPreset, SessionOptions, MoodRating, Journey } from './types'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useWakeLock } from './hooks/useWakeLock'
import { useSessionHistory } from './hooks/useSessionHistory'
import { useMediaSession } from './hooks/useMediaSession'
import { useCustomPresets } from './hooks/useCustomPresets'
import { Onboarding } from './components/Onboarding'
import { PresetList } from './components/PresetList'
import { SessionSetup } from './components/SessionSetup'
import { Player } from './components/Player'
import { CompletionScreen } from './components/CompletionScreen'
import { JourneyDetail } from './components/JourneyDetail'
import { SessionBuilder } from './components/SessionBuilder'

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
  const history = useSessionHistory()
  const custom = useCustomPresets()
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval>>(null)
  const [lastCompletedSessionId, setLastCompletedSessionId] = useState<string | null>(null)
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null)
  const [activeJourneyDay, setActiveJourneyDay] = useState<{ journeyId: string; day: number } | null>(null)
  const [completionPreset, setCompletionPreset] = useState<SessionPreset | null>(null)
  const [earlyExitDuration, setEarlyExitDuration] = useState(0)
  const [completedFull, setCompletedFull] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingPreset, setEditingPreset] = useState<SessionPreset | null>(null)

  // Clean up countdown interval on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

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
            countdownIntervalRef.current = null
            resolve()
          } else {
            setCountdownNum(count)
          }
        }, 900)
        countdownIntervalRef.current = interval
      })

      try {
        await audio.startSession(preset, {
          isochronicEnabled: options.isochronicEnabled,
          breathingGuideEnabled: options.breathingGuideEnabled,
          volume: options.volume,
          ambientSound: options.ambientSound,
          ambientVolume: options.ambientVolume,
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

  const handleDismissSession = useCallback(() => {
    audio.stop()
    wakeLock.release()
    setSelectedPreset(null)
    setCompletionPreset(null)
    setView('discover')
  }, [audio, wakeLock])

  const handleEarlyStop = useCallback(() => {
    const preset = audio.state.activePreset
    if (!preset) return

    const elapsed = audio.state.elapsed
    setCompletionPreset(preset)
    setEarlyExitDuration(elapsed)
    setCompletedFull(false)

    // Save partial session to history
    wakeLock.release()
    const session = history.addSession({
      presetId: preset.id,
      presetName: preset.name,
      category: preset.category,
      durationSeconds: Math.round(elapsed),
      completedAt: new Date().toISOString(),
      completedFull: false,
    })
    setLastCompletedSessionId(session.id)

    audio.stop()
    setView('discover')
  }, [audio, wakeLock, history])

  // MediaSession API for lock screen controls + silent audio keepalive
  useMediaSession({
    preset: audio.state.activePreset,
    isPlaying: audio.state.isPlaying,
    isPaused: audio.state.isPaused,
    elapsed: audio.state.elapsed,
    duration: audio.state.duration,
    onPause: audio.pause,
    onResume: audio.resume,
    onStop: handleEarlyStop,
    onSeek: audio.seek,
  })

  const handleSessionComplete = useCallback(() => {
    wakeLock.release()
    if (audio.state.activePreset) {
      setCompletionPreset(audio.state.activePreset)
      setEarlyExitDuration(audio.state.duration)
      setCompletedFull(true)

      const session = history.addSession({
        presetId: audio.state.activePreset.id,
        presetName: audio.state.activePreset.name,
        category: audio.state.activePreset.category,
        durationSeconds: Math.round(audio.state.elapsed),
        completedAt: new Date().toISOString(),
        completedFull: true,
      })
      setLastCompletedSessionId(session.id)

      // Mark journey day as complete if this was a journey session
      if (activeJourneyDay) {
        history.completeJourneyDay(activeJourneyDay.journeyId, activeJourneyDay.day)
        setActiveJourneyDay(null)
      }
    }
  }, [wakeLock, audio.state, history, activeJourneyDay])

  const handleMoodSelect = useCallback(
    (mood: MoodRating) => {
      if (lastCompletedSessionId) {
        history.updateSessionMood(lastCompletedSessionId, mood)
      }
    },
    [lastCompletedSessionId, history],
  )

  const handleSelectJourney = useCallback((journey: Journey) => {
    setSelectedJourney(journey)
  }, [])

  const handleJourneyClose = useCallback(() => {
    setSelectedJourney(null)
  }, [])

  const handleStartJourneyDay = useCallback((preset: SessionPreset, journeyId: string, day: number) => {
    history.startJourney(journeyId)
    setActiveJourneyDay({ journeyId, day })
    setSelectedJourney(null)
    setSelectedPreset(preset)
    setView('setup')
  }, [history])

  const handleOnboardingComplete = useCallback(() => {
    try {
      localStorage.setItem('onboarding_complete', 'true')
    } catch { /* */ }
    setShowOnboarding(false)
  }, [])

  const handleCreateCustom = useCallback(() => {
    setEditingPreset(null)
    setShowBuilder(true)
  }, [])

  const handleEditCustom = useCallback((preset: SessionPreset) => {
    setEditingPreset(preset)
    setShowBuilder(true)
  }, [])

  const handleDeleteCustom = useCallback((id: string) => {
    custom.deletePreset(id)
  }, [custom])

  const handleSaveCustom = useCallback((preset: SessionPreset) => {
    custom.savePreset(preset)
    setShowBuilder(false)
    setEditingPreset(null)
  }, [custom])

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

  // Show CompletionScreen from App level (so it persists after audio stops)
  if (completionPreset) {
    return (
      <CompletionScreen
        preset={completionPreset}
        duration={earlyExitDuration}
        stats={history.stats}
        completedFull={completedFull}
        onMoodSelect={handleMoodSelect}
        onDone={handleDismissSession}
      />
    )
  }

  if (view === 'session' && audio.state.activePreset) {
    return (
      <Player
        state={audio.state}
        onPause={audio.pause}
        onResume={audio.resume}
        onEarlyStop={handleEarlyStop}
        onSeek={audio.seek}
        onVolumeChange={audio.setVolume}
        onToggleIsochronic={audio.toggleIsochronic}
        onToggleBreathingGuide={audio.toggleBreathingGuide}
        onAmbientVolumeChange={audio.setAmbientVolume}
        onAmbientSoundChange={audio.setAmbientSound}
        onComplete={handleSessionComplete}
        hapticEnabled={history.preferences.hapticEnabled}
        getAnalyser={audio.getAnalyser}
      />
    )
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg-deep)' }}>
      <PresetList
        onSelect={handlePresetSelect}
        stats={history.stats}
        favorites={history.preferences.favorites}
        onToggleFavorite={history.toggleFavorite}
        journeyProgress={history.journeyProgress}
        onSelectJourney={handleSelectJourney}
        customPresets={custom.customPresets}
        onCreateCustom={handleCreateCustom}
        onEditCustom={handleEditCustom}
        onDeleteCustom={handleDeleteCustom}
      />

      {selectedJourney && (
        <JourneyDetail
          journey={selectedJourney}
          progress={history.getJourneyProgress(selectedJourney.id)}
          onClose={handleJourneyClose}
          onStartDay={handleStartJourneyDay}
          onReset={history.resetJourney}
        />
      )}

      {view === 'setup' && selectedPreset && (
        <SessionSetup
          preset={selectedPreset}
          onClose={handleSetupClose}
          onBegin={handleBeginSession}
        />
      )}

      {showBuilder && (
        <SessionBuilder
          editingPreset={editingPreset}
          onSave={handleSaveCustom}
          onClose={() => { setShowBuilder(false); setEditingPreset(null) }}
        />
      )}
    </div>
  )
}

export default App
