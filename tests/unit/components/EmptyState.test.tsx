import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/dashboard/EmptyState'

describe('EmptyState', () => {
  it('renders the store name in the heading', () => {
    render(<EmptyState store="Coles" />)
    expect(screen.getByText(/No Coles products yet/i)).toBeInTheDocument()
  })

  it('renders a link to the admin panel', () => {
    render(<EmptyState store="IGA" />)
    expect(screen.getByText(/admin panel/i)).toBeInTheDocument()
  })
})
