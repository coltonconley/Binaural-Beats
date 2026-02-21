import type { Journey, JourneyProgress } from '../types'

interface Props {
  journey: Journey
  progress?: JourneyProgress
  onSelect: (journey: Journey) => void
}

export function JourneyCard({ journey, progress, onSelect }: Props) {
  const completedDays = progress?.completedDays.length ?? 0
  const totalDays = journey.days.length
  const progressPct = totalDays > 0 ? (completedDays / totalDays) * 100 : 0
  const isComplete = completedDays >= totalDays

  return (
    <button
      onClick={() => onSelect(journey)}
      className="group relative w-full text-left rounded-3xl p-5 transition-all duration-200 active:scale-[0.98] hover:scale-[1.01]"
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Gradient glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-15 blur-2xl transition-opacity group-hover:opacity-25 pointer-events-none"
        style={{ background: journey.color }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-2xl">{journey.icon}</span>
          {isComplete && (
            <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full font-medium" style={{ background: `${journey.color}20`, color: journey.color }}>
              Complete
            </span>
          )}
        </div>

        <h3 className="text-base font-medium text-slate-100 mb-1.5">{journey.name}</h3>
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
          {journey.description}
        </p>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: journey.color,
              }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-medium shrink-0">
            {completedDays}/{totalDays} days
          </span>
        </div>
      </div>
    </button>
  )
}
