import { useRef, useCallback, useEffect } from 'react'

export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  const request = useCallback(async () => {
    if (!('wakeLock' in navigator)) return
    try {
      sentinelRef.current = await navigator.wakeLock.request('screen')
    } catch {
      // Wake lock request failed — silent no-op
    }
  }, [])

  const release = useCallback(async () => {
    try {
      await sentinelRef.current?.release()
    } catch {
      // Already released
    }
    sentinelRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      sentinelRef.current?.release().catch(() => {})
    }
  }, [])

  return { request, release }
}
