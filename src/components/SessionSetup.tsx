import { useState } from 'react'
import type { SessionPreset, SessionOptions } from '../types'
import { bandInfo } from '../presets'
import { FrequencySparkline } from './FrequencySparkline'

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
  const band = bandInfo[preset.targetBand]

  const handleBegin = () => {
    onBegin(preset, {
      isochronicEnabled,
      breathingGuideEnabled,
      volume: volume / 100,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
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
