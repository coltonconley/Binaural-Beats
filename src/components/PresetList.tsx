import { useState } from 'react'
import type { SessionPreset, PresetCategory } from '../types'
import { presets, categoryLabels, categoryOrder } from '../presets'
import { PresetCard } from './PresetCard'

interface Props {
  onSelect: (preset: SessionPreset) => void
}

type Filter = 'all' | PresetCategory

export function PresetList({ onSelect }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = filter === 'all'
    ? presets
    : presets.filter((p) => p.category === filter)

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-8 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-light tracking-tight text-slate-100">
          Binaural Beats
        </h1>
        <button
          onClick={() => {
            try { localStorage.removeItem('onboarding_complete') } catch { /* */ }
            window.location.reload()
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Info"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7v4M8 5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-none mb-2" style={{ scrollbarWidth: 'none' }}>
        <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </FilterPill>
        {categoryOrder.map((cat) => (
          <FilterPill key={cat} active={filter === cat} onClick={() => setFilter(cat)}>
            {categoryLabels[cat]}
          </FilterPill>
        ))}
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((preset, i) => (
          <div key={preset.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
            <PresetCard preset={preset} onSelect={onSelect} />
          </div>
        ))}
      </div>
    </div>
  )
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
        active
          ? 'bg-white/10 text-white border border-white/10'
          : 'text-slate-500 hover:text-slate-300 border border-transparent'
      }`}
    >
      {children}
    </button>
  )
}
