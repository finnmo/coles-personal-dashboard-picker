'use client'

import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { IntervalEditor } from './IntervalEditor'
import { Button } from '@/components/ui/button'
import type { EnrichedProduct } from '@/types/product'

interface ProductManagerProps {
  products: EnrichedProduct[]
  onRemove: (id: string) => Promise<void>
  onUpdateInterval: (id: string, days: number) => Promise<void>
}

export function ProductManager({ products, onRemove, onUpdateInterval }: ProductManagerProps) {
  if (products.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No products added yet. Use the search above to add products.
      </p>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-border" data-testid="product-manager">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center gap-3 py-3"
          data-testid={`managed-product-${product.id}`}
        >
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-muted">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="40px"
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-lg">🛒</div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
            <IntervalEditor
              productId={product.id}
              currentInterval={product.repurchaseIntervalDays}
              onSave={onUpdateInterval}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(product.id)}
            data-testid={`remove-btn-${product.id}`}
            aria-label={`Remove ${product.name}`}
            className="text-muted-foreground hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
