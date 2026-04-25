import useSWR from 'swr'
import type { EnrichedProduct, ProductsResponse } from '@/types/product'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useOverdueCounts() {
  const { data } = useSWR<ProductsResponse>('/api/products', fetcher)

  return {
    total: (data?.products ?? []).filter((p: EnrichedProduct) => p.isOverdue).length,
  }
}
