const TTL_MS = 10 * 60 * 1000

type CacheEntry<T> = { results: T[]; expiresAt: number }

export interface SearchCache<T> {
  getCached(query: string): T[] | null
  setCached(query: string, results: T[]): void
  flush(): void
}

export function makeSearchCache<T>(): SearchCache<T> {
  const store = new Map<string, CacheEntry<T>>()

  return {
    getCached(query: string): T[] | null {
      const entry = store.get(query.toLowerCase().trim())
      if (!entry || Date.now() > entry.expiresAt) return null
      return entry.results
    },

    setCached(query: string, results: T[]): void {
      store.set(query.toLowerCase().trim(), { results, expiresAt: Date.now() + TTL_MS })
    },

    flush(): void {
      store.clear()
    },
  }
}
