import logger from '@/lib/logger'
import type { StoreSearchResult } from '@/lib/store-search'

export class IgaApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'IgaApiError'
  }
}

const IGA_BASE = 'https://www.igashop.com.au'
const USER_AGENT =
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

export async function searchIgaProducts(query: string): Promise<StoreSearchResult[]> {
  const url = `${IGA_BASE}/sm/planning/rsid/3541/results?q=${encodeURIComponent(query)}`

  let html: string
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new IgaApiError(`IGA responded ${res.status}`, res.status)
    html = await res.text()
  } catch (err) {
    if (err instanceof IgaApiError) throw err
    throw new IgaApiError('IGA search unavailable', 502)
  }

  try {
    const match = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!match) {
      logger.warn({ query }, 'IGA: __NEXT_DATA__ not found in response')
      return []
    }
    const data = JSON.parse(match[1])
    const products = data?.props?.pageProps?.initialData?.searchData?.productData?.results ?? []

    if (!Array.isArray(products)) {
      logger.warn({ query }, 'IGA: unexpected products shape')
      return []
    }

    return products
      .slice(0, 20)
      .map(
        (p: Record<string, unknown>): StoreSearchResult => ({
          externalId: `iga:${String(p.stockCode ?? p.id ?? '')}`,
          store: 'iga',
          name: String(p.name ?? ''),
          imageUrl: typeof p.imageURL === 'string' ? p.imageURL : null,
          brand: typeof p.brand === 'string' ? p.brand : null,
          quantity: typeof p.packageSize === 'string' ? p.packageSize : null,
          price: typeof p.price === 'number' ? p.price : null,
        })
      )
      .filter((p) => p.externalId !== 'iga:' && p.name)
  } catch {
    logger.warn({ query }, 'IGA: failed to parse __NEXT_DATA__')
    return []
  }
}
