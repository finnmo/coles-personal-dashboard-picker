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
      data: { name: 'Butter', repurchaseIntervalDays: 21 },
    })
    const found = await db.product.findUnique({ where: { id: created.id } })
    expect(found).not.toBeNull()
    expect(found!.name).toBe('Butter')
    expect(found!.repurchaseIntervalDays).toBe(21)
    expect(found!.lastPurchasedAt).toBeNull()
  })

  it('enforces unique offProductId constraint', async () => {
    await db.product.create({ data: { name: 'Milk', offProductId: 'barcode-uid-1' } })
    await expect(
      db.product.create({ data: { name: 'Milk Lite', offProductId: 'barcode-uid-1' } })
    ).rejects.toMatchObject({ code: 'P2002' })
  })

  it('allows null offProductId on multiple rows', async () => {
    await db.product.create({ data: { name: 'Apple' } })
    await db.product.create({ data: { name: 'Orange' } })
    const count = await db.product.count()
    expect(count).toBe(2)
  })

  it('updates lastPurchasedAt', async () => {
    const created = await db.product.create({ data: { name: 'Eggs' } })
    const now = new Date()
    const updated = await db.product.update({
      where: { id: created.id },
      data: { lastPurchasedAt: now },
    })
    expect(updated.lastPurchasedAt).not.toBeNull()
    expect(updated.lastPurchasedAt!.getTime()).toBeCloseTo(now.getTime(), -2)
  })

  it('deletes a product', async () => {
    const created = await db.product.create({ data: { name: 'Yogurt' } })
    await db.product.delete({ where: { id: created.id } })
    const gone = await db.product.findUnique({ where: { id: created.id } })
    expect(gone).toBeNull()
  })

  it('updates repurchaseIntervalDays', async () => {
    const created = await db.product.create({ data: { name: 'Juice' } })
    expect(created.repurchaseIntervalDays).toBe(14)
    const updated = await db.product.update({
      where: { id: created.id },
      data: { repurchaseIntervalDays: 30 },
    })
    expect(updated.repurchaseIntervalDays).toBe(30)
  })
})
