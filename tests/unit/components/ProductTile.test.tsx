import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductTile } from '@/components/dashboard/ProductTile'
import type { EnrichedProduct } from '@/types/product'

const mockProduct: EnrichedProduct = {
  id: 'prod-1',
  name: 'Full Cream Milk 2L',
  imageUrl: null,
  store: 'COLES',
  colesProductId: null,
  igaProductId: null,
  repurchaseIntervalDays: 7,
  lastPurchasedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  priorityScore: 0,
  isOverdue: false,
  isNew: true,
  daysSinceLastPurchase: null,
}

describe('ProductTile', () => {
  it('renders the product name', () => {
    render(<ProductTile product={mockProduct} />)
    expect(screen.getByText('Full Cream Milk 2L')).toBeInTheDocument()
  })

  it('renders a purchase button', () => {
    render(<ProductTile product={mockProduct} />)
    expect(screen.getByTestId('purchase-btn-prod-1')).toBeInTheDocument()
  })

  it('renders "New" badge for a new product', () => {
    render(<ProductTile product={mockProduct} />)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('renders "Overdue" badge for an overdue product', () => {
    const overdue: EnrichedProduct = {
      ...mockProduct,
      isNew: false,
      isOverdue: true,
      priorityScore: 1.5,
      daysSinceLastPurchase: 10,
    }
    render(<ProductTile product={overdue} />)
    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })

  it('renders a fallback icon when imageUrl is null', () => {
    render(<ProductTile product={mockProduct} />)
    expect(screen.getByText('🛒')).toBeInTheDocument()
  })

  it('calls onPurchased when purchase button succeeds', async () => {
    const onPurchased = vi.fn()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    })
    const { getByTestId } = render(<ProductTile product={mockProduct} onPurchased={onPurchased} />)
    await userEvent.click(getByTestId('purchase-btn-prod-1'))
    expect(onPurchased).toHaveBeenCalled()
  })
})
