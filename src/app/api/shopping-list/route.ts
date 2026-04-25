import { db } from '@/lib/db'
import { apiOk } from '@/lib/api-response'

export async function GET() {
  const items = await db.shoppingListItem.findMany({
    include: { product: { select: { id: true, name: true, imageUrl: true, store: true } } },
    orderBy: { addedAt: 'asc' },
  })
  return apiOk({ items })
}

export async function DELETE() {
  await db.shoppingListItem.deleteMany()
  return apiOk({ ok: true })
}
