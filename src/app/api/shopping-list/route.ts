import { db } from '@/lib/db'
import { getListProvider } from '@/lib/list-providers'
import { apiOk } from '@/lib/api-response'
import logger from '@/lib/logger'

/**
 * GET /api/shopping-list
 *
 * For Google Tasks: fetches the live task list and syncs the local SQLite
 * cache so the sidebar can display product images (which Google Tasks
 * doesn't store). Items checked off in the Google Tasks app are purged
 * from the local cache here.
 *
 * For Apple Reminders (write-only): returns the local cache as-is.
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

  if (provider.name !== 'google_tasks') {
    // Apple Reminders is write-only; serve local cache.
    const items = await localItems()
    return apiOk({ items, synced: false })
  }

  // --- Google Tasks: sync local cache with live tasks ---
  let liveTasks: { taskId: string; title: string }[]
  try {
    liveTasks = await provider.list()
  } catch (err) {
    logger.warn({ err }, 'Failed to fetch Google Tasks — serving local cache')
    const items = await localItems()
    return apiOk({ items, synced: false, error: 'google_tasks_unavailable' })
  }

  const liveTaskIds = new Set(liveTasks.map((t) => t.taskId))

  // Remove local cache entries whose Google Task has been completed/deleted
  await db.shoppingListItem.deleteMany({
    where: {
      googleTaskId: { not: null },
      NOT: { googleTaskId: { in: [...liveTaskIds] } },
    },
  })

  const items = await localItems()
  return apiOk({ items, synced: true })
}

/**
 * DELETE /api/shopping-list
 *
 * Clears all tasks in Google Tasks and wipes the local cache.
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
