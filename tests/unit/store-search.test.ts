// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchStores } from '@/lib/store-search'
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

vi.mock('@/lib/coles-api', () => ({ searchColesProducts: vi.fn() }))
vi.mock('@/lib/woolworths-api', () => ({ searchWoolworthsProducts: vi.fn() }))
vi.mock('@/lib/iga-api', () => ({ searchIgaProducts: vi.fn() }))

const { searchColesProducts } = await import('@/lib/coles-api')
const { searchWoolworthsProducts } = await import('@/lib/woolworths-api')
const { searchIgaProducts } = await import('@/lib/iga-api')

beforeEach(() => {
  vi.mocked(searchColesProducts).mockResolvedValue([COLES_RESULT])
  vi.mocked(searchWoolworthsProducts).mockResolvedValue([WOOLWORTHS_RESULT])
  vi.mocked(searchIgaProducts).mockResolvedValue([IGA_RESULT])
})

describe('searchStores', () => {
  it('returns results from all three stores merged in order', async () => {
    const results = await searchStores('milk')
    expect(results).toHaveLength(3)
    expect(results[0].store).toBe('coles')
    expect(results[1].store).toBe('woolworths')
    expect(results[2].store).toBe('iga')
  })

  it('continues when Coles throws — returns Woolworths + IGA results', async () => {
    vi.mocked(searchColesProducts).mockRejectedValue(new Error('Coles down'))
    const results = await searchStores('milk')
    expect(results).toHaveLength(2)
    expect(results.map((r) => r.store)).toEqual(['woolworths', 'iga'])
  })

  it('continues when Woolworths throws — returns Coles + IGA results', async () => {
    vi.mocked(searchWoolworthsProducts).mockRejectedValue(new Error('Woolworths down'))
    const results = await searchStores('milk')
    expect(results).toHaveLength(2)
    expect(results.map((r) => r.store)).toEqual(['coles', 'iga'])
  })

  it('continues when IGA throws — returns Coles + Woolworths results', async () => {
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
