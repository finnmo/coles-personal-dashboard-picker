import { searchColesProducts, ColesApiError } from '@/lib/coles-api'
import { searchWoolworthsProducts, WoolworthsApiError } from '@/lib/woolworths-api'
import { searchIgaProducts } from '@/lib/iga-api'
import logger from '@/lib/logger'

export type Store = 'coles' | 'woolworths' | 'iga'

export type StoreSearchResult = {
  externalId: string // "coles:5050551" | "woolworths:234567" | "iga:891011"
  store: Store
  name: string
  imageUrl: string | null
  brand: string | null
  quantity: string | null
  price: number | null
}

// ---------------------------------------------------------------------------
// RapidAPI circuit breaker
//
// The free tier allows 1,000 requests/month across Coles + Woolworths
// (2 calls per search). A single 429 response trips the breaker and
// suspends all RapidAPI calls for 1 hour, then retries automatically.
// IGA (free scrape) is never suspended and continues returning results.
// ---------------------------------------------------------------------------
const SUSPENSION_DURATION_MS = 60 * 60 * 1000 // 1 hour

let rapidApiSuspendedUntil = 0

export function isRapidApiSuspended(): boolean {
  return Date.now() < rapidApiSuspendedUntil
}

export function suspendRapidApi(): void {
  rapidApiSuspendedUntil = Date.now() + SUSPENSION_DURATION_MS
  logger.warn(
    { resumesAt: new Date(rapidApiSuspendedUntil).toISOString() },
    'RapidAPI rate limit hit — Coles/Woolworths search suspended for 1 hour. IGA results still available.'
  )
}

/** Exposed for tests only — resets the circuit breaker. */
export function _resetRapidApiSuspension(): void {
  rapidApiSuspendedUntil = 0
}

async function safeColes(query: string): Promise<StoreSearchResult[]> {
  if (isRapidApiSuspended()) return []
  try {
    return await searchColesProducts(query)
  } catch (err) {
    if (err instanceof ColesApiError && err.status === 429) {
      suspendRapidApi()
      return []
    }
    throw err
  }
}

async function safeWoolworths(query: string): Promise<StoreSearchResult[]> {
  if (isRapidApiSuspended()) return []
  try {
    return await searchWoolworthsProducts(query)
  } catch (err) {
    if (err instanceof WoolworthsApiError && err.status === 429) {
      suspendRapidApi()
      return []
    }
    throw err
  }
}

/**
 * Searches Coles, Woolworths, and IGA concurrently.
 * Partial failures are silently dropped — if one store is down the others
 * still contribute results. If RapidAPI returns 429 the circuit breaker
 * trips and Coles/Woolworths are skipped for 1 hour to protect the free
 * tier limit; IGA always runs. Results are ordered Coles → Woolworths → IGA.
 */
export async function searchStores(query: string): Promise<StoreSearchResult[]> {
  const [colesResult, woolworthsResult, igaResult] = await Promise.allSettled([
    safeColes(query),
    safeWoolworths(query),
    searchIgaProducts(query),
  ])

  const coles = colesResult.status === 'fulfilled' ? colesResult.value : []
  const woolworths = woolworthsResult.status === 'fulfilled' ? woolworthsResult.value : []
  const iga = igaResult.status === 'fulfilled' ? igaResult.value : []

  return [...coles, ...woolworths, ...iga]
}
