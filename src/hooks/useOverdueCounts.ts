import useSWR from 'swr'
import type { EnrichedProduct, ProductsResponse } from '@/types/product'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useOverdueCounts() {
  const { data: colesData } = useSWR<ProductsResponse>('/api/products?store=COLES', fetcher)
  const { data: igaData } = useSWR<ProductsResponse>('/api/products?store=IGA', fetcher)

  return {
    COLES: (colesData?.products ?? []).filter((p: EnrichedProduct) => p.isOverdue).length,
    IGA: (igaData?.products ?? []).filter((p: EnrichedProduct) => p.isOverdue).length,
  }
}
