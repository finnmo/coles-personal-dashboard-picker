import { db } from '@/lib/db'
import { fetchColesProductImage } from '@/lib/coles-api'
import { apiError, apiOk } from '@/lib/api-response'
import { enrichProduct } from '@/lib/product-utils'
import { createRateLimiter } from '@/lib/rate-limiter'
import type { Store } from '@/types/product'

const postLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 })

function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

const VALID_STORES: Store[] = ['COLES', 'IGA']

function isValidStore(value: string): value is Store {
  return VALID_STORES.includes(value as Store)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeParam = searchParams.get('store')?.toUpperCase()

  if (storeParam && !isValidStore(storeParam)) {
    return apiError(
      `Invalid store. Valid values: ${VALID_STORES.join(', ')}`,
      'VALIDATION_ERROR',
      400
    )
  }

  const products = await db.product.findMany({
    where: {
      ...(storeParam ? { store: storeParam } : {}),
      deletedAt: null,
    },
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

  const { name, imageUrl, store, colesProductId, igaProductId, repurchaseIntervalDays } =
    body as Record<string, unknown>

  if (!name || typeof name !== 'string') {
    return apiError('name is required', 'VALIDATION_ERROR', 400)
  }
  if (!store || !isValidStore(String(store))) {
    return apiError(`store must be one of: ${VALID_STORES.join(', ')}`, 'VALIDATION_ERROR', 400)
  }

  try {
    const resolvedColesId = typeof colesProductId === 'string' ? colesProductId : null
    const resolvedImageUrl =
      typeof imageUrl === 'string' && imageUrl
        ? imageUrl
        : resolvedColesId
          ? await fetchColesProductImage(resolvedColesId)
          : null

    const product = await db.product.create({
      data: {
        name,
        imageUrl: resolvedImageUrl || null,
        store: String(store),
        colesProductId: resolvedColesId,
        igaProductId: typeof igaProductId === 'string' ? igaProductId : null,
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
