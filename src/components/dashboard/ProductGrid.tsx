'use client'

import { useState, useCallback } from 'react'
import { useSWRConfig } from 'swr'
import { useProducts } from '@/hooks/useProducts'
import { ProductTile } from './ProductTile'
import { ProductGridSkeleton } from './ProductGridSkeleton'
import { EmptyState } from './EmptyState'
import { ProductFilter } from './ProductFilter'

export function ProductGrid() {
  const { products, isLoading, mutate } = useProducts()
  const { mutate: globalMutate } = useSWRConfig()
  const [reordering, setReordering] = useState(false)

  const onPurchased = useCallback(() => {
    setReordering(true)
    mutate()
    globalMutate('/api/shopping-list')
    setTimeout(() => setReordering(false), 400)
  }, [mutate, globalMutate])

  if (isLoading) return <ProductGridSkeleton />
  if (!products || products.length === 0) return <EmptyState />

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
