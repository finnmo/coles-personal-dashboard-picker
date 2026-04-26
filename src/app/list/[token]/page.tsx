import { verifyShareToken } from '@/lib/share-token'
import { db } from '@/lib/db'
import { SaveOptions } from './SaveOptions'

const fmt = new Intl.DateTimeFormat('en-AU', {
  month: 'short',
  day: 'numeric',
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
    <main className="mx-auto max-w-md px-4 pt-8 pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Shopping List</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length === 0
            ? 'Nothing here yet'
            : `${items.length} item${items.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">The shopping list is empty.</p>
      ) : (
        <>
          <ul className="mb-8 divide-y divide-border rounded-2xl border border-border overflow-hidden">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 bg-card px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{item.product.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Added {fmt.format(new Date(item.addedAt))}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mb-2">
            <p className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Save this list
            </p>
            <SaveOptions itemNames={items.map((i) => i.product.name)} />
          </div>
        </>
      )}
    </main>
  )
}
