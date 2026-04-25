// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIdleTimer } from '@/hooks/useIdleTimer'

describe('useIdleTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is not idle initially', () => {
    const { result } = renderHook(() => useIdleTimer())
    expect(result.current.isIdle).toBe(false)
  })

  it('becomes idle after 5 minutes of inactivity', () => {
    const { result } = renderHook(() => useIdleTimer())
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000)
    })
    expect(result.current.isIdle).toBe(true)
  })

  it('does not become idle before 5 minutes', () => {
    const { result } = renderHook(() => useIdleTimer())
    act(() => {
      vi.advanceTimersByTime(4 * 60 * 1000 + 59000)
    })
    expect(result.current.isIdle).toBe(false)
  })

  it('resets the idle timer on pointer activity', () => {
    const { result } = renderHook(() => useIdleTimer())
    act(() => {
      vi.advanceTimersByTime(4 * 60 * 1000)
    })
    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })
    act(() => {
      vi.advanceTimersByTime(4 * 60 * 1000)
    })
    expect(result.current.isIdle).toBe(false)
  })

  it('reset() clears idle state immediately', () => {
    const { result } = renderHook(() => useIdleTimer())
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000)
    })
    expect(result.current.isIdle).toBe(true)
    act(() => {
      result.current.reset()
    })
    expect(result.current.isIdle).toBe(false)
  })

  it('cleans up event listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useIdleTimer())
    unmount()
    expect(removeSpy).toHaveBeenCalled()
  })
})
