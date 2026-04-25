// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
  searchWoolworthsProducts,
  woolworthsImageUrl,
  WoolworthsApiError,
} from '@/lib/woolworths-api'

const RAPIDAPI_URL = 'https://woolworths-products-api.p.rapidapi.com/woolworths/product-search/'

const MOCK_RESULT = {
  url: '/shop/productdetails/123456/woolworths-full-cream-milk-2l',
  product_name: 'Full Cream Milk 2L',
  product_brand: 'Woolworths',
  product_size: '2L',
  current_price: 2.75,
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

describe('woolworthsImageUrl', () => {
  it('constructs CDN URL from stockcode', () => {
    expect(woolworthsImageUrl('123456')).toBe(
      'https://cdn0.woolworths.media/content/wowproductimages/large/123456.jpg'
    )
  })
})

describe('searchWoolworthsProducts', () => {
  it('returns normalized StoreSearchResult on 200', async () => {
    server.use(http.get(RAPIDAPI_URL, () => HttpResponse.json({ results: [MOCK_RESULT] })))
    const results = await searchWoolworthsProducts('milk')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      externalId: 'woolworths:123456',
      store: 'woolworths',
      name: 'Full Cream Milk 2L',
      brand: 'Woolworths',
      quantity: '2L',
      price: 2.75,
      imageUrl: 'https://cdn0.woolworths.media/content/wowproductimages/large/123456.jpg',
    })
  })

  it('returns empty array when results key is missing', async () => {
    server.use(http.get(RAPIDAPI_URL, () => HttpResponse.json({ page: 1 })))
    const results = await searchWoolworthsProducts('milk')
    expect(results).toHaveLength(0)
  })

  it('filters out results with no extractable stockcode', async () => {
    const noId = { ...MOCK_RESULT, url: '/shop/browse/dairy' }
    server.use(http.get(RAPIDAPI_URL, () => HttpResponse.json({ results: [MOCK_RESULT, noId] })))
    const results = await searchWoolworthsProducts('milk')
    expect(results).toHaveLength(1)
  })

  it('normalises missing optional fields to null', async () => {
    const minimal = {
      url: '/shop/productdetails/99/bread',
      product_name: 'Bread',
      product_brand: null,
      product_size: null,
      current_price: null,
    }
    server.use(http.get(RAPIDAPI_URL, () => HttpResponse.json({ results: [minimal] })))
    const results = await searchWoolworthsProducts('bread')
    expect(results[0].brand).toBeNull()
    expect(results[0].quantity).toBeNull()
    expect(results[0].price).toBeNull()
  })

  it('returns empty array when RAPIDAPI_KEY is not set', async () => {
    delete process.env.RAPIDAPI_KEY
    const results = await searchWoolworthsProducts('milk')
    expect(results).toHaveLength(0)
    process.env.RAPIDAPI_KEY = 'test-key'
  })

  it('throws WoolworthsApiError on non-200 response', async () => {
    server.use(http.get(RAPIDAPI_URL, () => new HttpResponse(null, { status: 429 })))
    await expect(searchWoolworthsProducts('milk')).rejects.toThrow(WoolworthsApiError)
    await expect(searchWoolworthsProducts('milk')).rejects.toMatchObject({ status: 429 })
  })

  it('throws WoolworthsApiError on non-JSON response', async () => {
    server.use(
      http.get(
        RAPIDAPI_URL,
        () =>
          new HttpResponse('not json', { status: 200, headers: { 'Content-Type': 'text/plain' } })
      )
    )
    await expect(searchWoolworthsProducts('milk')).rejects.toThrow(WoolworthsApiError)
  })
})
