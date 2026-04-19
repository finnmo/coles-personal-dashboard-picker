import useSWR from 'swr'
import type { EnrichedProduct, ProductsResponse, Store } from '@/types/product'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useProducts(store: Store) {
  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
    `/api/products?store=${store}`,
    fetcher,
    { refreshInterval: 0 }
  )

  return {
    products: data?.products as EnrichedProduct[] | undefined,
    isLoading,
    error,
    mutate,
  }
}
