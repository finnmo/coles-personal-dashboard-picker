import { db } from '@/lib/db'
import { getListProvider } from '@/lib/list-providers'
import { apiError, apiOk } from '@/lib/api-response'
import logger from '@/lib/logger'

export async function DELETE(_req: Request, { params }: { params: { itemId: string } }) {
  const item = await db.shoppingListItem.findUnique({ where: { id: params.itemId } })
  if (!item) return apiError('Item not found', 'NOT_FOUND', 404)

  // Mark the corresponding task as complete in the list provider (if we have the ID)
  if (item.googleTaskId) {
    try {
      const provider = getListProvider()
      await provider.complete(item.googleTaskId)
    } catch (err) {
      // Log but don't fail — we still remove it from local cache
      logger.warn({ err, itemId: params.itemId }, 'Could not complete task in list provider')
    }
  }

  await db.shoppingListItem.delete({ where: { id: params.itemId } })
  return apiOk({ ok: true })
}
