// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { IdleDimOverlay } from '@/components/dashboard/IdleDimOverlay'

describe('IdleDimOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing while the user is active', () => {
    render(<IdleDimOverlay />)
    expect(screen.queryByTestId('idle-dim-overlay')).toBeNull()
  })

  it('renders the dim overlay after 5 minutes of inactivity', () => {
    render(<IdleDimOverlay />)
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000)
    })
    expect(screen.getByTestId('idle-dim-overlay')).toBeInTheDocument()
  })

  it('does not show the overlay before 5 minutes', () => {
    render(<IdleDimOverlay />)
    act(() => {
      vi.advanceTimersByTime(4 * 60 * 1000 + 59000)
    })
    expect(screen.queryByTestId('idle-dim-overlay')).toBeNull()
  })

  it('dismisses the overlay on pointer interaction', () => {
    render(<IdleDimOverlay />)
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000)
    })
    const overlay = screen.getByTestId('idle-dim-overlay')
    act(() => {
      fireEvent.pointerDown(overlay)
    })
    expect(screen.queryByTestId('idle-dim-overlay')).toBeNull()
  })

  it('resets idle timer when user interacts before becoming idle', () => {
    render(<IdleDimOverlay />)
    act(() => {
      vi.advanceTimersByTime(4 * 60 * 1000)
    })
    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })
    act(() => {
      vi.advanceTimersByTime(4 * 60 * 1000)
    })
    expect(screen.queryByTestId('idle-dim-overlay')).toBeNull()
  })
})
