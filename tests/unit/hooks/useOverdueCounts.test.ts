// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { SWRConfig } from 'swr'
import React from 'react'
import { useOverdueCounts } from '@/hooks/useOverdueCounts'

const server = setupServer(
  http.get('/api/products', () =>
    HttpResponse.json({
      products: [
        { id: '1', isOverdue: true },
        { id: '2', isOverdue: true },
        { id: '3', isOverdue: false },
      ],
    })
  )
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Fresh SWR cache per test — prevents cross-test cache bleed
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(SWRConfig, { value: { provider: () => new Map() } }, children)

describe('useOverdueCounts', () => {
  it('returns total overdue count', async () => {
    const { result } = renderHook(() => useOverdueCounts(), { wrapper })
    await waitFor(() => {
      expect(result.current.total).toBe(2)
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
      expect(result.current.total).toBe(0)
    })
  })

  it('returns 0 while data is loading', () => {
    const { result } = renderHook(() => useOverdueCounts(), { wrapper })
    expect(result.current.total).toBe(0)
  })
})
