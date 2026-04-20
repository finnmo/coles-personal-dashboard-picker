// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { db } from '@/lib/db'

async function cleanDb() {
  await db.product.deleteMany()
}

beforeEach(cleanDb)
afterAll(cleanDb)

describe('Product DB operations', () => {
  it('creates and retrieves a product', async () => {
    const created = await db.product.create({
      data: { name: 'Butter', store: 'COLES', repurchaseIntervalDays: 21 },
    })
    const found = await db.product.findUnique({ where: { id: created.id } })
    expect(found).not.toBeNull()
    expect(found!.name).toBe('Butter')
    expect(found!.repurchaseIntervalDays).toBe(21)
    expect(found!.lastPurchasedAt).toBeNull()
  })

  it('enforces unique colesProductId constraint', async () => {
    await db.product.create({ data: { name: 'Milk', store: 'COLES', colesProductId: 'uid-1' } })
    await expect(
      db.product.create({ data: { name: 'Milk Lite', store: 'COLES', colesProductId: 'uid-1' } })
    ).rejects.toMatchObject({ code: 'P2002' })
  })

  it('allows same colesProductId to be null on multiple rows', async () => {
    await db.product.create({ data: { name: 'Apple', store: 'COLES' } })
    await db.product.create({ data: { name: 'Orange', store: 'COLES' } })
    const count = await db.product.count({ where: { store: 'COLES' } })
    expect(count).toBe(2)
  })

  it('filters by store', async () => {
    await db.product.createMany({
      data: [
        { name: 'Coles Milk', store: 'COLES' },
        { name: 'IGA Bread', store: 'IGA' },
        { name: 'Coles Cheese', store: 'COLES' },
      ],
    })
    const colesProducts = await db.product.findMany({ where: { store: 'COLES' } })
    expect(colesProducts).toHaveLength(2)
    expect(colesProducts.every((p) => p.store === 'COLES')).toBe(true)
  })

  it('updates lastPurchasedAt', async () => {
    const created = await db.product.create({ data: { name: 'Eggs', store: 'IGA' } })
    const now = new Date()
    const updated = await db.product.update({
      where: { id: created.id },
      data: { lastPurchasedAt: now },
    })
    expect(updated.lastPurchasedAt).not.toBeNull()
    expect(updated.lastPurchasedAt!.getTime()).toBeCloseTo(now.getTime(), -2)
  })

  it('deletes a product', async () => {
    const created = await db.product.create({ data: { name: 'Yogurt', store: 'COLES' } })
    await db.product.delete({ where: { id: created.id } })
    const gone = await db.product.findUnique({ where: { id: created.id } })
    expect(gone).toBeNull()
  })

  it('updates repurchaseIntervalDays', async () => {
    const created = await db.product.create({ data: { name: 'Juice', store: 'IGA' } })
    expect(created.repurchaseIntervalDays).toBe(14)
    const updated = await db.product.update({
      where: { id: created.id },
      data: { repurchaseIntervalDays: 30 },
    })
    expect(updated.repurchaseIntervalDays).toBe(30)
  })
})
