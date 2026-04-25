import { useEffect } from 'react'

export function useWakeLock() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return

    let lock: WakeLockSentinel | null = null

    async function acquire() {
      try {
        lock = await navigator.wakeLock.request('screen')
      } catch {
        // Battery too low, permission denied, or not supported — fail silently
      }
    }

    async function handleVisibilityChange() {
      if (document.visibilityState === 'visible') await acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      lock?.release()?.catch(() => {})
    }
  }, [])
}
