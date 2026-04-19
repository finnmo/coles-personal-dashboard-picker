'use client'

import { useProducts } from '@/hooks/useProducts'
import { ProductTile } from './ProductTile'
import { ProductGridSkeleton } from './ProductGridSkeleton'
import { EmptyState } from './EmptyState'
import { STORE_LABELS } from '@/lib/constants'
import type { Store } from '@/types/product'

interface ProductGridProps {
  store: Store
}

export function ProductGrid({ store }: ProductGridProps) {
  const { products, isLoading, mutate } = useProducts(store)

  if (isLoading) {
    return <ProductGridSkeleton />
  }

  if (!products || products.length === 0) {
    return <EmptyState store={STORE_LABELS[store]} />
  }

  return (
    <div
      className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      data-testid="product-grid"
    >
      {products.map((product) => (
        <ProductTile key={product.id} product={product} onPurchased={() => mutate()} />
      ))}
    </div>
  )
}
