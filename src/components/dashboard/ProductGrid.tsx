'use client'

import { useState, useCallback } from 'react'
import { useSWRConfig } from 'swr'
import { useProducts } from '@/hooks/useProducts'
import { ProductTile } from './ProductTile'
import { ProductGridSkeleton } from './ProductGridSkeleton'
import { EmptyState } from './EmptyState'
import { ProductFilter } from './ProductFilter'
import { STORE_LABELS } from '@/lib/constants'
import type { Store } from '@/types/product'

interface ProductGridProps {
  store: Store
}

export function ProductGrid({ store }: ProductGridProps) {
  const { products, isLoading, mutate } = useProducts(store)
  const { mutate: globalMutate } = useSWRConfig()
  const [reordering, setReordering] = useState(false)

  const onPurchased = useCallback(() => {
    setReordering(true)
    mutate()
    globalMutate('/api/shopping-list')
    setTimeout(() => setReordering(false), 400)
  }, [mutate, globalMutate])

  if (isLoading) return <ProductGridSkeleton />
  if (!products || products.length === 0) return <EmptyState store={STORE_LABELS[store]} />

  return (
    <ProductFilter products={products}>
      {(filtered) => (
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-base text-muted-foreground">
              No products match that filter.
            </p>
          ) : (
            <div
              className={`grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 transition-opacity duration-300 ${
                reordering ? 'opacity-60' : 'opacity-100'
              }`}
              data-testid="product-grid"
            >
              {filtered.map((product) => (
                <ProductTile key={product.id} product={product} onPurchased={onPurchased} />
              ))}
            </div>
          )}
        </div>
      )}
    </ProductFilter>
  )
}
