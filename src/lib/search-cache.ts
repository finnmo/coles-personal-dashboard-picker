import type { ColesSearchResult } from './coles-api'

const TTL_MS = 10 * 60 * 1000 // 10 minutes

type CacheEntry = { results: ColesSearchResult[]; expiresAt: number }

const cache = new Map<string, CacheEntry>()

export function getCached(query: string): ColesSearchResult[] | null {
  const entry = cache.get(query.toLowerCase().trim())
  if (!entry || Date.now() > entry.expiresAt) return null
  return entry.results
}

export function setCached(query: string, results: ColesSearchResult[]): void {
  cache.set(query.toLowerCase().trim(), { results, expiresAt: Date.now() + TTL_MS })
}
