import { searchProducts, ColesApiError } from '@/lib/coles-api'
import { getCached, setCached } from '@/lib/search-cache'
import { apiError, apiOk } from '@/lib/api-response'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()

  if (!query) return apiError('q parameter is required', 'VALIDATION_ERROR', 400)

  const cached = getCached(query)
  if (cached) return apiOk({ results: cached, cached: true })

  try {
    const results = await searchProducts(query)
    setCached(query, results)
    return apiOk({ results })
  } catch (err) {
    if (err instanceof ColesApiError) {
      const status = err.status === 429 ? 429 : 502
      return apiError(err.message, 'UPSTREAM_ERROR', status)
    }
    throw err
  }
}
