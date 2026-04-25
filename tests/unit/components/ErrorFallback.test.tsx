import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorFallback } from '@/components/ui/ErrorFallback'

describe('ErrorFallback', () => {
  it('renders title and message', () => {
    render(<ErrorFallback title="Oops" message="Something went wrong" />)
    expect(screen.getByText('Oops')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('shows Try again button when onReset provided', () => {
    const onReset = vi.fn()
    render(<ErrorFallback onReset={onReset} />)
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })

  it('calls onReset when Try again is clicked', () => {
    const onReset = vi.fn()
    render(<ErrorFallback onReset={onReset} />)
    fireEvent.click(screen.getByText('Try again'))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('does not show Try again when onReset is absent', () => {
    render(<ErrorFallback />)
    expect(screen.queryByText('Try again')).not.toBeInTheDocument()
  })

  it('uses default title and message when not provided', () => {
    render(<ErrorFallback />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument()
  })
})
