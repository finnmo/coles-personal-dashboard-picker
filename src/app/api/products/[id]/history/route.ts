import { db } from '@/lib/db'
import { apiError, apiOk } from '@/lib/api-response'

interface Params {
  params: { id: string }
}

export async function GET(_request: Request, { params }: Params) {
  const product = await db.product.findFirst({ where: { id: params.id, deletedAt: null } })
  if (!product) return apiError('Not found', 'NOT_FOUND', 404)

  const events = await db.purchaseEvent.findMany({
    where: { productId: params.id },
    orderBy: { purchasedAt: 'desc' },
    take: 10,
    select: { id: true, purchasedAt: true },
  })

  return apiOk({
    history: events.map((e) => ({ id: e.id, purchasedAt: e.purchasedAt.toISOString() })),
  })
}
