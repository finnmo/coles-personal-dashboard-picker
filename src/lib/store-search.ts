import { searchColesProducts } from '@/lib/coles-api'
import { searchWoolworthsProducts } from '@/lib/woolworths-api'
import { searchIgaProducts } from '@/lib/iga-api'

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

/**
 * Searches Coles, Woolworths, and IGA concurrently.
 * Partial failures are silently dropped — if one store is down the others
 * still contribute results. Results are interleaved by store in order:
 * Coles first, then Woolworths, then IGA.
 */
export async function searchStores(query: string): Promise<StoreSearchResult[]> {
  const [colesResult, woolworthsResult, igaResult] = await Promise.allSettled([
    searchColesProducts(query),
    searchWoolworthsProducts(query),
    searchIgaProducts(query),
  ])

  const coles = colesResult.status === 'fulfilled' ? colesResult.value : []
  const woolworths = woolworthsResult.status === 'fulfilled' ? woolworthsResult.value : []
  const iga = igaResult.status === 'fulfilled' ? igaResult.value : []

  return [...coles, ...woolworths, ...iga]
}
