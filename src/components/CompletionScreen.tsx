import { useState } from 'react'
import type { SessionPreset, UserStats, MoodRating } from '../types'
import { bandInfo } from '../presets'

interface Props {
  preset: SessionPreset
  duration: number
  stats: UserStats
  completedFull?: boolean
  onMoodSelect: (mood: MoodRating) => void
  onDone: () => void
}

const MOODS: { value: MoodRating; emoji: string; label: string }[] = [
  { value: 'energized', emoji: '⚡', label: 'Energized' },
  { value: 'calm', emoji: '😌', label: 'Calm' },
  { value: 'focused', emoji: '🎯', label: 'Focused' },
  { value: 'sleepy', emoji: '😴', label: 'Sleepy' },
]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function CompletionScreen({ preset, duration, stats, completedFull = true, onMoodSelect, onDone }: Props) {
  const [selectedMood, setSelectedMood] = useState<MoodRating | null>(null)

  const minBeatFreq = preset.frequencyEnvelope.length > 0
    ? preset.frequencyEnvelope.reduce((min, p) => Math.min(min, p.beatFreq), Infinity)
    : 0

  const handleMood = (mood: MoodRating) => {
    setSelectedMood(mood)
    onMoodSelect(mood)
  }

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

      <div className="relative animate-fade-in-up text-center max-w-sm w-full">
        {/* Checkmark */}
        <div
          className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
          style={{ background: `${preset.color}20` }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={preset.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">{completedFull ? 'Session Complete' : 'Session Ended'}</p>
        <h2 className="text-2xl font-light text-slate-100 mb-1">{preset.name}</h2>
        <p className="text-sm text-slate-400 mb-8">
          {formatTime(duration)} · {bandInfo[preset.targetBand].label}{' '}
          {minBeatFreq.toFixed(0)} Hz
        </p>

        {/* Mood selector */}
        <div className="mb-6">
          <p className="text-xs text-slate-500 mb-3">How do you feel?</p>
          <div className="flex justify-center gap-3">
            {MOODS.map((mood) => (
              <button
                key={mood.value}
                onClick={() => handleMood(mood.value)}
                className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl transition-all ${
                  selectedMood === mood.value
                    ? 'glass scale-105'
                    : 'hover:bg-white/5'
                }`}
                style={selectedMood === mood.value ? { borderColor: `${preset.color}40` } : undefined}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className="text-[10px] text-slate-400">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Streak */}
        {stats.currentStreak > 1 && (
          <div className="mb-6 animate-fade-in">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs text-slate-200">
              <span>🔥</span>
              <span>{stats.currentStreak}-day streak!</span>
            </span>
          </div>
        )}

        {/* Done button */}
        <button
          onClick={onDone}
          className="w-full py-3.5 rounded-2xl text-sm font-medium text-white transition-all active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${preset.color}, ${preset.color}bb)`,
            boxShadow: `0 4px 24px ${preset.color}30`,
          }}
        >
          Done
        </button>
      </div>
    </div>
  )
}
