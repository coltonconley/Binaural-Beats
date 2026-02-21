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

      const updated = [complete, ...sessions].slice(0, MAX_SESSIONS)
      setSessions(updated)
      writeJSON(STORAGE_KEYS.sessions, updated)

      const streakUpdate = computeStreakUpdate(stats)
      const newStats: UserStats = {
        totalSessions: stats.totalSessions + 1,
        totalMinutes: stats.totalMinutes + Math.round(session.durationSeconds / 60),
        ...streakUpdate,
      }
      setStats(newStats)
      writeJSON(STORAGE_KEYS.stats, newStats)

      return complete
    },
    [sessions, stats],
  )

  const updateSessionMood = useCallback(
    (sessionId: string, mood: MoodRating): void => {
      const updated = sessions.map((s) =>
        s.id === sessionId ? { ...s, mood } : s,
      )
      setSessions(updated)
      writeJSON(STORAGE_KEYS.sessions, updated)
    },
    [sessions],
  )

  const toggleFavorite = useCallback(
    (presetId: string): void => {
      const favs = preferences.favorites
      const next = favs.includes(presetId)
        ? favs.filter((id) => id !== presetId)
        : [...favs, presetId]
      const updated = { ...preferences, favorites: next }
      setPreferences(updated)
      writeJSON(STORAGE_KEYS.preferences, updated)
    },
    [preferences],
  )

  const isFavorite = useCallback(
    (presetId: string): boolean => preferences.favorites.includes(presetId),
    [preferences],
  )

  const updatePreferences = useCallback(
    (partial: Partial<UserPreferences>): void => {
      const updated = { ...preferences, ...partial }
      setPreferences(updated)
      writeJSON(STORAGE_KEYS.preferences, updated)
    },
    [preferences],
  )

  const startJourney = useCallback(
    (journeyId: string): void => {
      const existing = journeyProgress.find((j) => j.journeyId === journeyId)
      if (existing) return // Already started

      const progress: JourneyProgress = {
        journeyId,
        completedDays: [],
        startedAt: new Date().toISOString(),
        lastCompletedAt: null,
      }
      const updated = [...journeyProgress, progress]
      setJourneyProgress(updated)
      writeJSON(STORAGE_KEYS.journeys, updated)
    },
    [journeyProgress],
  )

  const completeJourneyDay = useCallback(
    (journeyId: string, day: number): void => {
      const updated = journeyProgress.map((j) => {
        if (j.journeyId !== journeyId) return j
        if (j.completedDays.includes(day)) return j
        return {
          ...j,
          completedDays: [...j.completedDays, day],
          lastCompletedAt: new Date().toISOString(),
        }
      })
      setJourneyProgress(updated)
      writeJSON(STORAGE_KEYS.journeys, updated)
    },
    [journeyProgress],
  )

  const resetJourney = useCallback(
    (journeyId: string): void => {
      const updated = journeyProgress.filter((j) => j.journeyId !== journeyId)
      setJourneyProgress(updated)
      writeJSON(STORAGE_KEYS.journeys, updated)
    },
    [journeyProgress],
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
