// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { searchIgaProducts, IgaApiError } from '@/lib/iga-api'

const IGA_URL = 'https://www.igashop.com.au/sm/planning/rsid/3541/results'

function makeHtml(products: unknown[]) {
  const data = {
    props: {
      pageProps: {
        initialData: {
          searchData: {
            productData: { results: products },
          },
        },
      },
    },
  }
  return `<html><head><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script></head></html>`
}

const MOCK_PRODUCT = {
  stockCode: 'iga-001',
  name: 'Full Cream Milk 2L',
  imageURL: 'https://cdn.iga.com.au/milk.jpg',
  brand: 'IGA',
  packageSize: '2L',
  price: 2.9,
}

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('searchIgaProducts', () => {
  it('returns normalized StoreSearchResult on a successful response', async () => {
    server.use(http.get(IGA_URL, () => HttpResponse.text(makeHtml([MOCK_PRODUCT]))))
    const results = await searchIgaProducts('milk')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      externalId: 'iga:iga-001',
      store: 'iga',
      name: 'Full Cream Milk 2L',
      imageUrl: 'https://cdn.iga.com.au/milk.jpg',
      brand: 'IGA',
      quantity: '2L',
      price: 2.9,
    })
  })

  it('returns [] when __NEXT_DATA__ is absent', async () => {
    server.use(http.get(IGA_URL, () => HttpResponse.text('<html>no data</html>')))
    const results = await searchIgaProducts('milk')
    expect(results).toEqual([])
  })

  it('returns [] on malformed JSON', async () => {
    server.use(
      http.get(IGA_URL, () =>
        HttpResponse.text('<script id="__NEXT_DATA__" type="application/json">{bad}</script>')
      )
    )
    const results = await searchIgaProducts('milk')
    expect(results).toEqual([])
  })

  it('returns [] when products path is missing', async () => {
    server.use(
      http.get(IGA_URL, () =>
        HttpResponse.text(
          `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: {} })}</script>`
        )
      )
    )
    const results = await searchIgaProducts('milk')
    expect(results).toEqual([])
  })

  it('filters out entries with no stockCode', async () => {
    const noCode = { ...MOCK_PRODUCT, stockCode: undefined, id: undefined }
    server.use(http.get(IGA_URL, () => HttpResponse.text(makeHtml([MOCK_PRODUCT, noCode]))))
    const results = await searchIgaProducts('milk')
    expect(results).toHaveLength(1)
  })

  it('throws IgaApiError on non-200 response', async () => {
    server.use(http.get(IGA_URL, () => new HttpResponse(null, { status: 503 })))
    await expect(searchIgaProducts('milk')).rejects.toThrow(IgaApiError)
  })

  it('throws IgaApiError on network failure', async () => {
    server.use(http.get(IGA_URL, () => HttpResponse.error()))
    await expect(searchIgaProducts('milk')).rejects.toThrow(IgaApiError)
  })
})
