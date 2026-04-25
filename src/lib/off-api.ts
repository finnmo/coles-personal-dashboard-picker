export type OffSearchResult = {
  offProductId: string
  name: string
  imageUrl: string | null
  brand: string | null
  quantity: string | null
}

export class OffApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'OffApiError'
  }
}

type OffProduct = {
  code?: string
  product_name?: string
  // search.openfoodfacts.org returns brands as an array
  brands?: string | string[]
  image_front_small_url?: string
  image_front_url?: string
  quantity?: string
}

// The dedicated search service has proper Elasticsearch relevance scoring
// and does not block server-side requests the way the v2 API does.
const OFF_SEARCH_BASE = 'https://search.openfoodfacts.org/search'

async function fetchOff(url: URL): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)
  try {
    return await fetch(url.toString(), {
      signal: controller.signal,
      cache: 'no-store',
    })
  } catch (cause) {
    throw new OffApiError(`Network error contacting Open Food Facts: ${String(cause)}`, 0)
  } finally {
    clearTimeout(timeout)
  }
}

function normaliseBrands(brands: string | string[] | undefined): string | null {
  if (!brands) return null
  if (Array.isArray(brands)) {
    const joined = brands.join(', ').trim()
    return joined || null
  }
  return brands.trim() || null
}

export async function searchProducts(query: string): Promise<OffSearchResult[]> {
  const url = new URL(OFF_SEARCH_BASE)
  url.searchParams.set('q', query)
  url.searchParams.set(
    'fields',
    'code,product_name,brands,image_front_small_url,image_front_url,quantity'
  )
  url.searchParams.set('page_size', '50')

  let response = await fetchOff(url)

  // Retry once on 503
  if (response.status === 503) {
    await new Promise((r) => setTimeout(r, 600))
    response = await fetchOff(url)
  }

  if (!response.ok) {
    throw new OffApiError(`Open Food Facts responded with ${response.status}`, response.status)
  }

  let body: { hits?: OffProduct[] }
  try {
    body = await response.json()
  } catch {
    throw new OffApiError('Open Food Facts returned non-JSON response', response.status)
  }

  return (body.hits ?? [])
    .filter((p) => p.code && p.product_name)
    .map((p) => ({
      offProductId: p.code!,
      name: p.product_name!,
      imageUrl: p.image_front_small_url?.trim() || p.image_front_url?.trim() || null,
      brand: normaliseBrands(p.brands),
      quantity: p.quantity?.trim() || null,
    }))
}
