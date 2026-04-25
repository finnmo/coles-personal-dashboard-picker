import { db } from '@/lib/db'
import { apiError, apiOk } from '@/lib/api-response'
import { enrichProduct } from '@/lib/product-utils'
import { createRateLimiter } from '@/lib/rate-limiter'

const postLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 })

function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

export async function GET() {
  const products = await db.product.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  const enriched = products.map(enrichProduct).sort((a, b) => {
    if (a.isNew && !b.isNew) return 1
    if (!a.isNew && b.isNew) return -1
    return b.priorityScore - a.priorityScore
  })

  return apiOk({ products: enriched })
}

export async function POST(request: Request) {
  const limit = postLimiter.check(getIp(request))
  if (!limit.allowed) return apiError('Too many requests', 'RATE_LIMITED', 429)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Invalid request body', 'VALIDATION_ERROR', 400)
  }

  const { name, imageUrl, offProductId, repurchaseIntervalDays } = body as Record<string, unknown>

  if (!name || typeof name !== 'string') {
    return apiError('name is required', 'VALIDATION_ERROR', 400)
  }

  try {
    const product = await db.product.create({
      data: {
        name,
        imageUrl: typeof imageUrl === 'string' && imageUrl ? imageUrl : null,
        offProductId: typeof offProductId === 'string' && offProductId ? offProductId : null,
        repurchaseIntervalDays:
          typeof repurchaseIntervalDays === 'number' && repurchaseIntervalDays > 0
            ? repurchaseIntervalDays
            : 14,
      },
    })
    return apiOk({ product: enrichProduct(product) }, 201)
  } catch (err) {
    const e = err as { code?: string }
    if (e.code === 'P2002') {
      return apiError('A product with that ID already exists', 'CONFLICT', 409)
    }
    throw err
  }
}
