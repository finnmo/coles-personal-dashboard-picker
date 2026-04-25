// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { searchProducts, ColesApiError } from '@/lib/coles-api'

const RAPIDAPI_URL = 'https://coles-product-price-api.p.rapidapi.com/coles/product-search/'

const MOCK_RESULT = {
  url: '/product/4182384',
  product_name: 'Full Cream Milk 2L',
  product_brand: 'Coles Brand',
  product_size: '2L',
  current_price: 2.8,
}

const server = setupServer()

beforeAll(() => {
  process.env.RAPIDAPI_KEY = 'test-key'
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => server.resetHandlers())

afterAll(() => {
  server.close()
  delete process.env.RAPIDAPI_KEY
})

describe('searchProducts', () => {
  it('returns normalized results on a 200 response', async () => {
    server.use(http.get(RAPIDAPI_URL, () => HttpResponse.json({ results: [MOCK_RESULT] })))
    const results = await searchProducts('milk')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      colesProductId: '4182384',
      name: 'Full Cream Milk 2L',
      brand: 'Coles Brand',
      packageSize: '2L',
      price: 2.8,
      imageUrl: '',
    })
  })

  it('returns empty array when results key is missing', async () => {
    server.use(http.get(RAPIDAPI_URL, () => HttpResponse.json({ page: 1 })))
    const results = await searchProducts('milk')
    expect(results).toHaveLength(0)
  })

  it('throws ColesApiError with status 429 on rate limit', async () => {
    server.use(http.get(RAPIDAPI_URL, () => new HttpResponse(null, { status: 429 })))
    await expect(searchProducts('milk')).rejects.toThrow(ColesApiError)
    await expect(searchProducts('milk')).rejects.toMatchObject({ status: 429 })
  })

  it('throws ColesApiError on non-JSON response', async () => {
    server.use(
      http.get(
        RAPIDAPI_URL,
        () =>
          new HttpResponse('not json', { status: 200, headers: { 'Content-Type': 'text/plain' } })
      )
    )
    await expect(searchProducts('milk')).rejects.toThrow(ColesApiError)
  })

  it('filters out results missing id or name', async () => {
    const noUrl = {
      url: '',
      product_name: 'Bad',
      product_brand: null,
      product_size: null,
      current_price: null,
    }
    server.use(http.get(RAPIDAPI_URL, () => HttpResponse.json({ results: [MOCK_RESULT, noUrl] })))
    const results = await searchProducts('milk')
    expect(results).toHaveLength(1)
  })

  it('normalises missing optional fields to null', async () => {
    const minimal = {
      url: '/product/99',
      product_name: 'Bread',
      product_brand: null,
      product_size: null,
      current_price: null,
    }
    server.use(http.get(RAPIDAPI_URL, () => HttpResponse.json({ results: [minimal] })))
    const results = await searchProducts('bread')
    expect(results[0].brand).toBeNull()
    expect(results[0].packageSize).toBeNull()
    expect(results[0].price).toBeNull()
    expect(results[0].imageUrl).toBe('')
  })

  it('throws ColesApiError when RAPIDAPI_KEY is not set', async () => {
    delete process.env.RAPIDAPI_KEY
    await expect(searchProducts('milk')).rejects.toThrow(ColesApiError)
    process.env.RAPIDAPI_KEY = 'test-key'
  })
})
