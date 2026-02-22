import { useState, useEffect, useCallback } from 'react'
import type { SessionPreset, SessionOptions, AmbientSoundType } from '../types'
import { bandInfo } from '../presets'
import { FrequencySparkline } from './FrequencySparkline'
import { usePreviewTone } from '../hooks/usePreviewTone'
import { ambientSounds } from '../audio/ambientSounds'

function formatPhaseTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface Props {
  preset: SessionPreset
  onClose: () => void
  onBegin: (preset: SessionPreset, options: SessionOptions) => void
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60)
  return `${mins} min`
}

export function SessionSetup({ preset, onClose, onBegin }: Props) {
  const [volume, setVolume] = useState(70)
  const [isochronicEnabled, setIsochronicEnabled] = useState(false)
  const [breathingGuideEnabled, setBreathingGuideEnabled] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>(preset.ambientSound)
  const [ambientVolume, setAmbientVolume] = useState(Math.round(preset.ambientVolume * 100))
  const band = bandInfo[preset.targetBand]
  const preview = usePreviewTone()

  // Voice settings for guided sessions
  const isGuided = !!preset.guidanceScript
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [voiceRate, setVoiceRate] = useState(85) // stored as 50-150, displayed as 0.5-1.5
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceName, setSelectedVoiceName] = useState('')

  // Load available voices
  useEffect(() => {
    if (!isGuided || typeof speechSynthesis === 'undefined') return

    const loadVoices = () => {
      const available = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'))
      setVoices(available)
      if (available.length > 0 && !selectedVoiceName) {
        setSelectedVoiceName(available[0].name)
      }
    }

    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [isGuided, selectedVoiceName])

  const handleTestVoice = useCallback(() => {
    if (typeof speechSynthesis === 'undefined') return
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance('Mind awake, body asleep.')
    const voice = voices.find(v => v.name === selectedVoiceName)
    if (voice) utterance.voice = voice
    utterance.rate = voiceRate / 100
    utterance.volume = 0.7
    speechSynthesis.speak(utterance)
  }, [voices, selectedVoiceName, voiceRate])

  const handleBegin = () => {
    preview.stop()
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel()
    }
    onBegin(preset, {
      isochronicEnabled,
      breathingGuideEnabled,
      volume: volume / 100,
      ambientSound,
      ambientVolume: ambientVolume / 100,
      voiceEnabled: isGuided ? voiceEnabled : undefined,
      preferredVoiceName: isGuided ? selectedVoiceName : undefined,
      voiceRate: isGuided ? voiceRate / 100 : undefined,
    })
  }

  const handlePreview = useCallback(() => {
    if (isPreviewing) {
      preview.stop()
      setIsPreviewing(false)
    } else {
      preview.play(preset, volume / 100)
      setIsPreviewing(true)
      // Auto-reset after preview duration
      setTimeout(() => setIsPreviewing(false), 5500)
    }
  }, [isPreviewing, preset, volume, preview])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        preview.stop()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, preview])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={`${preset.name} session setup`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={() => {
          preview.stop()
          onClose()
        }}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md sm:rounded-3xl rounded-t-3xl glass animate-slide-up overflow-y-auto max-h-[85dvh]">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-6 pb-6 pt-4">
          {/* Header */}
          <div className="mb-5">
            <span className="text-3xl mb-2 block">{preset.icon}</span>
            <h2 className="text-xl font-medium text-slate-100 mb-1">{preset.name}</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest">
              {preset.category} · {formatDuration(preset.duration)}
            </p>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed mb-6">{preset.description}</p>

          {/* Frequency journey */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Frequency Journey</p>
            <FrequencySparkline
              envelope={preset.frequencyEnvelope}
              duration={preset.duration}
              color={preset.color}
              width={280}
              height={50}
            />
          </div>

          {/* Preview button */}
          <button
            onClick={handlePreview}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all mb-5 ${
              isPreviewing
                ? 'text-white border border-white/20'
                : 'text-slate-300 border border-white/10 hover:border-white/20'
            }`}
            style={isPreviewing ? { background: `${preset.color}15` } : undefined}
          >
            {isPreviewing ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <rect x="2" y="2" width="10" height="10" rx="1.5" />
                </svg>
                Stop Preview
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M3 1l10 6-10 6V1z" />
                </svg>
                Preview Sound
              </>
            )}
          </button>

          {/* Detail pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            <DetailPill label={band.label} value={`${band.range}`} />
            <DetailPill label="Carrier" value={`${preset.carriers[0].carrierFreq} Hz${preset.carriers.length > 1 ? ` +${preset.carriers.length - 1}` : ''}`} />
            <DetailPill label="Noise" value={preset.noiseType === 'none' ? 'None' : preset.noiseType.charAt(0).toUpperCase() + preset.noiseType.slice(1)} />
          </div>

          {/* Volume */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Volume</span>
              <span>{volume}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-[10px] text-slate-600 mt-1">Set to barely comfortable</p>
          </div>

          {/* Ambient sound */}
          <div className="mb-5">
            <p className="text-xs text-slate-500 mb-2">Ambient Sound</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              <button
                onClick={() => setAmbientSound('none')}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  ambientSound === 'none'
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'glass text-slate-400 border border-white/5 hover:border-white/15'
                }`}
              >
                None
              </button>
              {ambientSounds.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setAmbientSound(s.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    ambientSound === s.id
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'glass text-slate-400 border border-white/5 hover:border-white/15'
                  }`}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
            {ambientSound !== 'none' && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>Ambient Volume</span>
                  <span>{ambientVolume}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="space-y-3 mb-6">
            {preset.isochronicAvailable && (
              <Toggle
                label="Isochronic tones"
                description="Adds pulsed tones for stronger cortical response"
                checked={isochronicEnabled}
                onChange={setIsochronicEnabled}
              />
            )}
            <Toggle
              label="Breathing guide"
              description="Visual guide at 5.5 breaths/min for HRV coherence"
              checked={breathingGuideEnabled}
              onChange={setBreathingGuideEnabled}
            />
          </div>

          {/* Guided session: Phase timeline */}
          {isGuided && preset.guidanceScript && (
            <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Guidance Phases</p>
              <div className="space-y-1.5">
                {preset.guidanceScript.phases.map((phase, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{phase.name}</span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      {formatPhaseTime(phase.startTime)} – {formatPhaseTime(phase.endTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guided session: Voice settings */}
          {isGuided && (
            <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Voice Guidance</p>

              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-xs text-slate-300">Voice narration</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={voiceEnabled}
                  aria-label="Voice narration"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${voiceEnabled ? 'bg-purple-500' : 'bg-white/10'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${voiceEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {voiceEnabled && voices.length > 0 && (
                <>
                  <div className="mb-3">
                    <label className="text-[10px] text-slate-500 block mb-1">Voice</label>
                    <select
                      value={selectedVoiceName}
                      onChange={(e) => setSelectedVoiceName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-white/20"
                    >
                      {voices.map((v) => (
                        <option key={v.name} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Speech rate</span>
                      <span>{(voiceRate / 100).toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={voiceRate}
                      onChange={(e) => setVoiceRate(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <button
                    onClick={handleTestVoice}
                    className="w-full py-2 rounded-xl text-xs font-medium text-slate-400 border border-white/10 hover:border-white/20 transition-colors"
                  >
                    Test Voice
                  </button>
                </>
              )}

              {voiceEnabled && voices.length === 0 && typeof speechSynthesis !== 'undefined' && (
                <p className="text-[10px] text-slate-500">Loading voices...</p>
              )}

              {typeof speechSynthesis === 'undefined' && (
                <p className="text-[10px] text-amber-500/70">Voice synthesis not available in this browser. Chimes will still play.</p>
              )}
            </div>
          )}

          {/* Headphone notice */}
          <div className="flex items-center gap-2 mb-6 text-slate-500">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <path d="M4 10V9C4 5.7 6.7 3 10 3H8C4.7 3 2 5.7 2 9V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="1" y="9" width="3" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="12" y="9" width="3" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 10V9C12 5.7 9.3 3 6 3H8C11.3 3 14 5.7 14 9V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-[10px]">Stereo headphones required for binaural effect</span>
          </div>

          {/* Begin button */}
          <button
            onClick={handleBegin}
            className="w-full py-4 rounded-2xl text-sm font-medium text-white transition-all active:scale-[0.98] shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${preset.color}, ${preset.color}aa)`,
              boxShadow: `0 8px 32px ${preset.color}30`,
            }}
          >
            Begin Session
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl px-3 py-2 text-center">
      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-0.5">{label}</p>
      <p className="text-xs text-slate-300 font-medium">{value}</p>
    </div>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm text-slate-300">{label}</p>
        <p className="text-[10px] text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${checked ? 'bg-purple-500' : 'bg-white/10'}`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}
