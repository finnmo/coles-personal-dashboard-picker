import { db } from '@/lib/db'
import { apiError, apiOk } from '@/lib/api-response'
import { enrichProduct } from '@/lib/product-utils'
import { createRateLimiter } from '@/lib/rate-limiter'
import { fetchColesImage } from '@/lib/coles-image'

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

  const offImageUrl = typeof imageUrl === 'string' && imageUrl ? imageUrl : null
  const barcode = typeof offProductId === 'string' && offProductId ? offProductId : null

  // Try Coles first for a better image; fall back to OFF image on any failure
  const colesImageUrl = await fetchColesImage(name, barcode).catch(() => null)
  const resolvedImageUrl = colesImageUrl ?? offImageUrl

  try {
    const product = await db.product.create({
      data: {
        name,
        imageUrl: resolvedImageUrl,
        offProductId: barcode,
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
