import { useState, useMemo } from 'react'
import type { SessionPreset, PresetCategory, UserStats, Journey, JourneyProgress } from '../types'
import { presets, categoryLabels, categoryOrder, getRecommendedPresets, getTimeGreeting } from '../presets'
import { journeys } from '../journeys'
import { PresetCard } from './PresetCard'
import { JourneyCard } from './JourneyCard'

interface Props {
  onSelect: (preset: SessionPreset) => void
  stats?: UserStats
  favorites?: string[]
  onToggleFavorite?: (presetId: string) => void
  journeyProgress?: JourneyProgress[]
  onSelectJourney?: (journey: Journey) => void
  customPresets?: SessionPreset[]
  onCreateCustom?: () => void
  onEditCustom?: (preset: SessionPreset) => void
  onDeleteCustom?: (id: string) => void
}

type Filter = 'all' | 'favorites' | PresetCategory

function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}.${Math.round((m / 60) * 10)}h` : `${h}h`
}

export function PresetList({ onSelect, stats, favorites = [], onToggleFavorite, journeyProgress = [], onSelectJourney, customPresets = [], onCreateCustom, onEditCustom, onDeleteCustom }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const hasFavorites = favorites.length > 0
  const hasHistory = stats && stats.totalSessions > 0

  const allPresets = useMemo(() => [...presets, ...customPresets], [customPresets])

  const filtered = filter === 'all'
    ? presets
    : filter === 'favorites'
      ? allPresets.filter((p) => favorites.includes(p.id))
      : filter === 'custom'
        ? customPresets
        : presets.filter((p) => p.category === filter)

  // Time-of-day recommendations
  const recommended = useMemo(() => {
    if (filter !== 'all') return []
    const ids = getRecommendedPresets()
    return presets.filter((p) => ids.includes(p.id))
  }, [filter])

  const greeting = hasHistory ? getTimeGreeting() : null

  const handleDeleteConfirm = (id: string) => {
    onDeleteCustom?.(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-8 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-light tracking-tight text-slate-100">
          {greeting || 'Binaural Beats'}
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

      {/* Stats bar */}
      {stats && stats.totalSessions > 0 && (
        <div className="flex gap-2 mb-4">
          <div className="glass rounded-xl px-3 py-2 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-[11px] text-slate-300 font-medium">
              {stats.totalSessions} {stats.totalSessions === 1 ? 'session' : 'sessions'}
            </span>
          </div>
          <div className="glass rounded-xl px-3 py-2 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span className="text-[11px] text-slate-300 font-medium">
              {formatHours(stats.totalMinutes)}
            </span>
          </div>
          {stats.currentStreak > 0 && (
            <div className="glass rounded-xl px-3 py-2 flex items-center gap-1.5">
              <span className="text-xs">🔥</span>
              <span className="text-[11px] text-slate-300 font-medium">
                {stats.currentStreak}d streak
              </span>
            </div>
          )}
        </div>
      )}

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-none mb-2" style={{ scrollbarWidth: 'none' }}>
        <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </FilterPill>
        {hasFavorites && (
          <FilterPill active={filter === 'favorites'} onClick={() => setFilter('favorites')}>
            ♥ Favorites
          </FilterPill>
        )}
        {categoryOrder.map((cat) => (
          <FilterPill key={cat} active={filter === cat} onClick={() => setFilter(cat)}>
            {categoryLabels[cat]}
          </FilterPill>
        ))}
      </div>

      {/* Recommended section */}
      {filter === 'all' && recommended.length > 0 && (
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Recommended for you</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommended.map((preset, i) => (
              <div key={preset.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                <PresetCard
                  preset={preset}
                  onSelect={onSelect}
                  isFavorite={favorites.includes(preset.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journeys section */}
      {filter === 'all' && onSelectJourney && (
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">7-Day Journeys</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {journeys.map((journey, i) => (
              <div key={journey.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                <JourneyCard
                  journey={journey}
                  progress={journeyProgress.find((p) => p.journeyId === journey.id)}
                  onSelect={onSelectJourney}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Sessions section (custom presets) */}
      {(filter === 'all' || filter === 'custom') && onCreateCustom && (
        <div className="mb-6">
          {filter === 'all' && (
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">My Sessions</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Create card */}
            <div className="animate-fade-in-up">
              <button
                onClick={onCreateCustom}
                className="w-full h-full min-h-[140px] rounded-3xl p-5 transition-all duration-200 active:scale-[0.98] hover:scale-[1.01] flex flex-col items-center justify-center gap-3 create-session-card"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-slate-400">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <span className="text-sm text-slate-400 font-medium">Create Session</span>
              </button>
            </div>

            {/* Custom preset cards */}
            {customPresets.map((preset, i) => (
              <div key={preset.id} className="animate-fade-in-up relative" style={{ animationDelay: `${(i + 1) * 50}ms` }}>
                <PresetCard
                  preset={preset}
                  onSelect={onSelect}
                  isFavorite={favorites.includes(preset.id)}
                  onToggleFavorite={onToggleFavorite}
                />
                {/* Overflow menu */}
                {(onEditCustom || onDeleteCustom) && (
                  <div className="absolute top-3 right-12 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenu(openMenu === preset.id ? null : preset.id)
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label="More options"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="8" cy="3" r="1.5" />
                        <circle cx="8" cy="8" r="1.5" />
                        <circle cx="8" cy="13" r="1.5" />
                      </svg>
                    </button>
                    {openMenu === preset.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                        <div className="absolute right-0 top-9 z-20 glass rounded-xl py-1 min-w-[120px] animate-fade-in shadow-xl">
                          {onEditCustom && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenu(null)
                                onEditCustom(preset)
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          {onDeleteCustom && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenu(null)
                                setDeleteConfirm(preset.id)
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All presets section header */}
      {filter === 'all' && (recommended.length > 0 || onSelectJourney || customPresets.length > 0) && (
        <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">All sessions</p>
      )}

      {/* Preset grid */}
      {filter !== 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((preset, i) => (
            <div key={preset.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
              <PresetCard
                preset={preset}
                onSelect={onSelect}
                isFavorite={favorites.includes(preset.id)}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          ))}
        </div>
      )}

      {filter === 'favorites' && filtered.length === 0 && (
        <p className="text-center text-slate-500 text-sm mt-8">
          Tap the heart on a preset to add it to your favorites.
        </p>
      )}

      {filter === 'custom' && customPresets.length === 0 && (
        <p className="text-center text-slate-500 text-sm mt-4">
          Create your first custom session to get started.
        </p>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={() => setDeleteConfirm(null)} />
          <div className="relative glass rounded-3xl p-6 max-w-xs w-full mx-4 animate-fade-in-up">
            <h3 className="text-base font-medium text-slate-100 mb-2">Delete Session?</h3>
            <p className="text-sm text-slate-400 mb-6">
              This custom session will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-2xl text-sm font-medium text-slate-300 border border-white/10 hover:border-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(deleteConfirm)}
                className="flex-1 py-3 rounded-2xl text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
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
