import { useEffect } from 'react'
import type { Journey, JourneyProgress, SessionPreset } from '../types'
import { presets } from '../presets'

interface Props {
  journey: Journey
  progress?: JourneyProgress
  onClose: () => void
  onStartDay: (preset: SessionPreset, journeyId: string, day: number) => void
  onReset: (journeyId: string) => void
}

export function JourneyDetail({ journey, progress, onClose, onStartDay, onReset }: Props) {
  const completedDays = progress?.completedDays ?? []
  const nextDay = journey.days.find((d) => !completedDays.includes(d.day))
  const isComplete = completedDays.length >= journey.days.length

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleDayClick = (day: typeof journey.days[number]) => {
    const preset = presets.find((p) => p.id === day.presetId)
    if (preset) {
      onStartDay(preset, journey.id, day.day)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={`${journey.name} journey`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-md sm:rounded-3xl rounded-t-3xl glass animate-slide-up overflow-y-auto max-h-[85dvh]">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-6 pb-6 pt-4">
          {/* Header */}
          <div className="mb-5">
            <span className="text-3xl mb-2 block">{journey.icon}</span>
            <h2 className="text-xl font-medium text-slate-100 mb-1">{journey.name}</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest">
              {journey.category} · {journey.days.length} days
            </p>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed mb-6">{journey.description}</p>

          {/* Days list */}
          <div className="space-y-2 mb-6">
            {journey.days.map((day) => {
              const isDone = completedDays.includes(day.day)
              const isNext = nextDay?.day === day.day
              const preset = presets.find((p) => p.id === day.presetId)

              return (
                <button
                  key={day.day}
                  onClick={() => handleDayClick(day)}
                  className="w-full text-left rounded-2xl p-4 transition-all"
                  style={{
                    background: isDone ? `${journey.color}08` : 'rgba(255,255,255,0.03)',
                    boxShadow: isNext ? `inset 0 0 0 1px ${journey.color}60` : undefined,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Day indicator */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium"
                      style={{
                        background: isDone ? journey.color : 'rgba(255,255,255,0.06)',
                        color: isDone ? 'white' : 'rgb(148, 163, 184)',
                      }}
                    >
                      {isDone ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        day.day
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-medium ${isDone ? 'text-slate-300' : isNext ? 'text-slate-100' : 'text-slate-400'}`}>
                          Day {day.day}: {day.title}
                        </p>
                        {isNext && (
                          <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${journey.color}20`, color: journey.color }}>
                            Next
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{day.tip}</p>
                      {preset && (
                        <p className="text-[10px] text-slate-600 mt-1">
                          {preset.icon} {preset.name} · {Math.round(preset.duration / 60)} min
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Action buttons */}
          {isComplete ? (
            <div className="space-y-3">
              <div className="text-center mb-2">
                <span className="text-2xl">🎉</span>
                <p className="text-sm text-slate-200 mt-1">Journey complete!</p>
              </div>
              <button
                onClick={() => onReset(journey.id)}
                className="w-full py-3 rounded-2xl text-sm text-slate-400 border border-white/10 hover:border-white/20 transition-colors"
              >
                Restart Journey
              </button>
            </div>
          ) : nextDay ? (
            <button
              onClick={() => handleDayClick(nextDay)}
              className="w-full py-4 rounded-2xl text-sm font-medium text-white transition-all active:scale-[0.98] shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${journey.color}, ${journey.color}aa)`,
                boxShadow: `0 8px 32px ${journey.color}30`,
              }}
            >
              Start Day {nextDay.day}: {nextDay.title}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
