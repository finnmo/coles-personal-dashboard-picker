import Image from 'next/image'
import { PriorityBadge } from './PriorityBadge'
import { PurchaseButton } from './PurchaseButton'
import type { EnrichedProduct } from '@/types/product'

interface ProductTileProps {
  product: EnrichedProduct
  onPurchased?: () => void
}

export function ProductTile({ product, onPurchased }: ProductTileProps) {
  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
      data-testid={`product-tile-${product.id}`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-muted-foreground">
            🛒
          </div>
        )}
        <div className="absolute left-2 top-2">
          <PriorityBadge
            isNew={product.isNew}
            isOverdue={product.isOverdue}
            priorityScore={product.priorityScore}
            daysSinceLastPurchase={product.daysSinceLastPurchase}
          />
        </div>
      </div>

      <div className="flex flex-1 items-end justify-between gap-2 p-3">
        <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
          {product.name}
        </p>
        <PurchaseButton productId={product.id} onSuccess={onPurchased} />
      </div>
    </article>
  )
}
