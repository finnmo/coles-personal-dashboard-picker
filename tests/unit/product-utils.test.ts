import { describe, it, expect } from 'vitest'
import { enrichProduct } from '@/lib/product-utils'
import type { PrismaProduct } from '@/lib/product-utils'

const base: PrismaProduct = {
  id: 'p1',
  name: 'Milk',
  imageUrl: null,
  offProductId: '9300617105028',
  repurchaseIntervalDays: 7,
  lastPurchasedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
}

describe('enrichProduct', () => {
  it('serialises dates to ISO strings', () => {
    const result = enrichProduct(base)
    expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z')
    expect(result.updatedAt).toBe('2024-01-01T00:00:00.000Z')
    expect(result.lastPurchasedAt).toBeNull()
  })

  it('marks new products (no lastPurchasedAt)', () => {
    const result = enrichProduct(base)
    expect(result.isNew).toBe(true)
    expect(result.priorityScore).toBe(0)
  })

  it('computes priority for purchased products', () => {
    const daysAgo = (n: number) => {
      const d = new Date()
      d.setDate(d.getDate() - n)
      return d
    }
    const result = enrichProduct({ ...base, lastPurchasedAt: daysAgo(14) })
    expect(result.isNew).toBe(false)
    expect(result.priorityScore).toBeCloseTo(2, 0)
    expect(result.isOverdue).toBe(true)
  })

  it('passes offProductId through', () => {
    expect(enrichProduct(base).offProductId).toBe('9300617105028')
    expect(enrichProduct({ ...base, offProductId: null }).offProductId).toBeNull()
  })
})
