'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ColesSearchResult } from '@/lib/coles-api'

interface SearchResultCardProps {
  result: ColesSearchResult
  alreadyAdded: boolean
  onAdd: () => Promise<void>
}

export function SearchResultCard({ result, alreadyAdded, onAdd }: SearchResultCardProps) {
  const [isAdding, setIsAdding] = useState(false)

  async function handleAdd() {
    if (isAdding || alreadyAdded) return
    setIsAdding(true)
    try {
      await onAdd()
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
      data-testid={`search-result-${result.colesProductId}`}
    >
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
        {result.imageUrl ? (
          <Image
            src={result.imageUrl}
            alt={result.name}
            fill
            sizes="48px"
            className="object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xl">🛒</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{result.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {result.brand && <span>{result.brand}</span>}
          {result.packageSize && <span>{result.packageSize}</span>}
          {result.price != null && (
            <span className="font-medium text-foreground">${result.price.toFixed(2)}</span>
          )}
        </div>
      </div>

      <Button
        variant={alreadyAdded ? 'ghost' : 'primary'}
        size="sm"
        disabled={alreadyAdded || isAdding}
        onClick={handleAdd}
        data-testid={`add-btn-${result.colesProductId}`}
        aria-label={alreadyAdded ? 'Already added' : `Add ${result.name}`}
      >
        {isAdding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : alreadyAdded ? (
          <Check className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
