import { db } from '@/lib/db'
import { apiError, apiOk } from '@/lib/api-response'

interface Params {
  params: { id: string }
}

export async function POST(_request: Request, { params }: Params) {
  const existing = await db.product.findFirst({ where: { id: params.id, deletedAt: null } })
  if (!existing) return apiError('Not found', 'NOT_FOUND', 404)

  const now = new Date()
  const [product] = await db.$transaction([
    db.product.update({ where: { id: params.id }, data: { lastPurchasedAt: now } }),
    db.purchaseEvent.create({ data: { productId: params.id, purchasedAt: now } }),
  ])

  return apiOk({ ok: true, lastPurchasedAt: product.lastPurchasedAt?.toISOString() })
}
