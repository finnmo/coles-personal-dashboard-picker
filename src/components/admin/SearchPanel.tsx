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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder={`Search ${store === 'COLES' ? 'Coles' : 'IGA'} products…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          data-testid="admin-search-input"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
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
