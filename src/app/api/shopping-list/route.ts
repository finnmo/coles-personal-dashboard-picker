import { db } from '@/lib/db'
import { getListProvider } from '@/lib/list-providers'
import { apiOk } from '@/lib/api-response'
import logger from '@/lib/logger'

/**
 * GET /api/shopping-list
 *
 * For bidirectional providers (todoist, google_tasks): fetches the live task
 * list and syncs the local SQLite cache so the sidebar can display product
 * images. Items checked off on mobile are purged from the local cache here.
 *
 * For write-only providers (apple_reminders): returns the local cache as-is.
 */
export async function GET() {
  let provider
  try {
    provider = getListProvider()
  } catch {
    // No provider configured — return whatever is in the local cache.
    const items = await localItems()
    return apiOk({ items, synced: false })
  }

  const isBidirectional = provider.name === 'todoist' || provider.name === 'google_tasks'

  if (!isBidirectional) {
    // Write-only providers (apple_reminders) — serve local cache.
    const items = await localItems()
    return apiOk({ items, synced: false })
  }

  // --- Bidirectional sync: fetch live tasks and reconcile local cache ---
  let liveTasks: { taskId: string; title: string }[]
  try {
    liveTasks = await provider.list()
  } catch (err) {
    logger.warn({ err }, `Failed to fetch ${provider.name} tasks — serving local cache`)
    const items = await localItems()
    return apiOk({ items, synced: false, error: 'provider_unavailable' })
  }

  const liveTaskIds = new Set(liveTasks.map((t) => t.taskId))

  // Remove local cache entries whose task has been completed/deleted externally
  await db.shoppingListItem.deleteMany({
    where: {
      googleTaskId: { not: null },
      NOT: { googleTaskId: { in: [...liveTaskIds] } },
    },
  })

  // Inbound sync: tasks added on mobile that we haven't seen before
  const knownRows = await db.shoppingListItem.findMany({
    where: { googleTaskId: { not: null } },
    select: { googleTaskId: true },
  })
  const knownTaskIds = new Set(knownRows.map((r) => r.googleTaskId!))
  const newTasks = liveTasks.filter((t) => !knownTaskIds.has(t.taskId))

  const newItems: { id: string; name: string }[] = []

  if (newTasks.length > 0) {
    const allProducts = await db.product.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    })

    for (const task of newTasks) {
      const title = task.title.trim()
      if (!title) continue

      const titleLower = title.toLowerCase()
      let product = allProducts.find((p) => p.name.toLowerCase() === titleLower) ?? null

      if (!product) {
        product = await db.product.create({ data: { name: title } })
        allProducts.push(product)
      }

      const existing = await db.shoppingListItem.findUnique({
        where: { productId: product.id },
      })
      if (existing) continue

      await db.shoppingListItem.create({
        data: { productId: product.id, googleTaskId: task.taskId },
      })
      newItems.push({ id: product.id, name: product.name })
    }
  }

  const items = await localItems()
  return apiOk({ items, synced: true, newItems })
}

/**
 * DELETE /api/shopping-list
 *
 * Clears all tasks in the list provider and wipes the local cache.
 */
export async function DELETE() {
  try {
    const provider = getListProvider()
    await provider.clear()
  } catch {
    // If no provider or it fails, still clear local cache.
  }
  await db.shoppingListItem.deleteMany()
  return apiOk({ ok: true })
}

async function localItems() {
  return db.shoppingListItem.findMany({
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
    },
    orderBy: { addedAt: 'asc' },
  })
}
