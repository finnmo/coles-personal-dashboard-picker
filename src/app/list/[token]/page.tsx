import { verifyShareToken } from '@/lib/share-token'
import { db } from '@/lib/db'

const fmt = new Intl.DateTimeFormat('en-AU', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

interface PageProps {
  params: { token: string }
}

export default async function SharedListPage({ params }: PageProps) {
  const valid = await verifyShareToken(params.token)

  if (!valid) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-semibold">Link expired or invalid</h1>
        <p className="mt-2 text-muted-foreground">
          This shopping list link has expired or is no longer valid.
        </p>
      </main>
    )
  }

  const items = await db.shoppingListItem.findMany({
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
    },
    orderBy: { addedAt: 'asc' },
  })

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-1 text-2xl font-bold">Shopping List</h1>
      <p className="mb-6 text-sm text-muted-foreground">Shared list — read only</p>

      {items.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">The shopping list is empty.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  Added {fmt.format(new Date(item.addedAt))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
