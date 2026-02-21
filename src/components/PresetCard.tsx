import type { SessionPreset } from '../types'
import { bandInfo } from '../presets'

interface Props {
  preset: SessionPreset
  onSelect: (preset: SessionPreset) => void
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60)
  return `${mins} min`
}

export function PresetCard({ preset, onSelect }: Props) {
  const band = bandInfo[preset.targetBand]

  return (
    <button
      onClick={() => onSelect(preset)}
      className="group relative w-full text-left rounded-3xl p-5 transition-all duration-200 active:scale-[0.98] hover:scale-[1.01]"
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Gradient glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-15 blur-2xl transition-opacity group-hover:opacity-25 pointer-events-none"
        style={{ background: preset.color }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-2xl">{preset.icon}</span>
        </div>

        <h3 className="text-base font-medium text-slate-100 mb-1.5">{preset.name}</h3>
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
          {preset.description}
        </p>

        <div className="flex gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium glass text-slate-300">
            {formatDuration(preset.duration)}
          </span>
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium"
            style={{ background: `${preset.color}20`, color: preset.color }}
          >
            {band.label} {preset.frequencyEnvelope.reduce((min, p) => Math.min(min, p.beatFreq), Infinity).toFixed(0)} Hz
          </span>
        </div>
      </div>
    </button>
  )
}
