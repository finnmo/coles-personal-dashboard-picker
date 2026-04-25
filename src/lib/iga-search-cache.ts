import { makeSearchCache } from './make-search-cache'
import type { IgaSearchResult } from './iga-api'

export const igaSearchCache = makeSearchCache<IgaSearchResult>()
