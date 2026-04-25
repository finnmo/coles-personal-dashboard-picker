'use client'

import { useIdleTimer } from '@/hooks/useIdleTimer'

export function IdleDimOverlay() {
  const { isIdle, reset } = useIdleTimer()

  if (!isIdle) return null

  return (
    <div
      data-testid="idle-dim-overlay"
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm transition-opacity duration-700"
      onPointerDown={reset}
      aria-hidden
    />
  )
}
