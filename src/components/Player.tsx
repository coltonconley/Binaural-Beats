import { useState, useEffect, useRef, useCallback } from 'react'
import type { AudioEngineState } from '../hooks/useAudioEngine'
import type { UserStats, MoodRating } from '../types'
import { phaseLabels, getMainPhaseLabel } from '../presets'
import { Visualizer } from './Visualizer'
import { BreathingGuide } from './BreathingGuide'
import { CompletionScreen } from './CompletionScreen'

interface Props {
  state: AudioEngineState
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onVolumeChange: (v: number) => void
  onToggleIsochronic: () => void
  onToggleBreathingGuide: () => void
  onComplete: () => void
  onMoodSelect: (mood: MoodRating) => void
  stats: UserStats
  hapticEnabled: boolean
  getAnalyser: () => AnalyserNode | null
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getBandLabel(freq: number): string {
  if (freq < 4) return 'Delta'
  if (freq < 8) return 'Theta'
  if (freq < 13) return 'Alpha'
  if (freq < 30) return 'Beta'
  return 'Gamma'
}

export function Player({
  state,
  onPause,
  onResume,
  onStop,
  onVolumeChange,
  onToggleIsochronic,
  onToggleBreathingGuide,
  onComplete,
  onMoodSelect,
  stats,
  hapticEnabled,
  getAnalyser,
}: Props) {
  const preset = state.activePreset!
  const [controlsVisible, setControlsVisible] = useState(true)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const dimTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  // Use refs for values read inside the setTimeout to avoid stale closures
  const showVolumeSliderRef = useRef(showVolumeSlider)
  const showStopConfirmRef = useRef(showStopConfirm)
  const showSettingsRef = useRef(showSettings)
  showVolumeSliderRef.current = showVolumeSlider
  showStopConfirmRef.current = showStopConfirm
  showSettingsRef.current = showSettings

  const resetDimTimer = useCallback(() => {
    setControlsVisible(true)
    if (dimTimerRef.current) clearTimeout(dimTimerRef.current)
    dimTimerRef.current = setTimeout(() => {
      // Read from refs to avoid stale closure
      if (!showVolumeSliderRef.current && !showStopConfirmRef.current && !showSettingsRef.current) {
        setControlsVisible(false)
      }
    }, 10000)
  }, []) // No dependencies — reads from refs

  // Start the dim timer on mount
  useEffect(() => {
    resetDimTimer()
    return () => {
      if (dimTimerRef.current) clearTimeout(dimTimerRef.current)
    }
  }, [resetDimTimer])

  // Handle completion
  useEffect(() => {
    if (state.phase === 'complete' && !showCompletion) {
      setShowCompletion(true)
      onComplete()
    }
  }, [state.phase, showCompletion, onComplete])

  const handleInteraction = useCallback(() => {
    setControlsVisible(true)
    resetDimTimer()
  }, [resetDimTimer])

  // Close popups when clicking the main background
  const handleBackgroundClick = useCallback(() => {
    if (showVolumeSlider) setShowVolumeSlider(false)
    if (showSettings) setShowSettings(false)
    handleInteraction()
  }, [showVolumeSlider, showSettings, handleInteraction])

  // Progress
  const progress = state.duration > 0 ? state.elapsed / state.duration : 0
  const circumference = 2 * Math.PI * 140
  const dashOffset = circumference * (1 - progress)

  // Phase label
  const phaseLabel =
    state.phase === 'main' ? getMainPhaseLabel(preset, state.beatFreq) : phaseLabels[state.phase]

  const orbSize = typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.6, 300) : 300

  // Sleep fade: for sleep presets, progressively dim the UI to pure black
  const isSleepPreset = preset.category === 'sleep'
  const sleepFadeOpacity = isSleepPreset
    ? Math.min(1, Math.max(0, (progress - 0.3) / 0.4)) // 0 at 30%, 1 at 70%
    : 0

