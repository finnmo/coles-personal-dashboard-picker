import { db } from '@/lib/db'
import { apiError, apiOk } from '@/lib/api-response'
import { enrichProduct } from '@/lib/product-utils'
import { createRateLimiter } from '@/lib/rate-limiter'

const mutationLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 })

function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

interface Params {
  params: { id: string }
}

export async function GET(_request: Request, { params }: Params) {
  const product = await db.product.findFirst({ where: { id: params.id, deletedAt: null } })
  if (!product) return apiError('Not found', 'NOT_FOUND', 404)
  return apiOk({ product: enrichProduct(product) })
}

export async function PATCH(request: Request, { params }: Params) {
  const limit = mutationLimiter.check(getIp(request))
  if (!limit.allowed) return apiError('Too many requests', 'RATE_LIMITED', 429)

  const existing = await db.product.findFirst({ where: { id: params.id, deletedAt: null } })
  if (!existing) return apiError('Not found', 'NOT_FOUND', 404)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('Invalid request body', 'VALIDATION_ERROR', 400)
  }

  const { name, imageUrl, repurchaseIntervalDays, lastPurchasedAt } = body as Record<
    string,
    unknown
  >

  const product = await db.product.update({
    where: { id: params.id },
    data: {
      ...(typeof name === 'string' && name ? { name } : {}),
      ...(typeof imageUrl === 'string' ? { imageUrl } : {}),
      ...(typeof repurchaseIntervalDays === 'number' && repurchaseIntervalDays > 0
        ? { repurchaseIntervalDays }
        : {}),
      ...(typeof lastPurchasedAt === 'string'
        ? { lastPurchasedAt: new Date(lastPurchasedAt) }
        : {}),
    },
  })

  return apiOk({ product: enrichProduct(product) })
}

export async function DELETE(request: Request, { params }: Params) {
  const limit = mutationLimiter.check(getIp(request))
  if (!limit.allowed) return apiError('Too many requests', 'RATE_LIMITED', 429)

  const existing = await db.product.findFirst({ where: { id: params.id, deletedAt: null } })
  if (!existing) return apiError('Not found', 'NOT_FOUND', 404)

  await db.product.update({ where: { id: params.id }, data: { deletedAt: new Date() } })
  return apiOk({ ok: true })
}
