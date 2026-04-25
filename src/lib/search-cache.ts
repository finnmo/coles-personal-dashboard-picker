import type { ColesSearchResult } from './coles-api'
import { makeSearchCache } from './make-search-cache'

const colesSearchCache = makeSearchCache<ColesSearchResult>()

export const getCached = (query: string) => colesSearchCache.getCached(query)
export const setCached = (query: string, results: ColesSearchResult[]) =>
  colesSearchCache.setCached(query, results)
export const flush = () => colesSearchCache.flush()
