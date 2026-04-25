// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
  fetchColesImage,
  extractImageFromHtml,
  namesOverlap,
  significantWords,
} from '@/lib/coles-image'

const COLES_SEARCH = 'https://www.coles.com.au/search'

function makeNextDataHtml(pageProps: unknown): string {
  return `<html><head><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps } })}</script></head><body></body></html>`
}

const MOCK_STOCKCODE = '5050551'
const MOCK_CDN_URL = `https://cdn.productimages.coles.com.au/productimages/5/${MOCK_STOCKCODE}.jpg`
const MOCK_IMAGE_URL = 'https://cdn.productimages.coles.com.au/productimages/5/5050551.jpg'

function makePageProps(name: string, extra: Record<string, unknown> = {}) {
  return {
    searchResults: {
      results: [{ name, stockcode: Number(MOCK_STOCKCODE), ...extra }],
    },
  }
}

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// significantWords
// ---------------------------------------------------------------------------
describe('significantWords', () => {
  it('lowercases and strips punctuation', () => {
    expect(significantWords("Pauls' Full Cream")).toEqual(new Set(['pauls', 'full', 'cream']))
  })

  it('removes stop words and pure numbers', () => {
    // '2l' is kept (mixed alphanumeric, not a stop word); pure '3' is dropped
    expect(significantWords('2L Oat Milk with a lid 3')).toEqual(
      new Set(['2l', 'oat', 'milk', 'lid'])
    )
  })

  it('removes single-character tokens and stop-word units', () => {
    // 'x' (length 1) and 'pack' (stop word) are dropped; '500g' is kept
    expect(significantWords('500g pack x 3')).toEqual(new Set(['500g']))
  })
})

