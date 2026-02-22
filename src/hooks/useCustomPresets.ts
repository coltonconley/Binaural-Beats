import { useState, useCallback } from 'react'
import type { SessionPreset } from '../types'

const STORAGE_KEY = 'bb_custom_presets'
const MAX_CUSTOM_PRESETS = 50

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

export function useCustomPresets() {
  const [customPresets, setCustomPresets] = useState<SessionPreset[]>(() =>
    readJSON(STORAGE_KEY, []),
  )

  const savePreset = useCallback((preset: SessionPreset): void => {
    setCustomPresets((prev) => {
      const idx = prev.findIndex((p) => p.id === preset.id)
      let updated: SessionPreset[]
      if (idx >= 0) {
        // Update existing
        updated = prev.map((p) => (p.id === preset.id ? preset : p))
      } else {
        // Add new (enforce max)
        updated = [preset, ...prev].slice(0, MAX_CUSTOM_PRESETS)
      }
      writeJSON(STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const deletePreset = useCallback((id: string): void => {
    setCustomPresets((prev) => {
      const updated = prev.filter((p) => p.id !== id)
      writeJSON(STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const duplicatePreset = useCallback((id: string): void => {
    setCustomPresets((prev) => {
      const source = prev.find((p) => p.id === id)
      if (!source) return prev
      const copy: SessionPreset = {
        ...source,
        id: `custom_${crypto.randomUUID()}`,
        name: `${source.name} (Copy)`,
      }
      const updated = [copy, ...prev].slice(0, MAX_CUSTOM_PRESETS)
      writeJSON(STORAGE_KEY, updated)
      return updated
    })
  }, [])

  return { customPresets, savePreset, deletePreset, duplicatePreset }
}
