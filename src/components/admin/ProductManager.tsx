'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Trash2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react'
import { IntervalEditor } from './IntervalEditor'
import { PurchaseHistory } from './PurchaseHistory'
import { Button } from '@/components/ui/button'
import { useBulkIntervalEdit } from '@/hooks/useBulkIntervalEdit'
import type { EnrichedProduct } from '@/types/product'

interface ProductManagerProps {
  products: EnrichedProduct[]
  onRemove: (id: string) => Promise<void>
  onUpdateInterval: (id: string, days: number) => Promise<void>
}

export function ProductManager({ products, onRemove, onUpdateInterval }: ProductManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const {
    bulkMode,
    toggleBulkMode,
    pendingValues,
    setPendingValue,
    saveAll,
    saving,
    errors,
    cancel,
  } = useBulkIntervalEdit(products, onUpdateInterval)

  if (products.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No products added yet. Use the search above to add products.
      </p>
    )
  }

  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={toggleBulkMode}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          data-testid="bulk-interval-toggle"
        >
          {bulkMode ? (
            <ToggleRight className="h-4 w-4 text-primary" />
          ) : (
            <ToggleLeft className="h-4 w-4" />
          )}
          Edit all intervals
        </button>
      </div>

      <div className="flex flex-col divide-y divide-border" data-testid="product-manager">
        {products.map((product) => (
          <div key={product.id} className="py-3" data-testid={`managed-product-${product.id}`}>
            <div className="flex items-center gap-3">
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
                {errors[product.id] && <p className="text-xs text-red-500">{errors[product.id]}</p>}
                <IntervalEditor
                  productId={product.id}
                  currentInterval={product.repurchaseIntervalDays}
                  onSave={onUpdateInterval}
                  bulkMode={bulkMode}
                  bulkValue={pendingValues[product.id]}
                  onBulkChange={(days) => setPendingValue(product.id, days)}
                />
              </div>

              {!bulkMode && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                    aria-label={expandedId === product.id ? 'Hide history' : 'Show history'}
                    className="text-muted-foreground"
                  >
                    {expandedId === product.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

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
                </>
              )}
            </div>

            {!bulkMode && expandedId === product.id && (
              <div className="pl-13">
                <PurchaseHistory productId={product.id} />
              </div>
            )}
          </div>
        ))}
      </div>

      {bulkMode && (
        <div className="sticky bottom-0 mt-4 flex gap-2 border-t border-border bg-background pt-3">
          <Button variant="outline" size="sm" onClick={cancel} className="flex-1">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={saveAll}
            disabled={saving}
            className="flex-1"
            data-testid="bulk-save-btn"
          >
            {saving ? 'Saving…' : 'Save all'}
          </Button>
        </div>
      )}
    </div>
  )
}
