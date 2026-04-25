// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { searchColesProducts, colesImageUrl, ColesApiError } from '@/lib/coles-api'

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

describe('colesImageUrl', () => {
  it('constructs CDN URL from stockcode', () => {
    expect(colesImageUrl('4182384')).toBe(
      'https://cdn.productimages.coles.com.au/productimages/4/4182384.jpg'
    )
  })

  it('uses first digit as folder', () => {
    expect(colesImageUrl('9123456')).toContain('/productimages/9/')
  })
})

describe('searchColesProducts', () => {
  it('returns normalized StoreSearchResult on 200', async () => {
    server.use(http.get(RAPIDAPI_URL, () => HttpResponse.json({ results: [MOCK_RESULT] })))
    const results = await searchColesProducts('milk')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      externalId: 'coles:4182384',
      store: 'coles',
      name: 'Full Cream Milk 2L',
      brand: 'Coles Brand',
      quantity: '2L',
      price: 2.8,
      imageUrl: 'https://cdn.productimages.coles.com.au/productimages/4/4182384.jpg',
    })
  })

  it('returns empty array when results key is missing', async () => {
    server.use(http.get(RAPIDAPI_URL, () => HttpResponse.json({ page: 1 })))
    const results = await searchColesProducts('milk')
    expect(results).toHaveLength(0)
  })

  it('filters out results with no extractable stockcode', async () => {
    const noId = { ...MOCK_RESULT, url: '/category/dairy' }
    server.use(http.get(RAPIDAPI_URL, () => HttpResponse.json({ results: [MOCK_RESULT, noId] })))
    const results = await searchColesProducts('milk')
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
    const results = await searchColesProducts('bread')
    expect(results[0].brand).toBeNull()
    expect(results[0].quantity).toBeNull()
    expect(results[0].price).toBeNull()
  })

  it('returns empty array when RAPIDAPI_KEY is not set', async () => {
    delete process.env.RAPIDAPI_KEY
    const results = await searchColesProducts('milk')
    expect(results).toHaveLength(0)
    process.env.RAPIDAPI_KEY = 'test-key'
  })

  it('throws ColesApiError on non-200 response', async () => {
    server.use(http.get(RAPIDAPI_URL, () => new HttpResponse(null, { status: 429 })))
    await expect(searchColesProducts('milk')).rejects.toThrow(ColesApiError)
    await expect(searchColesProducts('milk')).rejects.toMatchObject({ status: 429 })
  })

  it('throws ColesApiError on non-JSON response', async () => {
    server.use(
      http.get(
        RAPIDAPI_URL,
        () =>
          new HttpResponse('not json', { status: 200, headers: { 'Content-Type': 'text/plain' } })
      )
    )
    await expect(searchColesProducts('milk')).rejects.toThrow(ColesApiError)
  })
})
