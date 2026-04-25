'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Check, Loader2 } from 'lucide-react'
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

      <button
        disabled={alreadyAdded || isAdding}
        onClick={handleAdd}
        data-testid={`add-btn-${result.colesProductId}`}
        aria-label={alreadyAdded ? 'Already added' : `Add ${result.name}`}
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
          alreadyAdded
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary text-primary-foreground active:opacity-70'
        }`}
      >
        {isAdding ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : alreadyAdded ? (
          <Check className="h-5 w-5" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
      </button>
    </div>
  )
}
