import { ShoppingBasket } from 'lucide-react'

interface EmptyStateProps {
  store: string
}

export function EmptyState({ store }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <ShoppingBasket className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <p className="text-lg font-medium text-foreground">No {store} products yet</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Visit the admin panel to search for and add products to your dashboard.
      </p>
    </div>
  )
}
