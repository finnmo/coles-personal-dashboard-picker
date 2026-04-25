import type { StoreSearchResult } from '@/lib/store-search'

export class ColesApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'ColesApiError'
  }
}

type RapidApiResult = {
  product_name: string
  product_brand: string | null
  current_price: number | null
  product_size: string | null
  url: string
}

function extractStockcode(url: string): string {
  const match = url.match(/\/product\/(\d+)/)
  return match ? match[1] : ''
}

export function colesImageUrl(stockcode: string): string {
  const firstChar = stockcode[0] ?? '0'
  return `https://cdn.productimages.coles.com.au/productimages/${firstChar}/${stockcode}.jpg`
}

export async function searchColesProducts(query: string): Promise<StoreSearchResult[]> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    return []
  }

  const url = new URL('https://coles-product-price-api.p.rapidapi.com/coles/product-search/')
  url.searchParams.set('query', query)

  let response: Response
  try {
    response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'coles-product-price-api.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    })
  } catch (cause) {
    throw new ColesApiError(`Network error contacting Coles API: ${String(cause)}`, 0)
  }

  if (!response.ok) {
    throw new ColesApiError(`Coles API responded with ${response.status}`, response.status)
  }

  let body: { results?: RapidApiResult[] }
  try {
    body = await response.json()
  } catch {
    throw new ColesApiError('Coles API returned non-JSON response', response.status)
  }

  return (body.results ?? [])
    .map((r) => {
      const stockcode = extractStockcode(r.url)
      return {
        externalId: `coles:${stockcode}`,
        store: 'coles' as const,
        name: r.product_name,
        imageUrl: stockcode ? colesImageUrl(stockcode) : null,
        brand: r.product_brand ?? null,
        quantity: r.product_size ?? null,
        price: r.current_price ?? null,
      }
    })
    .filter((p) => p.externalId !== 'coles:' && p.name)
}
