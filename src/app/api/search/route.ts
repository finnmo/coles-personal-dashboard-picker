import { searchStores } from '@/lib/store-search'
import { makeSearchCache } from '@/lib/make-search-cache'
import { apiError, apiOk } from '@/lib/api-response'
import type { StoreSearchResult } from '@/lib/store-search'

const cache = makeSearchCache<StoreSearchResult>()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()

  if (!query) return apiError('q parameter is required', 'VALIDATION_ERROR', 400)

  const cached = cache.getCached(query)
  if (cached) return apiOk({ results: cached, cached: true })

  try {
    const results = await searchStores(query)
    cache.setCached(query, results)
    return apiOk({ results })
  } catch {
    return apiError('Search unavailable', 'UPSTREAM_ERROR', 502)
  }
}
