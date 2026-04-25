export type Product = {
  id: string
  name: string
  imageUrl: string | null
  offProductId: string | null
  repurchaseIntervalDays: number
  lastPurchasedAt: string | null
  createdAt: string
  updatedAt: string
}

export type EnrichedProduct = Product & {
  priorityScore: number
  isOverdue: boolean
  isNew: boolean
  daysSinceLastPurchase: number | null
}

export type ProductsResponse = {
  products: EnrichedProduct[]
}
