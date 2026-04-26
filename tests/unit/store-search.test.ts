// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchStores, isRapidApiSuspended, _resetRapidApiSuspension } from '@/lib/store-search'
import { ColesApiError } from '@/lib/coles-api'
import { WoolworthsApiError } from '@/lib/woolworths-api'
import type { StoreSearchResult } from '@/lib/store-search'

const COLES_RESULT: StoreSearchResult = {
  externalId: 'coles:4182384',
  store: 'coles',
  name: 'Full Cream Milk 2L',
  imageUrl: 'https://cdn.productimages.coles.com.au/productimages/4/4182384.jpg',
  brand: 'Coles',
  quantity: '2L',
  price: 2.8,
}

const WOOLWORTHS_RESULT: StoreSearchResult = {
  externalId: 'woolworths:123456',
  store: 'woolworths',
  name: 'Full Cream Milk 2L',
  imageUrl: 'https://cdn0.woolworths.media/content/wowproductimages/large/123456.jpg',
  brand: 'Woolworths',
  quantity: '2L',
  price: 2.75,
}

const IGA_RESULT: StoreSearchResult = {
  externalId: 'iga:iga-001',
  store: 'iga',
  name: 'Full Cream Milk 2L',
  imageUrl: 'https://cdn.iga.com.au/milk.jpg',
  brand: 'IGA',
  quantity: '2L',
  price: 2.9,
}

vi.mock('@/lib/coles-api', () => ({
  searchColesProducts: vi.fn(),
  ColesApiError: class ColesApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.name = 'ColesApiError'
      this.status = status
    }
  },
}))
vi.mock('@/lib/woolworths-api', () => ({
  searchWoolworthsProducts: vi.fn(),
  WoolworthsApiError: class WoolworthsApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.name = 'WoolworthsApiError'
      this.status = status
    }
  },
}))
vi.mock('@/lib/iga-api', () => ({ searchIgaProducts: vi.fn() }))

const { searchColesProducts } = await import('@/lib/coles-api')
const { searchWoolworthsProducts } = await import('@/lib/woolworths-api')
const { searchIgaProducts } = await import('@/lib/iga-api')

beforeEach(() => {
  _resetRapidApiSuspension()
  vi.mocked(searchColesProducts).mockResolvedValue([COLES_RESULT])
  vi.mocked(searchWoolworthsProducts).mockResolvedValue([WOOLWORTHS_RESULT])
  vi.mocked(searchIgaProducts).mockResolvedValue([IGA_RESULT])
})

describe('searchStores — normal operation', () => {
  it('returns results from all three stores merged in order', async () => {
    const results = await searchStores('milk')
    expect(results).toHaveLength(3)
    expect(results[0].store).toBe('coles')
    expect(results[1].store).toBe('woolworths')
    expect(results[2].store).toBe('iga')
  })

  it('continues when Coles throws a non-429 error', async () => {
    vi.mocked(searchColesProducts).mockRejectedValue(new Error('Coles down'))
    const results = await searchStores('milk')
    expect(results).toHaveLength(2)
    expect(results.map((r) => r.store)).toEqual(['woolworths', 'iga'])
  })

  it('continues when Woolworths throws a non-429 error', async () => {
    vi.mocked(searchWoolworthsProducts).mockRejectedValue(new Error('Woolworths down'))
    const results = await searchStores('milk')
    expect(results).toHaveLength(2)
    expect(results.map((r) => r.store)).toEqual(['coles', 'iga'])
  })

  it('continues when IGA throws', async () => {
    vi.mocked(searchIgaProducts).mockRejectedValue(new Error('IGA down'))
    const results = await searchStores('milk')
    expect(results).toHaveLength(2)
    expect(results.map((r) => r.store)).toEqual(['coles', 'woolworths'])
  })

  it('returns empty array when all three stores fail', async () => {
    vi.mocked(searchColesProducts).mockRejectedValue(new Error('down'))
    vi.mocked(searchWoolworthsProducts).mockRejectedValue(new Error('down'))
    vi.mocked(searchIgaProducts).mockRejectedValue(new Error('down'))
    const results = await searchStores('milk')
    expect(results).toHaveLength(0)
  })

  it('passes the query to each store API', async () => {
    await searchStores('oat milk')
    expect(searchColesProducts).toHaveBeenCalledWith('oat milk')
    expect(searchWoolworthsProducts).toHaveBeenCalledWith('oat milk')
    expect(searchIgaProducts).toHaveBeenCalledWith('oat milk')
  })
})

describe('searchStores — RapidAPI circuit breaker', () => {
  it('trips breaker when Coles returns 429, falls back to IGA only', async () => {
    vi.mocked(searchColesProducts).mockRejectedValue(new ColesApiError('rate limited', 429))
    const results = await searchStores('milk')
    expect(isRapidApiSuspended()).toBe(true)
    // Woolworths was also skipped after breaker tripped by Coles
    expect(results.map((r) => r.store)).toEqual(['woolworths', 'iga'])
  })

  it('trips breaker when Woolworths returns 429, falls back to IGA only', async () => {
    vi.mocked(searchWoolworthsProducts).mockRejectedValue(
      new WoolworthsApiError('rate limited', 429)
    )
    const results = await searchStores('milk')
    expect(isRapidApiSuspended()).toBe(true)
    expect(results.map((r) => r.store)).toEqual(['coles', 'iga'])
  })

  it('skips Coles and Woolworths entirely when breaker is already tripped', async () => {
    // Trip the breaker via a 429
    vi.mocked(searchColesProducts).mockRejectedValue(new ColesApiError('rate limited', 429))
    await searchStores('first query')
    vi.mocked(searchColesProducts).mockReset()
    vi.mocked(searchWoolworthsProducts).mockReset()

    // Second search — RapidAPI calls should not be attempted at all
    const results = await searchStores('second query')
    expect(searchColesProducts).not.toHaveBeenCalled()
    expect(searchWoolworthsProducts).not.toHaveBeenCalled()
    expect(results.map((r) => r.store)).toEqual(['iga'])
  })

  it('IGA always runs even when RapidAPI is suspended', async () => {
    vi.mocked(searchColesProducts).mockRejectedValue(new ColesApiError('rate limited', 429))
    await searchStores('milk')
    expect(isRapidApiSuspended()).toBe(true)

    vi.mocked(searchColesProducts).mockReset()
    vi.mocked(searchWoolworthsProducts).mockReset()
    const results = await searchStores('bread')
    expect(searchIgaProducts).toHaveBeenCalledWith('bread')
    expect(results.some((r) => r.store === 'iga')).toBe(true)
  })
})
