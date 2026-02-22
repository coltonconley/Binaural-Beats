import { useState, useCallback } from 'react'
import type { CompletedSession, UserStats, UserPreferences, MoodRating, JourneyProgress } from '../types'

const STORAGE_KEYS = {
  sessions: 'bb_sessions',
  stats: 'bb_stats',
  preferences: 'bb_preferences',
  journeys: 'bb_journeys',
} as const

const DEFAULT_STATS: UserStats = {
  totalSessions: 0,
  totalMinutes: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastSessionDate: null,
}

const DEFAULT_PREFERENCES: UserPreferences = {
  favorites: [],
  hapticEnabled: false,
  reducedMotion: false,
}

const MAX_SESSIONS = 100

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* quota exceeded or private browsing */ }
}

function getTodayStr(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date()) // YYYY-MM-DD in local TZ
}

function getYesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return new Intl.DateTimeFormat('en-CA').format(d)
}

function computeStreakUpdate(stats: UserStats): Pick<UserStats, 'currentStreak' | 'longestStreak' | 'lastSessionDate'> {
  const today = getTodayStr()
  const yesterday = getYesterdayStr()

  let currentStreak = stats.currentStreak

  if (stats.lastSessionDate === today) {
    // Already recorded a session today — streak unchanged
  } else if (stats.lastSessionDate === yesterday) {
    currentStreak += 1
  } else {
    currentStreak = 1
  }

  return {
    currentStreak,
    longestStreak: Math.max(stats.longestStreak, currentStreak),
    lastSessionDate: today,
  }
}

export function useSessionHistory() {
  const [sessions, setSessions] = useState<CompletedSession[]>(() =>
    readJSON(STORAGE_KEYS.sessions, []),
  )
  const [stats, setStats] = useState<UserStats>(() =>
    readJSON(STORAGE_KEYS.stats, DEFAULT_STATS),
  )
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    readJSON(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES),
  )
  const [journeyProgress, setJourneyProgress] = useState<JourneyProgress[]>(() =>
    readJSON(STORAGE_KEYS.journeys, []),
  )

  const addSession = useCallback(
    (session: Omit<CompletedSession, 'id'>): CompletedSession => {
      const complete: CompletedSession = {
        ...session,
        id: crypto.randomUUID(),
      }

      setSessions((prev) => {
        const updated = [complete, ...prev].slice(0, MAX_SESSIONS)
        writeJSON(STORAGE_KEYS.sessions, updated)
        return updated
      })

      setStats((prev) => {
        const streakUpdate = computeStreakUpdate(prev)
        const newStats: UserStats = {
          totalSessions: prev.totalSessions + 1,
          totalMinutes: prev.totalMinutes + Math.round(session.durationSeconds / 60),
          ...streakUpdate,
        }
        writeJSON(STORAGE_KEYS.stats, newStats)
        return newStats
      })

      return complete
    },
    [],
  )

  const updateSessionMood = useCallback(
    (sessionId: string, mood: MoodRating): void => {
      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === sessionId ? { ...s, mood } : s,
        )
        writeJSON(STORAGE_KEYS.sessions, updated)
        return updated
      })
    },
    [],
  )

  const toggleFavorite = useCallback(
    (presetId: string): void => {
      setPreferences((prev) => {
        const favs = prev.favorites
        const next = favs.includes(presetId)
          ? favs.filter((id) => id !== presetId)
          : [...favs, presetId]
        const updated = { ...prev, favorites: next }
        writeJSON(STORAGE_KEYS.preferences, updated)
        return updated
      })
    },
    [],
  )

  const isFavorite = useCallback(
    (presetId: string): boolean => preferences.favorites.includes(presetId),
    [preferences],
  )

  const updatePreferences = useCallback(
    (partial: Partial<UserPreferences>): void => {
      setPreferences((prev) => {
        const updated = { ...prev, ...partial }
        writeJSON(STORAGE_KEYS.preferences, updated)
        return updated
      })
    },
    [],
  )

  const startJourney = useCallback(
    (journeyId: string): void => {
      setJourneyProgress((prev) => {
        const existing = prev.find((j) => j.journeyId === journeyId)
        if (existing) return prev // Already started

        const progress: JourneyProgress = {
          journeyId,
          completedDays: [],
          startedAt: new Date().toISOString(),
          lastCompletedAt: null,
        }
        const updated = [...prev, progress]
        writeJSON(STORAGE_KEYS.journeys, updated)
        return updated
      })
    },
    [],
  )

  const completeJourneyDay = useCallback(
    (journeyId: string, day: number): void => {
      setJourneyProgress((prev) => {
        const updated = prev.map((j) => {
          if (j.journeyId !== journeyId) return j
          if (j.completedDays.includes(day)) return j
          return {
            ...j,
            completedDays: [...j.completedDays, day],
            lastCompletedAt: new Date().toISOString(),
          }
        })
        writeJSON(STORAGE_KEYS.journeys, updated)
        return updated
      })
    },
    [],
  )

  const resetJourney = useCallback(
    (journeyId: string): void => {
      setJourneyProgress((prev) => {
        const updated = prev.filter((j) => j.journeyId !== journeyId)
        writeJSON(STORAGE_KEYS.journeys, updated)
        return updated
      })
    },
    [],
  )

  const getJourneyProgress = useCallback(
    (journeyId: string): JourneyProgress | undefined => {
      return journeyProgress.find((j) => j.journeyId === journeyId)
    },
    [journeyProgress],
  )

  return {
    sessions,
    stats,
    preferences,
    journeyProgress,
    addSession,
    updateSessionMood,
    toggleFavorite,
    isFavorite,
    updatePreferences,
    startJourney,
    completeJourneyDay,
    resetJourney,
    getJourneyProgress,
  }
}
