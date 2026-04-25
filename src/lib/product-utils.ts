import { computePriority } from '@/lib/priority'
import type { EnrichedProduct, Store } from '@/types/product'

export type PrismaProduct = {
  id: string
  name: string
  imageUrl: string | null
  store: string
  colesProductId: string | null
  igaProductId: string | null
  repurchaseIntervalDays: number
  lastPurchasedAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export function enrichProduct(product: PrismaProduct): EnrichedProduct {
  const priority = computePriority({
    lastPurchasedAt: product.lastPurchasedAt,
    repurchaseIntervalDays: product.repurchaseIntervalDays,
  })
  return {
    id: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    store: product.store as Store,
    colesProductId: product.colesProductId,
    igaProductId: product.igaProductId,
    repurchaseIntervalDays: product.repurchaseIntervalDays,
    lastPurchasedAt: product.lastPurchasedAt?.toISOString() ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    ...priority,
  }
}
