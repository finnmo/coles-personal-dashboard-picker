'use client'

import { Search, Loader2 } from 'lucide-react'
import { SearchResultCard } from './SearchResultCard'
import { useSearch } from '@/hooks/useSearch'
import type { Store } from '@/types/product'

interface SearchPanelProps {
  store: Store
  onAdd: (result: {
    colesProductId: string
    name: string
    imageUrl: string
    brand: string | null
    packageSize: string | null
    price: number | null
  }) => Promise<void>
  existingIds: Set<string>
}

export function SearchPanel({ store, onAdd, existingIds }: SearchPanelProps) {
  const { query, setQuery, results, isLoading, error } = useSearch(
    store === 'COLES' ? 'coles' : 'iga'
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder={`Search ${store === 'COLES' ? 'Coles' : 'IGA'} products…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          data-testid="admin-search-input"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          inputMode="search"
          enterKeyHint="search"
        />
        {isLoading && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {results.length > 0 && (
        <div className="flex flex-col gap-2" data-testid="search-results">
          {results.map((result) => (
            <SearchResultCard
              key={result.colesProductId}
              result={result}
              alreadyAdded={existingIds.has(result.colesProductId)}
              onAdd={() => onAdd(result)}
            />
          ))}
        </div>
      )}

      {!isLoading && !error && query.trim() && results.length === 0 && (
        <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
      )}
    </div>
  )
}
