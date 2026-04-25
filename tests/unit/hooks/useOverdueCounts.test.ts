// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { SWRConfig } from 'swr'
import React from 'react'
import { useOverdueCounts } from '@/hooks/useOverdueCounts'

const server = setupServer(
  http.get('/api/products', ({ request }) => {
    const store = new URL(request.url).searchParams.get('store')
    if (store === 'COLES') {
      return HttpResponse.json({
        products: [
          { id: '1', isOverdue: true },
          { id: '2', isOverdue: true },
          { id: '3', isOverdue: false },
        ],
      })
    }
    return HttpResponse.json({ products: [{ id: '4', isOverdue: true }] })
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Fresh SWR cache per test — prevents cross-test cache bleed
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(SWRConfig, { value: { provider: () => new Map() } }, children)

describe('useOverdueCounts', () => {
  it('returns overdue counts per store', async () => {
    const { result } = renderHook(() => useOverdueCounts(), { wrapper })
    await waitFor(() => {
      expect(result.current.COLES).toBe(2)
      expect(result.current.IGA).toBe(1)
    })
  })

  it('returns 0 when no products are overdue', async () => {
    server.use(
      http.get('/api/products', () =>
        HttpResponse.json({ products: [{ id: '1', isOverdue: false }] })
      )
    )
    const { result } = renderHook(() => useOverdueCounts(), { wrapper })
    await waitFor(() => {
      expect(result.current.COLES).toBe(0)
      expect(result.current.IGA).toBe(0)
    })
  })

  it('returns 0 while data is loading', () => {
    const { result } = renderHook(() => useOverdueCounts(), { wrapper })
    expect(result.current.COLES).toBe(0)
    expect(result.current.IGA).toBe(0)
  })
})
