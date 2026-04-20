// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { searchProducts, ColesApiError } from '@/lib/coles-api'

const MOCK_PRODUCT = {
  id: '123',
  name: 'Full Cream Milk 2L',
  brand: 'Coles',
  size: '2L',
  imageUris: [{ type: 'product-image-large', uri: 'https://cdn.coles.com.au/milk.jpg' }],
  pricing: { now: 2.8 },
}

const server = setupServer()

beforeAll(() => {
  process.env.COLES_API_BASE_URL = 'http://mock-coles.test'
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => server.resetHandlers())

afterAll(() => {
  server.close()
  delete process.env.COLES_API_BASE_URL
})

describe('searchProducts', () => {
  it('returns normalized results on a 200 response', async () => {
    server.use(
      http.get('http://mock-coles.test/api/2.0/page/products/search', () =>
        HttpResponse.json({ results: [MOCK_PRODUCT] })
      )
    )
    const results = await searchProducts('milk')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      colesProductId: '123',
      name: 'Full Cream Milk 2L',
      brand: 'Coles',
      packageSize: '2L',
      price: 2.8,
      imageUrl: 'https://cdn.coles.com.au/milk.jpg',
    })
  })

  it('handles results under a "products" key', async () => {
    server.use(
      http.get('http://mock-coles.test/api/2.0/page/products/search', () =>
        HttpResponse.json({ products: [MOCK_PRODUCT] })
      )
    )
    const results = await searchProducts('milk')
    expect(results).toHaveLength(1)
  })

  it('returns empty array when results key is missing', async () => {
    server.use(
      http.get('http://mock-coles.test/api/2.0/page/products/search', () =>
        HttpResponse.json({ page: 1 })
      )
    )
    const results = await searchProducts('milk')
    expect(results).toHaveLength(0)
  })

  it('throws ColesApiError with status 429 on rate limit', async () => {
    server.use(
      http.get(
        'http://mock-coles.test/api/2.0/page/products/search',
        () => new HttpResponse(null, { status: 429 })
      )
    )
    await expect(searchProducts('milk')).rejects.toThrow(ColesApiError)
    await expect(searchProducts('milk')).rejects.toMatchObject({ status: 429 })
  })

  it('throws ColesApiError on non-JSON response', async () => {
    server.use(
      http.get(
        'http://mock-coles.test/api/2.0/page/products/search',
        () =>
          new HttpResponse('not json', { status: 200, headers: { 'Content-Type': 'text/plain' } })
      )
    )
    await expect(searchProducts('milk')).rejects.toThrow(ColesApiError)
  })

  it('filters out results missing id or name', async () => {
    server.use(
      http.get('http://mock-coles.test/api/2.0/page/products/search', () =>
        HttpResponse.json({ results: [MOCK_PRODUCT, { id: '', name: '' }] })
      )
    )
    const results = await searchProducts('milk')
    expect(results).toHaveLength(1)
  })

  it('normalises missing optional fields to null', async () => {
    const minimal = { id: '99', name: 'Bread' }
    server.use(
      http.get('http://mock-coles.test/api/2.0/page/products/search', () =>
        HttpResponse.json({ results: [minimal] })
      )
    )
    const results = await searchProducts('bread')
    expect(results[0].brand).toBeNull()
    expect(results[0].packageSize).toBeNull()
    expect(results[0].price).toBeNull()
    expect(results[0].imageUrl).toBe('')
  })
})