// ---------------------------------------------------------------------------
// namesOverlap
// ---------------------------------------------------------------------------
describe('namesOverlap', () => {
  it('returns true when product names share a significant word', () => {
    expect(namesOverlap('Vitasoy Oat Milk 1L', 'Vitasoy Oat Milk Barista')).toBe(true)
  })

  it('returns true for partial brand match', () => {
    expect(namesOverlap('Vitasoy Oat Milk', 'Vitasoy UHT Soy')).toBe(true)
  })

  it('returns false for completely different products', () => {
    expect(namesOverlap('Vitasoy Oat Milk', 'Bref Brilliant Gel Toilet Cleaner')).toBe(false)
  })

  it('returns false when expected name has no words in common with candidate', () => {
    expect(namesOverlap('Full Cream Milk 2L', 'Chicken Breast Fillet')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// extractImageFromHtml
// ---------------------------------------------------------------------------
describe('extractImageFromHtml', () => {
  it('returns null for HTML without __NEXT_DATA__', () => {
    expect(extractImageFromHtml('<html></html>')).toBeNull()
  })

  it('returns null for invalid JSON in __NEXT_DATA__', () => {
    expect(
      extractImageFromHtml('<script id="__NEXT_DATA__" type="application/json">{bad json}</script>')
    ).toBeNull()
  })

  it('returns null when searchResults.results is empty', () => {
    const html = makeNextDataHtml({ searchResults: { results: [] } })
    expect(extractImageFromHtml(html)).toBeNull()
  })

  it('constructs CDN URL from stockcode when name matches', () => {
    const html = makeNextDataHtml(makePageProps('Full Cream Milk 2L'))
    expect(extractImageFromHtml(html, 'Full Cream Milk 2L')).toBe(MOCK_CDN_URL)
  })

  it('returns null when Coles result name does not match expectedName', () => {
    const html = makeNextDataHtml(makePageProps('Bref Brilliant Gel Toilet Cleaner'))
    expect(extractImageFromHtml(html, 'Vitasoy Oat Milk')).toBeNull()
  })

  it('accepts result when no expectedName is provided (no validation)', () => {
    const html = makeNextDataHtml(makePageProps('Bref Brilliant Gel Toilet Cleaner'))
    expect(extractImageFromHtml(html)).toBe(MOCK_CDN_URL)
  })

  it('uses first element of imageUris array when present', () => {
    const html = makeNextDataHtml({
      searchResults: { results: [{ name: 'Oat Milk', imageUris: [MOCK_IMAGE_URL] }] },
    })
    expect(extractImageFromHtml(html, 'Oat Milk')).toBe(MOCK_IMAGE_URL)
  })

  it('uses imageUris map value (800w key) when present', () => {
    const html = makeNextDataHtml({
      searchResults: { results: [{ name: 'Oat Milk', imageUris: { '800w': MOCK_IMAGE_URL } }] },
    })
    expect(extractImageFromHtml(html, 'Oat Milk')).toBe(MOCK_IMAGE_URL)
  })

  it('prefers direct imageUris over stockcode', () => {
    const html = makeNextDataHtml({
      searchResults: {
        results: [
          { name: 'Oat Milk', stockcode: Number(MOCK_STOCKCODE), imageUris: [MOCK_IMAGE_URL] },
        ],
      },
    })
    expect(extractImageFromHtml(html, 'Oat Milk')).toBe(MOCK_IMAGE_URL)
  })
})

// ---------------------------------------------------------------------------
// fetchColesImage
// ---------------------------------------------------------------------------
describe('fetchColesImage', () => {
  it('returns CDN URL when Coles result name matches', async () => {
    server.use(
      http.get(COLES_SEARCH, () =>
        HttpResponse.html(makeNextDataHtml(makePageProps('Full Cream Milk 2L')))
      )
    )
    const result = await fetchColesImage('Full Cream Milk 2L')
    expect(result).toBe(MOCK_CDN_URL)
  })

  it('returns null when Coles first result name does not match the product', async () => {
    server.use(
      http.get(COLES_SEARCH, () =>
        HttpResponse.html(makeNextDataHtml(makePageProps('Bref Brilliant Gel Toilet Cleaner')))
      )
    )
    const result = await fetchColesImage('Vitasoy Oat Milk', '9341650000943')
    expect(result).toBeNull()
  })

  it('tries barcode first, then name, returns on first valid hit', async () => {
    const calls: string[] = []
    server.use(
      http.get(COLES_SEARCH, ({ request }) => {
        const q = new URL(request.url).searchParams.get('q') ?? ''
        calls.push(q)
        return HttpResponse.html(makeNextDataHtml(makePageProps('Full Cream Milk 2L')))
      })
    )
    const result = await fetchColesImage('Full Cream Milk 2L', '9300617105028')
    expect(calls).toEqual(['9300617105028'])
    expect(result).toBe(MOCK_CDN_URL)
  })

  it('falls back to name search when barcode result does not match', async () => {
    const calls: string[] = []
    server.use(
      http.get(COLES_SEARCH, ({ request }) => {
        const q = new URL(request.url).searchParams.get('q') ?? ''
        calls.push(q)
        // barcode query returns wrong product; name query returns correct one
        const name = q === '9300617105028' ? 'Bref Toilet Cleaner' : 'Full Cream Milk 2L'
        return HttpResponse.html(makeNextDataHtml(makePageProps(name)))
      })
    )
    const result = await fetchColesImage('Full Cream Milk 2L', '9300617105028')
    expect(calls).toEqual(['9300617105028', 'Full Cream Milk 2L'])
    expect(result).toBe(MOCK_CDN_URL)
  })

  it('returns null when both barcode and name searches return wrong products', async () => {
    server.use(
      http.get(COLES_SEARCH, () =>
        HttpResponse.html(makeNextDataHtml(makePageProps('Bref Brilliant Gel Toilet Cleaner')))
      )
    )
    const result = await fetchColesImage('Vitasoy Oat Milk', '9341650000943')
    expect(result).toBeNull()
  })

  it('returns null on non-200 response', async () => {
    server.use(http.get(COLES_SEARCH, () => new HttpResponse(null, { status: 403 })))
    const result = await fetchColesImage('milk')
    expect(result).toBeNull()
  })

  it('returns null on network error', async () => {
    server.use(http.get(COLES_SEARCH, () => HttpResponse.error()))
    const result = await fetchColesImage('milk')
    expect(result).toBeNull()
  })
})
