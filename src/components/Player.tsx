import { useState, useEffect, useRef, useCallback } from 'react'
import type { AudioEngineState } from '../hooks/useAudioEngine'
import { bandInfo, phaseLabels, getMainPhaseLabel } from '../presets'
import { Visualizer } from './Visualizer'
import { BreathingGuide } from './BreathingGuide'

interface Props {
  state: AudioEngineState
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onVolumeChange: (v: number) => void
  onToggleIsochronic: () => void
  onToggleBreathingGuide: () => void
  onComplete: () => void
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
  onToggleIsochronic: _onToggleIsochronic,
  onToggleBreathingGuide: _onToggleBreathingGuide,
  onComplete,
  getAnalyser,
}: Props) {
  const preset = state.activePreset!
  const [controlsVisible, setControlsVisible] = useState(true)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const dimTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Auto-dim controls
  const resetDimTimer = useCallback(() => {
    setControlsVisible(true)
    if (dimTimerRef.current) clearTimeout(dimTimerRef.current)
    dimTimerRef.current = setTimeout(() => {
      if (!showVolumeSlider && !showStopConfirm) {
        setControlsVisible(false)
      }
    }, 10000)
  }, [showVolumeSlider, showStopConfirm])

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

  const handleInteraction = () => {
    if (!controlsVisible) {
      setControlsVisible(true)
    }
    resetDimTimer()
  }

  // Progress
  const progress = state.duration > 0 ? state.elapsed / state.duration : 0
  const circumference = 2 * Math.PI * 140
  const dashOffset = circumference * (1 - progress)

  // Phase label
  const phaseLabel =
    state.phase === 'main' ? getMainPhaseLabel(preset, state.beatFreq) : phaseLabels[state.phase]

  const orbSize = Math.min(window.innerWidth * 0.6, 300)

  if (showCompletion) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center px-8"
        style={{ background: 'var(--color-bg-deep)' }}
      >
        {/* Ambient glow */}
        <div
          className="absolute w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ background: preset.color }}
        />

        <div className="relative animate-fade-in-up text-center">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Session Complete</p>
          <h2 className="text-2xl font-light text-slate-100 mb-1">{preset.name}</h2>
          <p className="text-sm text-slate-400 mb-8">
            {formatTime(state.duration)} · {bandInfo[preset.targetBand].label}{' '}
            {preset.frequencyEnvelope
              .reduce((min, p) => Math.min(min, p.beatFreq), Infinity)
              .toFixed(0)}{' '}
            Hz
          </p>

          <button
            onClick={onStop}
            className="px-8 py-3 rounded-2xl text-sm font-medium glass text-slate-200 hover:text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--color-bg-deep)' }}
      onClick={handleInteraction}
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
          <BreathingGuide size={orbSize} />
        )}

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-light tracking-tight tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
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
          className="font-mono text-lg text-slate-400 tabular-nums transition-opacity duration-500"
          style={{ opacity: controlsVisible ? 1 : 0.6 }}
        >
          {formatTime(state.elapsed)} / {formatTime(state.duration)}
        </p>
      </div>

      {/* Controls */}
      <div
        className="fixed bottom-0 left-0 right-0 flex items-center justify-center gap-6 pb-8 safe-bottom transition-opacity duration-500"
        style={{ opacity: controlsVisible ? 1 : 0.15 }}
      >
        {/* Stop */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowStopConfirm(true)
          }}
          className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          aria-label="Stop"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="2" width="10" height="10" rx="1.5" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={(e) => {
            e.stopPropagation()
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
            onClick={(e) => {
              e.stopPropagation()
              setShowVolumeSlider(!showVolumeSlider)
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

      {/* Stop confirmation */}
      {showStopConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="glass rounded-3xl p-6 max-w-xs text-center animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-slate-200 mb-4">End session early?</p>
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
