// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { searchProducts, OffApiError } from '@/lib/off-api'

const OFF_URL = 'https://search.openfoodfacts.org/search'

const MOCK_PRODUCT = {
  code: '9300617105028',
  product_name: 'Full Cream Milk 2L',
  brands: ['Pauls'],
  image_front_small_url: 'https://images.openfoodfacts.org/milk.small.jpg',
  image_front_url: 'https://images.openfoodfacts.org/milk.jpg',
  quantity: '2L',
}

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('searchProducts', () => {
  it('returns normalized results on a 200 response', async () => {
    server.use(http.get(OFF_URL, () => HttpResponse.json({ hits: [MOCK_PRODUCT] })))
    const results = await searchProducts('milk')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      offProductId: '9300617105028',
      name: 'Full Cream Milk 2L',
      brand: 'Pauls',
      quantity: '2L',
      imageUrl: 'https://images.openfoodfacts.org/milk.small.jpg',
    })
  })

  it('prefers image_front_small_url over image_front_url', async () => {
    server.use(http.get(OFF_URL, () => HttpResponse.json({ hits: [MOCK_PRODUCT] })))
    const results = await searchProducts('milk')
    expect(results[0].imageUrl).toBe('https://images.openfoodfacts.org/milk.small.jpg')
  })

  it('falls back to image_front_url when small is absent', async () => {
    const noSmall = { ...MOCK_PRODUCT, image_front_small_url: undefined }
    server.use(http.get(OFF_URL, () => HttpResponse.json({ hits: [noSmall] })))
    const results = await searchProducts('milk')
    expect(results[0].imageUrl).toBe('https://images.openfoodfacts.org/milk.jpg')
  })

  it('returns empty array when hits key is missing', async () => {
    server.use(http.get(OFF_URL, () => HttpResponse.json({ count: 0 })))
    const results = await searchProducts('milk')
    expect(results).toHaveLength(0)
  })

  it('filters out results missing code', async () => {
    const noCode = { ...MOCK_PRODUCT, code: '' }
    server.use(http.get(OFF_URL, () => HttpResponse.json({ hits: [MOCK_PRODUCT, noCode] })))
    const results = await searchProducts('milk')
    expect(results).toHaveLength(1)
  })

  it('filters out results missing product_name', async () => {
    const noName = { ...MOCK_PRODUCT, product_name: '' }
    server.use(http.get(OFF_URL, () => HttpResponse.json({ hits: [MOCK_PRODUCT, noName] })))
    const results = await searchProducts('milk')
    expect(results).toHaveLength(1)
  })

  it('normalises missing optional fields to null', async () => {
    const minimal = { code: '1234567890', product_name: 'Bread' }
    server.use(http.get(OFF_URL, () => HttpResponse.json({ hits: [minimal] })))
    const results = await searchProducts('bread')
    expect(results[0].brand).toBeNull()
    expect(results[0].quantity).toBeNull()
    expect(results[0].imageUrl).toBeNull()
  })

  it('handles brands as a string (legacy shape)', async () => {
    const stringBrands = { ...MOCK_PRODUCT, brands: 'Pauls' }
    server.use(http.get(OFF_URL, () => HttpResponse.json({ hits: [stringBrands] })))
    const results = await searchProducts('milk')
    expect(results[0].brand).toBe('Pauls')
  })

  it('handles brands as an array with multiple entries', async () => {
    const multiBrands = { ...MOCK_PRODUCT, brands: ['Pauls', 'Harvey Fresh'] }
    server.use(http.get(OFF_URL, () => HttpResponse.json({ hits: [multiBrands] })))
    const results = await searchProducts('milk')
    expect(results[0].brand).toBe('Pauls, Harvey Fresh')
  })

  it('retries once on 503 and succeeds', async () => {
    let calls = 0
    server.use(
      http.get(OFF_URL, () => {
        calls++
        if (calls === 1) return new HttpResponse(null, { status: 503 })
        return HttpResponse.json({ hits: [MOCK_PRODUCT] })
      })
    )
    const results = await searchProducts('milk')
    expect(calls).toBe(2)
    expect(results).toHaveLength(1)
  })

  it('throws OffApiError with status 429 on rate limit', async () => {
    server.use(http.get(OFF_URL, () => new HttpResponse(null, { status: 429 })))
    await expect(searchProducts('milk')).rejects.toThrow(OffApiError)
    await expect(searchProducts('milk')).rejects.toMatchObject({ status: 429 })
  })

  it('throws OffApiError on non-JSON response', async () => {
    server.use(
      http.get(
        OFF_URL,
        () =>
          new HttpResponse('not json', { status: 200, headers: { 'Content-Type': 'text/plain' } })
      )
    )
    await expect(searchProducts('milk')).rejects.toThrow(OffApiError)
  })
})
