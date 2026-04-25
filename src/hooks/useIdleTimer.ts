import { useEffect, useCallback, useRef, useState } from 'react'

const IDLE_MS = 5 * 60 * 1000 // 5 minutes

export function useIdleTimer() {
  const [isIdle, setIsIdle] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = useCallback(() => {
    setIsIdle(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setIsIdle(true), IDLE_MS)
  }, [])

  useEffect(() => {
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll']
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [reset])

  return { isIdle, reset }
}
