import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SWRConfig } from 'swr'
import React from 'react'
import { PurchaseHistory } from '@/components/admin/PurchaseHistory'

describe('PurchaseHistory', () => {
  it('shows loading skeleton while fetching', () => {
    // Provide a fetcher that never resolves so SWR stays in loading state
    render(
      React.createElement(
        SWRConfig,
        { value: { provider: () => new Map(), fetcher: () => new Promise(() => {}) } },
        React.createElement(PurchaseHistory, { productId: 'p1' })
      )
    )
    expect(screen.getByTestId('history-skeleton')).toBeInTheDocument()
  })

  it('renders purchase dates from fallback data', async () => {
    render(
      React.createElement(
        SWRConfig,
        {
          value: {
            provider: () => new Map(),
            fallback: {
              '/api/products/p1/history': {
                history: [
                  { id: 'e1', purchasedAt: '2024-01-15T10:00:00.000Z' },
                  { id: 'e2', purchasedAt: '2024-01-08T10:00:00.000Z' },
                ],
              },
            },
          },
        },
        React.createElement(PurchaseHistory, { productId: 'p1' })
      )
    )
    const items = await screen.findAllByRole('listitem')
    expect(items).toHaveLength(2)
  })

  it('shows empty state when history is empty', async () => {
    render(
      React.createElement(
        SWRConfig,
        {
          value: {
            provider: () => new Map(),
            fallback: { '/api/products/p1/history': { history: [] } },
          },
        },
        React.createElement(PurchaseHistory, { productId: 'p1' })
      )
    )
    await screen.findByText('No purchase history')
  })
})
