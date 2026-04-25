import type { StoreSearchResult } from '@/lib/store-search'

export class WoolworthsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'WoolworthsApiError'
  }
}

type RapidApiResult = {
  product_name: string
  product_brand: string | null
  current_price: number | null
  product_size: string | null
  url: string
}

// Woolworths product URLs: /shop/productdetails/{stockcode}/{slug}
function extractStockcode(url: string): string {
  const match = url.match(/\/productdetails\/(\d+)/)
  return match ? match[1] : ''
}

export function woolworthsImageUrl(stockcode: string): string {
  return `https://cdn0.woolworths.media/content/wowproductimages/large/${stockcode}.jpg`
}

export async function searchWoolworthsProducts(query: string): Promise<StoreSearchResult[]> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    return []
  }

  const url = new URL('https://woolworths-products-api.p.rapidapi.com/woolworths/product-search/')
  url.searchParams.set('query', query)

  let response: Response
  try {
    response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'woolworths-products-api.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    })
  } catch (cause) {
    throw new WoolworthsApiError(`Network error contacting Woolworths API: ${String(cause)}`, 0)
  }

  if (!response.ok) {
    throw new WoolworthsApiError(
      `Woolworths API responded with ${response.status}`,
      response.status
    )
  }

  let body: { results?: RapidApiResult[] }
  try {
    body = await response.json()
  } catch {
    throw new WoolworthsApiError('Woolworths API returned non-JSON response', response.status)
  }

  return (body.results ?? [])
    .map((r) => {
      const stockcode = extractStockcode(r.url)
      return {
        externalId: `woolworths:${stockcode}`,
        store: 'woolworths' as const,
        name: r.product_name,
        imageUrl: stockcode ? woolworthsImageUrl(stockcode) : null,
        brand: r.product_brand ?? null,
        quantity: r.product_size ?? null,
        price: r.current_price ?? null,
      }
    })
    .filter((p) => p.externalId !== 'woolworths:' && p.name)
}