  if (showCompletion) {
    return (
      <CompletionScreen
        preset={preset}
        duration={state.duration}
        stats={stats}
        onMoodSelect={onMoodSelect}
        onDone={onStop}
      />
    )
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--color-bg-deep)' }}
      onClick={handleBackgroundClick}
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full -top-40 -left-40"
          style={{
            background: `radial-gradient(circle, ${preset.color}12 0%, transparent 70%)`,
            animation: 'gradient-drift-1 60s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full -bottom-40 -right-40"
          style={{
            background: `radial-gradient(circle, ${preset.color}08 0%, transparent 70%)`,
            animation: 'gradient-drift-2 45s ease-in-out infinite',
          }}
        />
      </div>

      {/* The Orb */}
      <div className="relative" style={{ width: orbSize, height: orbSize }}>
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full animate-orb-glow"
          style={{
            boxShadow: `0 0 80px 20px ${preset.color}`,
            opacity: 0.15,
          }}
        />

        {/* Progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 300 300">
          {/* Track */}
          <circle cx="150" cy="150" r="140" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
          {/* Progress */}
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="none"
            stroke={preset.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        {/* Inner surface with subtle gradient */}
        <div
          className="absolute inset-4 rounded-full"
          style={{
            background: `radial-gradient(circle at 40% 40%, rgba(255,255,255,0.03) 0%, transparent 60%)`,
          }}
        />

        {/* Waveform visualization */}
        <div className="absolute inset-4 rounded-full overflow-hidden">
          <Visualizer getAnalyser={getAnalyser} color={preset.color} isPlaying={state.isPlaying} />
        </div>

        {/* Breathing guide */}
        {state.breathingGuideEnabled && (
          <BreathingGuide size={orbSize} hapticEnabled={hapticEnabled} />
        )}

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-light tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {state.beatFreq.toFixed(1)} Hz
          </span>
          <span className="text-xs uppercase tracking-widest text-slate-400 mt-1">
            {getBandLabel(state.beatFreq)}
          </span>
        </div>
      </div>

      {/* Phase & time */}
      <div className="mt-8 text-center">
        <p
          className="text-[10px] uppercase tracking-[0.2em] font-medium mb-2 transition-all duration-500"
          style={{ color: preset.color, opacity: controlsVisible ? 1 : 0.6 }}
        >
          {phaseLabel}
        </p>
        <p
          className="font-mono text-lg text-slate-400 transition-opacity duration-500"
          style={{ opacity: controlsVisible ? 1 : 0.6, fontVariantNumeric: 'tabular-nums' }}
        >
          {formatTime(state.elapsed)} / {formatTime(state.duration)}
        </p>
      </div>

      {/* Controls */}
      <div
        className="fixed bottom-0 left-0 right-0 flex items-center justify-center gap-4 pb-8 safe-bottom transition-opacity duration-500"
        style={{ opacity: controlsVisible ? 1 : 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Stop */}
        <button
          onClick={() => {
            setShowStopConfirm(true)
          }}
          className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          aria-label="Stop"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="2" width="10" height="10" rx="1.5" />
          </svg>
        </button>

        {/* Settings (isochronic + breathing) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSettings(!showSettings)
              setShowVolumeSlider(false)
              resetDimTimer()
            }}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="8" cy="8" r="3" />
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
            </svg>
          </button>

          {/* Settings popup */}
          {showSettings && (
            <div
              className="absolute bottom-14 left-1/2 -translate-x-1/2 glass rounded-2xl p-4 animate-fade-in min-w-[200px]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Breathing guide toggle */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-xs text-slate-300">Breathing guide</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={state.breathingGuideEnabled}
                  aria-label="Breathing guide"
                  onClick={() => onToggleBreathingGuide()}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${state.breathingGuideEnabled ? 'bg-purple-500' : 'bg-white/10'}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${state.breathingGuideEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              {/* Isochronic toggle (only if available) */}
              {preset.isochronicAvailable && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-300">Isochronic tones</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={state.isochronicEnabled}
                    aria-label="Isochronic tones"
                    onClick={() => onToggleIsochronic()}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${state.isochronicEnabled ? 'bg-purple-500' : 'bg-white/10'}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${state.isochronicEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Play/Pause */}
        <button
          onClick={() => {
            if (state.isPaused) {
              onResume()
            } else {
              onPause()
            }
            resetDimTimer()
          }}
          className="w-16 h-16 rounded-full flex items-center justify-center text-white transition-all active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${preset.color}, ${preset.color}bb)`,
            boxShadow: `0 4px 24px ${preset.color}40`,
          }}
          aria-label={state.isPaused ? 'Resume' : 'Pause'}
        >
          {state.isPaused ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
              <path d="M6 3l14 8-14 8V3z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="4" y="3" width="4" height="14" rx="1" />
              <rect x="12" y="3" width="4" height="14" rx="1" />
            </svg>
          )}
        </button>

        {/* Volume */}
        <div className="relative">
          <button
            onClick={() => {
              setShowVolumeSlider(!showVolumeSlider)
              setShowSettings(false)
              resetDimTimer()
            }}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Volume"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 6h2l3-3v10l-3-3H3V6z" fill="currentColor" />
              <path d="M11 5.5c.7.7 1 1.6 1 2.5s-.3 1.8-1 2.5" />
            </svg>
          </button>

          {/* Volume slider popup */}
          {showVolumeSlider && (
            <div
              className="absolute bottom-14 left-1/2 -translate-x-1/2 glass rounded-2xl p-4 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-36 flex items-center justify-center">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(state.volume * 100)}
                  onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                  className="w-36 -rotate-90"
                />
              </div>
              <p className="text-center text-xs text-slate-400 mt-1">{Math.round(state.volume * 100)}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Sleep fade overlay */}
      {isSleepPreset && sleepFadeOpacity > 0 && (
        <div
          className="fixed inset-0 bg-black pointer-events-none transition-opacity duration-[3000ms]"
          style={{ opacity: sleepFadeOpacity, zIndex: 40 }}
        />
      )}

      {/* Stop confirmation */}
      {showStopConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in"
          onClick={() => setShowStopConfirm(false)}
        >
          <div className="glass rounded-3xl p-6 max-w-xs text-center animate-fade-in-up" role="alertdialog" aria-describedby="stop-confirm-msg" onClick={(e) => e.stopPropagation()}>
            <p id="stop-confirm-msg" className="text-sm text-slate-200 mb-4">End session early?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStopConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm text-slate-400 border border-white/10 hover:border-white/20 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={onStop}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 transition-colors"
              >
                End
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
