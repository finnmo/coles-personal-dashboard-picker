'use client'

import { ProductGrid } from './ProductGrid'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ErrorFallback } from '@/components/ui/ErrorFallback'

export function ProductGridWithBoundary() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <ErrorFallback title="Could not load products" message={error.message} onReset={reset} />
      )}
    >
      <ProductGrid />
    </ErrorBoundary>
  )
}
