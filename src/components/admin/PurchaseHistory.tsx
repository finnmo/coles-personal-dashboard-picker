'use client'

import useSWR from 'swr'

type HistoryEntry = { id: string; purchasedAt: string }

const fmt = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

interface Props {
  productId: string
}

export function PurchaseHistory({ productId }: Props) {
  const { data, isLoading } = useSWR<{ history: HistoryEntry[] }>(
    `/api/products/${productId}/history`
  )

  if (isLoading) {
    return (
      <div className="mt-2 space-y-1.5" data-testid="history-skeleton">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    )
  }

  const history = data?.history ?? []
  if (history.length === 0) {
    return <p className="mt-2 text-xs text-gray-400">No purchase history</p>
  }

  return (
    <ul className="mt-2 space-y-1">
      {history.map((entry) => (
        <li key={entry.id} className="text-xs text-gray-500 dark:text-gray-400">
          {fmt.format(new Date(entry.purchasedAt))}
        </li>
      ))}
    </ul>
  )
}
