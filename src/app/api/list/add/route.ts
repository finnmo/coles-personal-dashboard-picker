import { db } from '@/lib/db'
import { getListProvider } from '@/lib/list-providers'
import { apiError, apiOk } from '@/lib/api-response'
import { createRateLimiter } from '@/lib/rate-limiter'
import type { Store } from '@/types/product'

const listLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60 })

function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

export async function POST(request: Request) {
  const limit = listLimiter.check(getIp(request))
  if (!limit.allowed) return apiError('Too many requests', 'RATE_LIMITED', 429)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Invalid request body', 'VALIDATION_ERROR', 400)
  }

  const { productId } = body as Record<string, unknown>
  if (!productId || typeof productId !== 'string') {
    return apiError('productId is required', 'VALIDATION_ERROR', 400)
  }

  const product = await db.product.findFirst({ where: { id: productId, deletedAt: null } })
  if (!product) return apiError('Product not found', 'NOT_FOUND', 404)

  let provider
  try {
    provider = getListProvider()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'List provider unavailable'
    return apiError(message, 'SERVER_ERROR', 503)
  }

  const [result] = await Promise.all([
    provider.add({ productName: product.name, store: product.store as Store }),
    db.shoppingListItem.upsert({
      where: { productId },
      update: { addedAt: new Date() },
      create: { productId },
    }),
  ])

  return apiOk(result)
}
