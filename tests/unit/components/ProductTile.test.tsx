import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductTile } from '@/components/dashboard/ProductTile'
import type { EnrichedProduct } from '@/types/product'

const base: EnrichedProduct = {
  id: 'prod-1',
  name: 'Full Cream Milk 2L',
  imageUrl: null,
  offProductId: '9300617105028',
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
    render(<ProductTile product={base} />)
    expect(screen.getByText('Full Cream Milk 2L')).toBeInTheDocument()
  })

  it('renders as a tappable tile', () => {
    render(<ProductTile product={base} />)
    expect(screen.getByTestId('product-tile-prod-1')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders "New" badge for a new product', () => {
    render(<ProductTile product={base} />)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('renders "Overdue" badge for an overdue product', () => {
    render(
      <ProductTile
        product={{
          ...base,
          isNew: false,
          isOverdue: true,
          priorityScore: 1.5,
          daysSinceLastPurchase: 10,
        }}
      />
    )
    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })

  it('renders a fallback icon when imageUrl is null', () => {
    render(<ProductTile product={base} />)
    expect(screen.getByText('🛒')).toBeInTheDocument()
  })

  it('calls onPurchased when tile is tapped', async () => {
    const onPurchased = vi.fn()
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) })
    render(<ProductTile product={base} onPurchased={onPurchased} />)
    await userEvent.click(screen.getByTestId('product-tile-prod-1'))
    expect(onPurchased).toHaveBeenCalled()
  })

  describe('last bought text', () => {
    it('shows "Never bought" for a new product', () => {
      render(<ProductTile product={base} />)
      expect(screen.getByText('Never bought')).toBeInTheDocument()
    })

    it('shows "Bought today" when daysSinceLastPurchase is 0', () => {
      render(<ProductTile product={{ ...base, isNew: false, daysSinceLastPurchase: 0 }} />)
      expect(screen.getByText('Bought today')).toBeInTheDocument()
    })

    it('shows "Bought yesterday" when daysSinceLastPurchase is 1', () => {
      render(<ProductTile product={{ ...base, isNew: false, daysSinceLastPurchase: 1 }} />)
      expect(screen.getByText('Bought yesterday')).toBeInTheDocument()
    })

    it('shows "Xd ago" for older purchases', () => {
      render(<ProductTile product={{ ...base, isNew: false, daysSinceLastPurchase: 5 }} />)
      expect(screen.getByText('5d ago')).toBeInTheDocument()
    })
  })
})
