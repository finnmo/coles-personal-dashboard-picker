// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWakeLock } from '@/hooks/useWakeLock'

function makeMockLock() {
  return { release: vi.fn().mockResolvedValue(undefined) }
}

// Flush all pending promises/microtasks
const flush = () => new Promise<void>((r) => setTimeout(r, 0))

describe('useWakeLock', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      wakeLock: { request: vi.fn() },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('requests a screen wake lock on mount', async () => {
    const lock = makeMockLock()
    vi.mocked(navigator.wakeLock.request).mockResolvedValue(lock as unknown as WakeLockSentinel)
    renderHook(() => useWakeLock())
    await vi.waitFor(() => {
      expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen')
    })
  })

  it('releases the lock on unmount', async () => {
    const lock = makeMockLock()
    vi.mocked(navigator.wakeLock.request).mockResolvedValue(lock as unknown as WakeLockSentinel)
    const { unmount } = renderHook(() => useWakeLock())
    // Wait for acquire() to fully resolve and assign lock
    await flush()
    unmount()
    await flush()
    expect(lock.release).toHaveBeenCalled()
  })

  it('re-acquires the lock when the page becomes visible again', async () => {
    const lock = makeMockLock()
    vi.mocked(navigator.wakeLock.request).mockResolvedValue(lock as unknown as WakeLockSentinel)
    renderHook(() => useWakeLock())
    await flush()
    expect(navigator.wakeLock.request).toHaveBeenCalledTimes(1)

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    await flush()
    expect(navigator.wakeLock.request).toHaveBeenCalledTimes(2)
  })

  it('does not throw when wakeLock is not supported', () => {
    vi.stubGlobal('navigator', {})
    expect(() => renderHook(() => useWakeLock())).not.toThrow()
  })

  it('silently ignores acquisition errors', async () => {
    vi.mocked(navigator.wakeLock.request).mockRejectedValue(new Error('denied'))
    expect(() => renderHook(() => useWakeLock())).not.toThrow()
    await flush() // let the rejected promise settle without unhandled rejection
  })
})
