export type ColesSearchResult = {
  colesProductId: string
  name: string
  imageUrl: string
  brand: string | null
  packageSize: string | null
  price: number | null
}

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

function extractProductId(url: string): string {
  const match = url.match(/\/product\/(\d+)/)
  return match ? match[1] : ''
}

export async function fetchColesProductImage(colesProductId: string): Promise<string> {
  const url = `https://www.coles.com.au/product/${colesProductId}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
      cache: 'no-store',
    })
    if (!response.ok) return ''
    const html = await response.text()
    const match = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)
    return match ? match[1] : ''
  } catch {
    return ''
  } finally {
    clearTimeout(timeout)
  }
}

export async function searchProducts(query: string): Promise<ColesSearchResult[]> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) throw new ColesApiError('RAPIDAPI_KEY is not configured', 0)

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
    .map((r) => ({
      colesProductId: extractProductId(r.url),
      name: r.product_name,
      imageUrl: '',
      brand: r.product_brand ?? null,
      packageSize: r.product_size ?? null,
      price: r.current_price ?? null,
    }))
    .filter((p) => p.colesProductId && p.name)
}
