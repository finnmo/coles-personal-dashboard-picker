'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Check, Loader2 } from 'lucide-react'
import type { StoreSearchResult, Store } from '@/lib/store-search'

interface SearchResultCardProps {
  result: StoreSearchResult
  alreadyAdded: boolean
  onAdd: () => Promise<void>
}

const STORE_LABEL: Record<Store, string> = {
  coles: 'Coles',
  woolworths: 'Woolworths',
  iga: 'IGA',
}

const STORE_CLASS: Record<Store, string> = {
  coles: 'bg-red-600 text-white',
  woolworths: 'bg-green-700 text-white',
  iga: 'bg-blue-700 text-white',
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
      data-testid={`search-result-${result.externalId}`}
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
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STORE_CLASS[result.store]}`}
          >
            {STORE_LABEL[result.store]}
          </span>
          {result.brand && <span>{result.brand}</span>}
          {result.quantity && <span>{result.quantity}</span>}
          {result.price != null && (
            <span className="ml-auto font-medium text-foreground">${result.price.toFixed(2)}</span>
          )}
        </div>
      </div>

      <button
        disabled={alreadyAdded || isAdding}
        onClick={handleAdd}
        data-testid={`add-btn-${result.externalId}`}
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
