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

function getConfig() {
  return {
    baseUrl: process.env.COLES_API_BASE_URL ?? 'https://api.coles.com.au',
    userAgent:
      process.env.COLES_API_USER_AGENT ??
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeProduct(raw: any): ColesSearchResult {
  return {
    colesProductId: String(raw.id ?? raw.stockcode ?? raw.productId ?? ''),
    name: String(raw.name ?? raw.displayName ?? ''),
    imageUrl: String(
      raw.imageUris?.find((u: { type: string }) => u.type === 'product-image-large')?.uri ??
        raw.imageUris?.[0]?.uri ??
        raw.imageUrl ??
        ''
    ),
    brand: raw.brand ? String(raw.brand) : null,
    packageSize: raw.size ? String(raw.size) : null,
    price: raw.pricing?.now != null ? Number(raw.pricing.now) : null,
  }
}

export async function searchProducts(query: string): Promise<ColesSearchResult[]> {
  const { baseUrl, userAgent } = getConfig()
  const url = new URL(`${baseUrl}/api/2.0/page/products/search`)
  url.searchParams.set('q', query)
  url.searchParams.set('pageSize', '20')
  url.searchParams.set('pageNumber', '1')

  let response: Response
  try {
    response = await fetch(url.toString(), {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
        'Accept-Language': 'en-AU,en;q=0.9',
      },
      // Prevent Next.js from caching external API calls
      cache: 'no-store',
    })
  } catch (cause) {
    throw new ColesApiError(`Network error contacting Coles API: ${String(cause)}`, 0)
  }

  if (!response.ok) {
    throw new ColesApiError(`Coles API responded with ${response.status}`, response.status)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ColesApiError('Coles API returned non-JSON response', response.status)
  }

  // The Coles API nests results under different keys depending on the endpoint version
  const raw = body as Record<string, unknown>
  const results: unknown[] =
    (raw.results as unknown[]) ??
    (raw.products as unknown[]) ??
    ((raw.catalogGroupView as Record<string, unknown>)?.catalogEntryView as unknown[]) ??
    []

  return results.map(normalizeProduct).filter((p) => p.colesProductId && p.name)
}
