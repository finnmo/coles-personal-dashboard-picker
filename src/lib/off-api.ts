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
  brands?: string
  image_front_url?: string
  quantity?: string
}

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/search'

export async function searchProducts(query: string): Promise<OffSearchResult[]> {
  const url = new URL(OFF_BASE)
  url.searchParams.set('search_terms', query)
  url.searchParams.set('fields', 'code,product_name,brands,image_front_url,quantity')
  url.searchParams.set('page_size', '20')
  url.searchParams.set('countries_tags_en', 'australia')

  const email = process.env.OPEN_FOOD_FACTS_EMAIL ?? 'dashboard'
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)

  let response: Response
  try {
    response = await fetch(url.toString(), {
      headers: { 'User-Agent': `GroceryDashboard/1.0 (${email})` },
      signal: controller.signal,
      cache: 'no-store',
    })
  } catch (cause) {
    clearTimeout(timeout)
    throw new OffApiError(`Network error contacting Open Food Facts: ${String(cause)}`, 0)
  }
  clearTimeout(timeout)

  if (!response.ok) {
    throw new OffApiError(`Open Food Facts responded with ${response.status}`, response.status)
  }

  let body: { products?: OffProduct[] }
  try {
    body = await response.json()
  } catch {
    throw new OffApiError('Open Food Facts returned non-JSON response', response.status)
  }

  return (body.products ?? [])
    .filter((p) => p.code && p.product_name)
    .map((p) => ({
      offProductId: p.code!,
      name: p.product_name!,
      imageUrl: p.image_front_url?.trim() || null,
      brand: p.brands?.trim() || null,
      quantity: p.quantity?.trim() || null,
    }))
}
