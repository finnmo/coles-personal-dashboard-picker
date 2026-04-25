import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test explosion')
  return <div>Safe content</div>
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary fallback={<div>Error</div>}>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Safe content')).toBeInTheDocument()
  })

  it('renders fallback when child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary fallback={<div>Fallback shown</div>}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Fallback shown')).toBeInTheDocument()
    consoleSpy.mockRestore()
  })

  it('calls onError when child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = vi.fn()
    render(
      <ErrorBoundary fallback={<div>Error</div>} onError={onError}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(onError).toHaveBeenCalledOnce()
    consoleSpy.mockRestore()
  })

  it('reset clears error state (boundary re-renders children)', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let shouldThrow = true
    function ControlledBomb() {
      if (shouldThrow) throw new Error('explosion')
      return <div>Recovered</div>
    }
    render(
      <ErrorBoundary fallback={(_error, reset) => <button onClick={reset}>Reset</button>}>
        <ControlledBomb />
      </ErrorBoundary>
    )
    expect(screen.getByText('Reset')).toBeInTheDocument()
    shouldThrow = false
    fireEvent.click(screen.getByText('Reset'))
    expect(screen.getByText('Recovered')).toBeInTheDocument()
    consoleSpy.mockRestore()
  })
})
