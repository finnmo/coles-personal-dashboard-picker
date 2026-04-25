import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/dashboard/EmptyState'

describe('EmptyState', () => {
  it('renders the no products heading', () => {
    render(<EmptyState />)
    expect(screen.getByText(/No products yet/i)).toBeInTheDocument()
  })

  it('renders a reference to the admin panel', () => {
    render(<EmptyState />)
    expect(screen.getByText(/admin panel/i)).toBeInTheDocument()
  })
})
