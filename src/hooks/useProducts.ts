import useSWR from 'swr'
import type { EnrichedProduct, ProductsResponse } from '@/types/product'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>('/api/products', fetcher, {
    refreshInterval: 0,
  })

  return {
    products: data?.products as EnrichedProduct[] | undefined,
    isLoading,
    error,
    mutate,
  }
}
